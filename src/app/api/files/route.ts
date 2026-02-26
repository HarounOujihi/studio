import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.OIDC_SECRET || "your-secret-key"
);

type JWTPayload = {
  user?: {
    id: string;
  };
  exp?: number;
};

const s3Client = new S3Client({
  endpoint: process.env.S3_HOST,
  region: process.env.S3_REGION || "auto",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
  forcePathStyle: true,
});

// GET - List files from S3
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("next-auth.session-token");

    if (!sessionToken) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { payload } = await jwtVerify(sessionToken.value, JWT_SECRET);
    const userId = (payload as unknown as JWTPayload).user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const url = new URL(request.url);
    const orgId = url.searchParams.get("orgId");
    const fileType = url.searchParams.get("type"); // images, documents, all

    if (!orgId) {
      return NextResponse.json({ error: "L'ID de l'organisation est requis" }, { status: 400 });
    }

    // Verify user has access to this organization
    const hasAccess = await prisma.userOrganization.findFirst({
      where: {
        userId,
        idOrg: orgId,
      },
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const bucketName = process.env.S3_BUCKET;
    if (!bucketName) {
      return NextResponse.json({ error: "Configuration S3 manquante" }, { status: 500 });
    }

    // List objects from S3
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: `${orgId}/`,
      })
    );

    // Filter and format files
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
    const documentExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "txt", "csv"];

    let files = (response.Contents || [])
      .filter((item) => item.Key && item.Key !== `${orgId}/`)
      .map((item) => {
        const key = item.Key!;
        const filename = key.split("/").pop() || "";
        const ext = filename.split(".").pop()?.toLowerCase() || "";
        const isImage = imageExtensions.includes(ext);
        const isDocument = documentExtensions.includes(ext);

        return {
          key,
          filename,
          extension: ext,
          size: item.Size || 0,
          lastModified: item.LastModified?.toISOString() || null,
          isImage,
          isDocument,
          type: isImage ? "image" : isDocument ? "document" : "other",
        };
      });

    // Filter by type if specified
    if (fileType === "images") {
      files = files.filter((f) => f.isImage);
    } else if (fileType === "documents") {
      files = files.filter((f) => f.isDocument);
    }

    // Sort by last modified (newest first)
    files.sort((a, b) => {
      if (!a.lastModified) return 1;
      if (!b.lastModified) return -1;
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des fichiers" },
      { status: 500 }
    );
  }
}

// DELETE - Delete files from S3
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("next-auth.session-token");

    if (!sessionToken) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { payload } = await jwtVerify(sessionToken.value, JWT_SECRET);
    const userId = (payload as unknown as JWTPayload).user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const body = await request.json();
    const { keys, orgId } = body;

    if (!orgId) {
      return NextResponse.json({ error: "L'ID de l'organisation est requis" }, { status: 400 });
    }

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: "Aucun fichier sélectionné" }, { status: 400 });
    }

    // Verify user has access to this organization
    const hasAccess = await prisma.userOrganization.findFirst({
      where: {
        userId,
        idOrg: orgId,
      },
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const bucketName = process.env.S3_BUCKET;
    if (!bucketName) {
      return NextResponse.json({ error: "Configuration S3 manquante" }, { status: 500 });
    }

    // Delete files
    const deletePromises = keys.map(async (key: string) => {
      // Verify the key belongs to this organization
      if (!key.startsWith(`${orgId}/`)) {
        return { key, success: false, error: "Accès non autorisé à ce fichier" };
      }

      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
          })
        );
        return { key, success: true };
      } catch (error) {
        console.error(`Error deleting ${key}:`, error);
        return { key, success: false, error: "Erreur lors de la suppression" };
      }
    });

    const results = await Promise.all(deletePromises);

    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      return NextResponse.json({
        error: "Certains fichiers n'ont pas pu être supprimés",
        results,
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Error deleting files:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression des fichiers" },
      { status: 500 }
    );
  }
}

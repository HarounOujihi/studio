import { NextResponse } from "next/server";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { slugify } from "@/lib/utils/slugify";

// Supports both single file and multiple files upload
export async function POST(request: Request) {
  try {
    const body = await request.formData();
    const files = body.getAll("file") as File[];
    const orgId = body.get("orgId") || "guest";

    if (
      !files ||
      files.length === 0 ||
      !files.every((file) => file instanceof File)
    ) {
      return NextResponse.json(
        { success: false, message: "File(s) missing" },
        { status: 400 },
      );
    }

    const uploadPromises = files.map(async (file) => {
      const ext = file.name.split(".").pop() || "";
      const name = file.name.substring(0, file.name.lastIndexOf("."));

      // Generate unique filename
      const uniqueId = Math.random().toString(36).substring(2, 15);
      const filename = `${slugify(name)}-${uniqueId}.${ext}`;

      const upload = new Upload({
        client: new S3Client({
          endpoint: process.env.S3_HOST,
          region: process.env.S3_REGION || "auto",
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY || "",
            secretAccessKey: process.env.S3_SECRET_KEY || "",
          },
          forcePathStyle: true,
        }),
        params: {
          Bucket: process.env.S3_BUCKET,
          Key: `${orgId}/${filename}`,
          Body: Buffer.from(await file.arrayBuffer()),
          ContentType: file.type || "application/octet-stream",
          // Note: If AccessDenied still occurs, the S3 bucket needs a bucket policy allowing public read
        },
      });

      try {
        const result = await upload.done();
        return {
          name: file.name,
          key: result.Key,
          path: result.Key?.substring(result.Key?.indexOf("/") + 1),
          url: result.Location,
          success: true,
        };
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);
        return { name: file.name, success: false, error };
      }
    });

    const results = await Promise.allSettled(uploadPromises);

    const uploadedFiles = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    const failedCount = results.filter((r) => r.status === "rejected").length;

    if (failedCount && uploadedFiles.length === 0) {
      return NextResponse.json(
        { success: false, message: "All uploads failed", errors: results },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      { success: false, message: "Upload failed" },
      { status: 500 },
    );
  }
}

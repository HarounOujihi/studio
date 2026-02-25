import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
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

// GET - List all active global categories
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("next-auth.session-token");

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(sessionToken.value, JWT_SECRET);
    const userId = (payload as unknown as JWTPayload).user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const globalCategories = await prisma.globalCategory.findMany({
      where: { isActive: true },
      orderBy: { sortIndex: "asc" },
      select: {
        id: true,
        name: true,
        nameFr: true,
        slug: true,
        iconName: true,
        image: true,
      },
    });

    return NextResponse.json({ globalCategories });
  } catch (error) {
    console.error("Error fetching global categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch global categories" },
      { status: 500 }
    );
  }
}

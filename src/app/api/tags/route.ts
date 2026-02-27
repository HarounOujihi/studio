import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tags are global, no auth required for reading
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      where: {
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

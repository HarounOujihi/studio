import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idOrg = searchParams.get("idOrg");
    const idEtb = searchParams.get("idEtb");

    if (!idOrg || !idEtb) {
      return NextResponse.json(
        { error: "idOrg and idEtb are required" },
        { status: 400 }
      );
    }

    // Fetch recent headers from Prisma
    const headers = await prisma.header.findMany({
      where: {
        idOrg,
        idEtb,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      include: {
        _count: {
          select: { Movement: true },
        },
      },
    });

    // Transform to match expected format
    const headersWithCounts = headers.map((header) => ({
      id: header.id,
      reference: header.reference,
      status: header.status,
      taxedAmount: header.taxedAmount,
      createdAt: header.createdAt,
      itemsCount: header._count.Movement,
    }));

    return NextResponse.json({
      headers: headersWithCounts,
    });
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent orders" },
      { status: 500 }
    );
  }
}

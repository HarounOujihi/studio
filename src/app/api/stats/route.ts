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

    // Get article count
    const articleCount = await prisma.article.count({
      where: { idOrg, idEtb },
    });

    // Get order count
    const orderCount = await prisma.header.count({
      where: {
        idOrg,
        idEtb,
        docType: { in: ["ORDER", "DELIVERY_ORDER"] },
      },
    });

    // Get customer count
    const clientCount = await prisma.client.count({
      where: { idOrg, idEtb },
    });

    // Get revenue (sum of taxed amounts for orders)
    const orders = await prisma.header.findMany({
      where: {
        idOrg,
        idEtb,
        docType: { in: ["ORDER", "DELIVERY_ORDER"] },
        status: { not: "CANCELLED" },
      },
      select: { taxedAmount: true },
    });

    const revenue = orders.reduce((sum, order) => sum + (order.taxedAmount || 0), 0);

    return NextResponse.json({
      articleCount,
      orderCount,
      clientCount,
      revenue,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idOrg = searchParams.get("idOrg");
    const idEtb = searchParams.get("idEtb");

    if (!idOrg || !idEtb) {
      return NextResponse.json({ error: "idOrg and idEtb are required" }, { status: 400 });
    }

    const taxes = await prisma.tax.findMany({
      where: { idOrg, idEtb },
      orderBy: { designation: "asc" },
    });

    return NextResponse.json({ taxes });
  } catch (error) {
    console.error("Error fetching taxes:", error);
    return NextResponse.json({ error: "Failed to fetch taxes" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const currencies = await prisma.currency.findMany({
      select: {
        id: true,
        reference: true,
        designation: true,
        symbol: true,
        decimals: true,
      },
      orderBy: {
        designation: "asc",
      },
    });

    return NextResponse.json({ currencies });
  } catch (error) {
    console.error("Error fetching currencies:", error);
    return NextResponse.json(
      { error: "Failed to fetch currencies", currencies: [] },
      { status: 500 }
    );
  }
}

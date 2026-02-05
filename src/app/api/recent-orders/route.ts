import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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

    // Fetch headers from Convex (these are auto-synced from Prisma)
    const headers = await convex.query(api.headers.list, {
      idOrg,
      idEtb,
    });

    // Get movements for each header to count items
    const headersWithCounts = await Promise.all(
      (headers || []).map(async (header) => {
        const movements = await convex.query(api.movements.getByHeader, {
          idHeader: header.id,
        });
        return {
          ...header,
          itemsCount: movements.length,
        };
      })
    );

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

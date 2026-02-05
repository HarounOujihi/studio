import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    console.log("====> [AutoSync] Movement", action, data?.id);

    if (action === "create" || action === "update") {
      // Fetch full Movement from Prisma
      const { prisma } = await import("@/lib/prisma");
      const movement = await prisma.movement.findUnique({
        where: { id: data.id },
      });

      if (!movement) {
        return NextResponse.json(
          { error: "Movement not found" },
          { status: 404 }
        );
      }

      // Transform to Convex format
      const convexMovement = transformMovement(movement);

      // Sync to Convex
      await convex.mutation(api.movements.sync, convexMovement as any);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AutoSync] Movement sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync movement" },
      { status: 500 }
    );
  }
}

function transformMovement(movement: any) {
  const obj: Record<string, any> = {
    id: movement.id,
    idOrg: movement.idOrg,
    idEtb: movement.idEtb,
    idHeader: movement.idHeader,
    idArticle: movement.idArticle,
    qty: movement.qty,
    idUnit: movement.idUnit,
    codeOperation: movement.codeOperation,
  };

  // Optional fields
  if (movement.options) obj.options = movement.options;
  if (movement.idTax) obj.idTax = movement.idTax;
  if (movement.idPricing) obj.idPricing = movement.idPricing;
  if (movement.idDiscount) obj.idDiscount = movement.idDiscount;
  if (movement.idDeposit) obj.idDeposit = movement.idDeposit;
  if (movement.idLot) obj.idLot = movement.idLot;
  if (movement.untaxedAmount) obj.untaxedAmount = movement.untaxedAmount;
  if (movement.taxedAmount) obj.taxedAmount = movement.taxedAmount;

  return obj;
}

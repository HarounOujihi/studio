import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    console.log("====> [AutoSync] Header", action, data?.id);

    if (action === "create" || action === "update") {
      // Fetch full Header with relations from Prisma
      const { prisma } = await import("@/lib/prisma");
      const header = await prisma.header.findUnique({
        where: { id: data.id },
        include: {
          Movement: true,
        },
      });

      if (!header) {
        return NextResponse.json(
          { error: "Header not found" },
          { status: 404 }
        );
      }

      // Transform to Convex format
      const convexHeader = transformHeader(header);

      // Sync to Convex
      await convex.mutation(api.headers.sync, convexHeader as any);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AutoSync] Header sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync header" },
      { status: 500 }
    );
  }
}

function transformHeader(header: any) {
  const obj: Record<string, any> = {
    id: header.id,
    idOrg: header.idOrg,
    idEtb: header.idEtb,
    reference: header.reference,
    docType: header.docType,
    isSubArticle: false,
  };

  // Optional fields
  if (header.idClient) obj.idClient = header.idClient;
  if (header.idProvider) obj.idProvider = header.idProvider;
  if (header.idContact) obj.idContact = header.idContact;
  if (header.codeOperation) obj.codeOperation = header.codeOperation;
  if (header.idCommercialDoc) obj.idCommercialDoc = header.idCommercialDoc;
  if (header.idPhase) obj.idPhase = header.idPhase;
  if (header.idTax) obj.idTax = header.idTax;
  if (header.idDeposit) obj.idDeposit = header.idDeposit;
  if (header.status) obj.status = header.status;
  if (header.untaxedAmount) obj.untaxedAmount = header.untaxedAmount;
  if (header.taxedAmount) obj.taxedAmount = header.taxedAmount;
  if (header.headerGroup) obj.headerGroup = header.headerGroup;
  if (header.pickupAt) obj.pickupAt = header.pickupAt.getTime();
  if (header.deliveryClientName) obj.deliveryClientName = header.deliveryClientName;
  if (header.deliveryPhone) obj.deliveryPhone = header.deliveryPhone;
  if (header.deliveryEmail) obj.deliveryEmail = header.deliveryEmail;
  if (header.billingAddress) obj.billingAddress = header.billingAddress;
  if (header.deliveryAddress) obj.deliveryAddress = header.deliveryAddress;
  if (header.note) obj.note = header.note;
  if (header.createdAt) obj.createdAt = header.createdAt.getTime();
  if (header.updatedAt) obj.updatedAt = header.updatedAt.getTime();

  return obj;
}

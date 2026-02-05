import { PrismaClient } from "@prisma/client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const prisma = new PrismaClient();
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function syncData() {
  console.log("🔄 Starting Prisma to Convex sync...\n");

  // 1. Sync Users
  console.log("👥 Syncing users...");
  const users = await prisma.user.findMany();
  console.log(`   Found ${users.length} users in Prisma`);

  for (const user of users) {
    try {
      await convex.mutation(api.authHelpers.syncUser, {
        oidcId: user.oidcId,
        email: user.email || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        picture: user.picture || undefined,
      });
      console.log(`   ✓ Synced user: ${user.email || user.oidcId}`);
    } catch (e) {
      console.error(`   ✗ Failed to sync user ${user.oidcId}:`, e);
    }
  }

  // 2. Sync Organizations
  console.log("\n🏢 Syncing organizations...");
  const organizations = await prisma.organization.findMany();
  console.log(`   Found ${organizations.length} organizations in Prisma`);

  for (const org of organizations) {
    try {
      await convex.mutation(api.authHelpers.createOrganization, {
        id: org.id,
        reference: org.reference,
        name: org.name || undefined,
        logo: org.logo || undefined,
        active: org.active ?? undefined,
      });
      console.log(`   ✓ Synced organization: ${org.name || org.id}`);
    } catch (e) {
      console.error(`   ✗ Failed to sync organization ${org.id}:`, e);
    }
  }

  // 3. Sync User-Organization links
  console.log("\n🔗 Syncing user-organization links...");
  const userOrganizations = await prisma.userOrganization.findMany();
  console.log(`   Found ${userOrganizations.length} user-organization links in Prisma`);

  for (const uo of userOrganizations) {
    try {
      await convex.mutation(api.authHelpers.linkUserToOrganization, {
        userId: uo.userId,
        idOrg: uo.idOrg,
        role: uo.role,
      });
      console.log(`   ✓ Linked user ${uo.userId} to org ${uo.idOrg} (${uo.role})`);
    } catch (e) {
      console.error(`   ✗ Failed to link user ${uo.userId} to org ${uo.idOrg}:`, e);
    }
  }

  // 4. Sync Establishments
  console.log("\n🏪 Syncing establishments...");
  const establishments = await prisma.establishment.findMany();
  console.log(`   Found ${establishments.length} establishments in Prisma`);

  for (const etb of establishments) {
    try {
      await convex.mutation(api.authHelpers.createEstablishment, {
        id: etb.id,
        idOrg: etb.idOrg,
        reference: etb.reference,
        designation: etb.designation || undefined,
        idCurrency: etb.idCurrency || undefined,
        domain: etb.domain || undefined,
        isDefault: etb.isDefault ?? undefined,
        isHidden: etb.isHidden ?? undefined,
      });
      console.log(`   ✓ Synced establishment: ${etb.designation || etb.id}`);
    } catch (e) {
      console.error(`   ✗ Failed to sync establishment ${etb.id}:`, e);
    }
  }

  console.log("\n✅ Sync complete!");
  console.log("\n💡 Check your data at: http://127.0.0.1:6790/data");
}

syncData()
  .then(() => {
    console.log("\n🎉 All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Sync failed:", error);
    process.exit(1);
  });

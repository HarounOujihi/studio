import { PrismaClient } from "@prisma/client";
import { autoSyncMiddleware } from "./prisma-middleware";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Add auto-sync middleware
prisma.$use(autoSyncMiddleware);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

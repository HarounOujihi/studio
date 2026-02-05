import { Prisma } from "@prisma/client";

/**
 * Auto-sync middleware for Prisma
 *
 * Automatically syncs records to Convex when they are created/updated/deleted in Prisma.
 * Add models to the syncConfig to enable auto-sync for them.
 *
 * Usage in prisma.ts:
 * import { autoSyncMiddleware } from "./lib/prisma-middleware";
 * prisma.$use(autoSyncMiddleware);
 */

// Models to auto-sync to Convex
type SyncModel = "Header" | "Movement";

const syncConfig: Record<SyncModel, {
  enabled: boolean;
  syncOnCreate: boolean;
  syncOnUpdate: boolean;
  syncOnDelete: boolean;
}> = {
  Header: {
    enabled: true,
    syncOnCreate: true,
    syncOnUpdate: true,
    syncOnDelete: false, // Usually we want to keep deleted orders
  },
  Movement: {
    enabled: true,
    syncOnCreate: true,
    syncOnUpdate: true,
    syncOnDelete: false,
  },
};

export const autoSyncMiddleware: Prisma.Middleware = async (params, next) => {
  const result = await next(params);

  // Check if this model/action should be synced
  const modelName = params.model as SyncModel;
  const config = syncConfig[modelName];

  if (!config || !config.enabled) {
    return result;
  }

  const action = params.action;
  const shouldSync =
    (action === "create" && config.syncOnCreate) ||
    (action === "update" && config.syncOnUpdate) ||
    (action === "delete" && config.syncOnDelete);

  if (!shouldSync) {
    return result;
  }

  // Trigger sync in background (don't await)
  syncToConvex(modelName, action, result).catch((error) => {
    console.error(`[AutoSync] Failed to sync ${modelName}:`, error);
  });

  return result;
};

async function syncToConvex(model: SyncModel, action: string, data: any) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.warn("[AutoSync] NEXT_PUBLIC_CONVEX_URL not set");
    return;
  }

  const endpoint = `/api/sync/${model.toLowerCase()}s`;

  try {
    await fetch(`${process.env.PUBLIC_HOST || "http://localhost:3000"}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        data,
      }),
    });
    console.log(`[AutoSync] Synced ${model} ${action}:`, data?.id || data);
  } catch (error) {
    console.error(`[AutoSync] Error syncing ${model}:`, error);
  }
}

# Row Level Security (RLS) Migration Guide

## Old System (PostgreSQL + Postgraphile)

### How it worked:

1. **Scope Header**: Client sends `Scope: <orgId>:<etbId>` header

2. **Middleware** (`/backoffice/api/server.ts`):
   - Extracted `org` and `etb` from scope header
   - Set PostgreSQL local settings:
     ```sql
     SET jwt.claims.org = 'org123'
     SET jwt.claims.etb = 'etb456'
     SET jwt.claims.sub = 'user789'
     SET jwt.claims.role = 'reg_user'
     ```

3. **RLS Function** (`curr_user_org_etb`):
   ```sql
   CREATE OR REPLACE FUNCTION curr_user_org_etb(org_id text, etb_id text)
   RETURNS boolean AS $$
   BEGIN
     RETURN
       (org_id IN (
           SELECT a."idOrg"
           FROM "UserOrganization" a
           WHERE a."userId" = current_setting('jwt.claims.sub', true)
       ))
       AND (
           current_setting('jwt.claims.org', true) = ''
           OR org_id = current_setting('jwt.claims.org', true)
       )
       AND (
           current_setting('jwt.claims.etb', true) = ''
           OR etb_id = current_setting('jwt.claims.etb', true)
       );
   END;
   $$ LANGUAGE plpgsql;
   ```

4. **Table Policies**: Each table had RLS policies using the function:
   ```sql
   CREATE POLICY rls_select_reg_user ON "Article"
   FOR SELECT TO "reg_user"
   USING (curr_user_org_etb("idOrg", "idEtb"));
   ```

### Key Points:
- **Empty scope** = access to all user's organizations/establishments
- **Specific scope** = access to only that organization/establishment
- **Super admin** = bypasses all restrictions

---

## New System (Convex-based)

### Challenge:
- Convex doesn't use PostgreSQL or SQL
- No RLS at database level
- Need application-level access control

### Solution Options:

#### Option 1: Convex Auth + Custom Rules (Recommended)

Use Convex's built-in auth with custom validation in functions:

```typescript
// convex/auth.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper to check user's access
async function getUserOrganizations(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_oidc", (q) => q.eq("oidcId", identity.subject))
    .first();

  if (!user) return null;

  const userOrgs = await ctx.db
    .query("userOrganizations")
    .withIndex("by_user", (q) => q.eq("userId", user.oidcId))
    .collect();

  return userOrgs.map(uo => uo.idOrg);
}

// Query with access control
export const listArticles = query({
  args: {
    orgId: v.optional(v.string()),
    etbId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Get user's accessible organizations
    const userOrgs = await getUserOrganizations(ctx);
    if (!userOrgs || userOrgs.length === 0) return [];

    // Filter by scope if provided
    if (args.orgId && !userOrgs.includes(args.orgId)) {
      return []; // User doesn't have access to this org
    }

    // Query with filtering
    let query = ctx.db.query("articles");

    // Filter by organization
    if (args.orgId) {
      query = query.withIndex("by_org_etb", (q) =>
        q.eq("idOrg", args.orgId)
      );
    }

    if (args.etbId) {
      query = query.withIndex("by_org_etb", (q) =>
        q.eq("idOrg", args.orgId).eq("idEtb", args.etbId)
      );
    }

    // If no specific scope, get all user's organizations
    if (!args.orgId) {
      const articles = await query.collect();
      return articles.filter(a => userOrgs.includes(a.idOrg));
    }

    return await query.collect();
  },
});
```

#### Option 2: Hybrid Approach (Prisma + Convex)

Keep Prisma/PostgreSQL for data requiring RLS, use Convex for real-time:

1. **Convex**: Real-time data, less sensitive data
2. **Prisma**: Core business data with RLS protection
3. **Sync**: Keep data in sync between both

```typescript
// API route that applies RLS
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession();
  const scope = req.headers.get("scope") || "";
  const [orgId, etbId] = scope.split(":");

  // Set Prisma session variables for RLS
  await prisma.$executeRaw`SET LOCAL jwt.claims.org = ${orgId}`;
  await prisma.$executeRaw`SET LOCAL jwt.claims.etb = ${etbId}`;
  await prisma.$executeRaw`SET LOCAL jwt.claims.sub = ${session?.user?.id}`;

  // RLS is automatically applied
  const articles = await prisma.article.findMany();

  return Response.json(articles);
}
```

#### Option 3: Middleware-based Scope (Client-side + API)

Pass scope from client to server via headers/cookies:

```typescript
// Middleware that injects scope into requests
import { createMiddlewareClient } from "@/lib/middleware";

export default createMiddlewareClient({
  transforms: [
    // Add scope header to all requests
    async ({ req, ctx }) => {
      const scope = cookies().get("scope")?.value;
      if (scope) {
        req.headers.set("scope", scope);
      }
      return NextResponse.next();
    },
  ],
});

// Client-side - set scope when switching org/etb
import { useSetAtom } from "jotai";
import { currentScopeAtom } from "@/lib/store/auth-oidc";

function useSetScope() {
  const setScope = useSetAtom(currentScopeAtom);

  return useCallback((orgId: string, etbId: string) => {
    const scope = `${orgId}:${etbId}`;
    document.cookie = `scope=${scope}; path=/; SameSite=Lax`;
    setScope({ orgId, etbId });
  }, [setScope]);
}
```

---

## Recommended Implementation

### For Convex-based app:

1. **Application-level filtering** in all Convex functions
2. **Scope management** via Jotai atoms (already implemented)
3. **API routes** (if needed) that read scope from cookies

### Example pattern:

```typescript
// convex/rules.ts - Access control utilities
export async function checkAccess(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  orgId: string,
  etbId?: string
) {
  const userOrg = await ctx.db
    .query("userOrganizations")
    .withIndex("by_user_org", (q) =>
      q.eq("userId", userId).eq("idOrg", orgId)
    )
    .first();

  if (!userOrg) return false;

  // If etbId specified, check if user has access
  if (etbId) {
    // Check establishment access...
  }

  return true;
}
```

### Key differences:

| Old (Postgres) | New (Convex) |
|---|---|
| RLS in database | Filtering in application code |
| `SET LOCAL` for claims | Direct function checks |
| Scope from header | Scope from cookies/state |
| Automatic filtering | Manual filtering per query |

---

## Migration Steps:

1. ✅ Keep scope management in Jotai atoms
2. ✅ Implement access control checks in Convex functions
3. ⬜ Add scope to API route requests (if using API routes)
4. ⬜ Consider using Convex custom auth for role-based access
5. ⬜ Test access control across all operations

# Convex + Prisma Realtime Articles Implementation

## Overview

This implementation demonstrates how to combine **Convex** (for realtime features) with **Prisma** (your existing production database) to create a professional admin interface with live data synchronization.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   React Client   │         │   API Routes     │         │
│  │                  │         │                  │         │
│  │  • useQuery()    │◄────────┤  • /api/articles │         │
│  │  • Realtime      │         │    /sync         │         │
│  │  • Auto-update   │         └────────┬─────────┘         │
│  └──────────────────┘                  │                    │
│         ▲                              │                    │
│         │                              ▼                    │
│         │                     ┌──────────────────┐         │
│         │                     │     Prisma       │         │
│         │                     │                  │         │
│         │                     │  • PostgreSQL    │         │
│         │                     │  • Production DB │         │
│         │                     └──────────────────┘         │
│         │                                                    │
│         │                    ┌──────────────────┐          │
│         └────────────────────┤      Convex      │          │
│              (Websocket)      │                  │          │
│                              │  • Realtime sync │          │
│                              │  • Query API     │          │
│                              │  • Mutations     │          │
│                              └──────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Features

✅ **Realtime Updates**: Articles update instantly via Convex WebSockets
✅ **Responsive Design**: Professional admin UI that works on mobile, tablet, and desktop
✅ **Dual Data Source**: Keep Prisma as source of truth, use Convex for realtime
✅ **Sync on Demand**: Manual sync button to pull data from Prisma to Convex
✅ **Filtering & Search**: Filter by publication status, product type, and search
✅ **View Modes**: Table view for desktop, grid/card view for all devices
✅ **Type Safety**: Full TypeScript support with Convex and Prisma

## File Structure

```
studio/
├── convex/
│   ├── schema.ts              # Convex database schema
│   ├── articles.ts            # Queries & mutations for articles
│   └── _generated/            # Auto-generated types
├── src/
│   ├── app/
│   │   ├── admin/articles/
│   │   │   └── page.tsx       # Admin UI (realtime)
│   │   ├── api/
│   │   │   └── articles/
│   │   │       └── sync/
│   │   │           └── route.ts  # Prisma → Convex sync endpoint
│   │   └── layout.tsx         # Root layout with providers
│   └── components/
│       └── providers/
│           └── convex-provider.tsx
└── schema.prisma              # Your production database schema
```

## Setup Instructions

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
CONVEX_DEPLOYMENT_KEY=your-deployment-key

# Prisma (existing)
DATABASE_URL=postgresql://...
```

### 2. Initialize Convex

```bash
# Login to Convex
npx convex dev

# This will:
# - Create a Convex project
# - Generate the schema types
# - Start the dev server
```

### 3. Run the Development Server

```bash
npm run dev
```

### 4. Access the Admin Interface

Navigate to: `http://localhost:3000/admin/articles`

## Usage

### Initial Setup

1. **Enter your credentials**:
   - Organization ID (from your Prisma database)
   - Establishment ID (from your Prisma database)

2. **Click "Sync from Prisma"**:
   - This fetches articles from your PostgreSQL database
   - Syncs them to Convex for realtime access
   - Shows a success message with the count

### Using the Interface

#### Filter Articles
- **Search**: Find articles by name, reference, or description
- **Status Filter**: Show All / Published / Draft
- **Organization/Establishment**: Filter by specific org or establishment

#### View Modes
- **Table View**: Traditional table layout (desktop)
- **Grid View**: Card-based layout (great for mobile)

#### Realtime Updates
- When data changes in Convex, the UI updates **automatically**
- No need to refresh the page
- Perfect for collaborative teams

## API Endpoints

### POST /api/articles/sync
Sync multiple articles from Prisma to Convex.

**Request:**
```json
{
  "idOrg": "org_123",
  "idEtb": "etb_456",
  "limit": 50
}
```

**Response:**
```json
{
  "success": true,
  "synced": 42,
  "results": [
    {
      "id": "article_1",
      "action": "created",
      "convexId": "..."
    }
  ]
}
```

### GET /api/articles/sync?id=ARTICLE_ID
Sync a single article.

**Example:**
```bash
curl "http://localhost:3000/api/articles/sync?id=article_123"
```

## Convex Functions

### Queries

#### `list`
Fetch articles with optional filters.

```typescript
const articles = useQuery(api.articles.list, {
  idOrg: "org_123",
  idEtb: "etb_456",
  isPublish: true,
  productType: "PHYSICAL_PRODUCT"
});
```

#### `get`
Fetch a single article by ID.

```typescript
const article = useQuery(api.articles.get, {
  id: "article_123"
});
```

### Mutations

#### `sync`
Sync a single article to Convex.

```typescript
const result = await mutation(api.articles.sync, articleData);
```

#### `syncBulk`
Sync multiple articles.

```typescript
const results = await mutation(api.articles.syncBulk, {
  articles: [article1, article2, ...]
});
```

#### `remove`
Delete an article from Convex.

```typescript
await mutation(api.articles.remove, { id: "article_123" });
```

## Data Schema

The Convex schema mirrors your Prisma `Article` model with these key fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key (from Prisma) |
| `idOrg` | string | Organization ID |
| `idEtb` | string | Establishment ID |
| `reference` | string | Article reference code |
| `designation` | string? | Article name |
| `description` | string? | Full description |
| `media` | string? | Main image URL |
| `gallery` | string[]? | Additional images |
| `productType` | string? | PHYSICAL_PRODUCT, DIGITAL_PRODUCT, SERVICE, WEBINAR |
| `isPublish` | boolean? | Published status |
| `isService` | boolean? | Is a service |
| `isDigitalProduct` | boolean? | Is digital |
| `lastSyncedAt` | number | Timestamp of last sync |

## UI Components Used

- **shadcn/ui**: Professional component library
  - `Badge`, `Button`, `Card`, `Input`, `Table`, `Skeleton`
  - `Sonner`: Toast notifications
- **Lucide React**: Icon library
- **Tailwind CSS**: Styling

## Responsive Design

The admin interface is fully responsive:

### Desktop (> 768px)
- Table view with sortable columns
- 4-column grid view
- Horizontal filters

### Tablet (481px - 768px)
- Card-based table view
- 2-column grid view
- Stacked filters

### Mobile (≤ 480px)
- Card view for all articles
- Single column grid
- Vertical filters
- Touch-friendly buttons

## Performance Tips

1. **Limit Initial Sync**: Start with `limit: 50` when syncing
2. **Use Filters**: Filter by `idOrg` and `idEtb` to reduce data transfer
3. **Pagination**: Implement pagination for large datasets (future enhancement)
4. **Convex Indexes**: Schema includes indexes for common queries

## Future Enhancements

- [ ] Automatic sync when Prisma data changes
- [ ] Pagination for large datasets
- [ ] Bulk actions (delete, publish, unpublish)
- [ ] Export to CSV/Excel
- [ ] Advanced filtering (date ranges, price ranges)
- [ ] Edit article details directly from UI
- [ ] Real-time stock levels
- [ ] WebSocket indicators (online/offline status)

## Troubleshooting

### "No Articles Found"
- Make sure you entered valid `idOrg` and `idEtb`
- Click "Sync from Prisma" to load data
- Check your database connection

### Sync Fails
- Verify `DATABASE_URL` in `.env.local`
- Check Convex deployment is running
- Look at browser console for errors

### Realtime Updates Not Working
- Check `NEXT_PUBLIC_CONVEX_URL` is set
- Ensure Convex deployment is active
- Verify WebSocket connection in browser DevTools

## Keeping GraphQL Tools

You mentioned keeping GraphQL tools for complex operations like `placeOrder`. This is a smart approach:

- **Convex**: Use for realtime features (articles list, notifications)
- **Prisma + GraphQL**: Use for complex transactions (orders, inventory)
- **Keep `gql` package**: For future GraphQL integration
- **Keep `graphql-codegen`**: For type-safe GraphQL operations

## Support

For issues or questions:
1. Check [Convex Documentation](https://docs.convex.dev)
2. Check [Prisma Documentation](https://www.prisma.io/docs)
3. Review the code comments in `src/app/admin/articles/page.tsx`

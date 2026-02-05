# Deployment Guide

## Architecture Overview

This app uses a **hybrid architecture** with two separate deployments:

```
┌─────────────────────────────────────────────────────┐
│                   User Browser                       │
└───────────────┬─────────────────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
┌──────────────┐  ┌──────────────┐
│   Next.js    │  │   Convex     │
│   (Frontend) │  │   (Backend)  │
│              │  │              │
│  • Vercel    │  │  • Convex    │
│  • Netlify   │  │    Cloud     │
│  • AWS       │  │              │
└──────────────┘  └──────────────┘
        │                │
        │                │
        ▼                ▼
┌──────────────┐  ┌──────────────┐
│   Browser    │  │   Prisma     │
│   Client     │  │   (Database) │
└──────────────┘  └──────────────┘
```

## Deployment Steps

### 1. Deploy Convex Backend

**Convex has its own cloud deployment** - you deploy to Convex's servers:

```bash
# Deploy Convex functions & schema
npx convex deploy
```

This:
- ✅ Deploys your Convex functions (`convex/*.ts`)
- ✅ Uploads your schema (`convex/schema.ts`)
- ✅ Provides a cloud URL (e.g., `https://happy-fox-123.convex.cloud`)
- ✅ Handles real-time websockets automatically
- ✅ No server management needed

**Environment Variables** (set in Convex dashboard):
- `CONVEX_DEPLOYMENT_KEY` - Auto-generated when you deploy

### 2. Deploy Next.js Frontend

**Deploy to any hosting platform**:

#### Option A: Vercel (Recommended for Next.js)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Environment Variables** (in Vercel dashboard):
```bash
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
DATABASE_URL=your-postgres-connection-string
```

#### Option B: Netlify
```bash
# Build command
npm run build

# Publish directory
.next
```

**Environment Variables** (in Netlify dashboard):
```bash
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
DATABASE_URL=your-postgres-connection-string
```

#### Option C: Docker/AWS/Other
Build the Docker image and deploy to your preferred host.

### 3. Deploy Prisma Database

**Your Prisma database stays where it is** - you don't need to migrate it!

Just ensure:
- ✅ Your `DATABASE_URL` is set in your Next.js hosting platform
- ✅ Database is accessible from your deployed app
- ✅ Run migrations: `npx prisma migrate deploy`

## Environment Variables Summary

### Local Development (.env.local)
```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=http://localhost:3210
CONVEX_DEPLOYMENT_KEY=your-local-key

# Prisma/Database
DATABASE_URL=postgresql://...
```

### Production (Set in hosting platform)
```bash
# Convex (public - visible to browser)
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# Prisma (secret - server-side only)
DATABASE_URL=postgresql://user:pass@host:5432/db
```

## Deployment Flow

### Initial Setup
```bash
# 1. Deploy Convex backend
npx convex deploy

# 2. Copy the Convex URL from output
# Example: https://happy-fox-123.convex.cloud

# 3. Deploy Next.js with Convex URL
vercel --env NEXT_PUBLIC_CONVEX_URL=https://happy-fox-123.convex.cloud
```

### Updates
```bash
# 1. Update Convex functions
npx convex deploy

# 2. Deploy Next.js
vercel --prod
```

## Key Points

### ✅ You DON'T need:
- ❌ Two separate frontend deployments
- ❌ Complex infrastructure setup
- ❌ Server management for Convex
- ❌ Separate domain for Convex

### ✅ You DO need:
- ✅ **Convex deployment** (`npx convex deploy`)
- ✅ **Next.js deployment** (Vercel/Netlify/etc)
- ✅ **Prisma database** (your existing PostgreSQL)
- ✅ **Environment variables** configured

## Communication Between Services

```
User → Next.js → Convex (real-time data)
            ↓
         Prisma (via API routes)
```

- **Browser** talks to Next.js
- **Next.js** talks to Convex (real-time) and Prisma (API routes)
- **Convex** handles real-time sync
- **Prisma** stays as your source of truth for persistent data

## Cost Structure

### Convex Pricing
- **Free tier**: 500K queries/month, 500K mutations/month
- **Pro**: $25/month for 10M queries
- **You only pay for Convex cloud**

### Next.js Hosting
- **Vercel**: Free for hobby projects
- **Netlify**: Free tier available
- **Your own server**: Free with Docker

### Database
- Your existing PostgreSQL hosting (AWS RDS, Railway, Supabase, etc.)

## Quick Checklist

### Before Deploying
- [ ] Run `npx convex deploy` to deploy Convex backend
- [ ] Copy Convex URL
- [ ] Set `NEXT_PUBLIC_CONVEX_URL` in hosting platform
- [ ] Set `DATABASE_URL` in hosting platform
- [ ] Test locally with production Convex URL
- [ ] Deploy Next.js

### After Deploying
- [ ] Test articles sync functionality
- [ ] Verify real-time updates work
- [ ] Check API routes can access Prisma
- [ ] Test on mobile devices

## Summary

**Short answer**: You deploy **2 projects**:
1. **Convex** → Deploy to Convex Cloud (`npx convex deploy`)
2. **Next.js** → Deploy to Vercel/Netlify/etc

But they work together as **one application** from the user's perspective!

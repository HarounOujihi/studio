/**
 * Shared types for the application
 *
 * This file exports Prisma-generated types for use in the frontend.
 * By centralizing type exports here, we avoid:
 * 1. Duplicating type definitions
 * 2. Types getting out of sync with the database schema
 * 3. Importing from deeply nested @prisma/client paths
 */

import type { Prisma } from "@prisma/client";

// ============================================================================
// Article Types
// ============================================================================

/**
 * Full Article type from Prisma
 * Use this when you need all fields
 */
export type Article = Prisma.ArticleGetPayload<{}>;

/**
 * Article type with selected fields (what we typically return from APIs)
 * Add or remove fields based on what your API routes actually return
 *
 * Note: Dates from APIs are typically serialized as strings (ISO 8601 format)
 */
export type ArticleListItem = Omit<
  Pick<
    Article,
    | "id"
    | "idOrg"
    | "idEtb"
    | "reference"
    | "slug"
    | "designation"
    | "description"
    | "shortDescription"
    | "media"
    | "gallery"
    | "productType"
    | "isService"
    | "isDigitalProduct"
    | "isPublish"
    | "sortIndex"
    | "createdAt"
    | "updatedAt"
  >,
  "createdAt" | "updatedAt"
> & {
  createdAt: string | null;
  updatedAt: string | null;
};

// ============================================================================
// Header (Order) Types
// ============================================================================

export type Header = Prisma.HeaderGetPayload<{}>;

export type HeaderListItem = Pick<
  Header,
  | "id"
  | "idOrg"
  | "idEtb"
  | "reference"
  | "docType"
  | "status"
  | "taxedAmount"
  | "createdAt"
  | "updatedAt"
>;

// ============================================================================
// Movement Types
// ============================================================================

export type Movement = Prisma.MovementGetPayload<{}>;

export type MovementListItem = Pick<
  Movement,
  | "id"
  | "idOrg"
  | "idEtb"
  | "idHeader"
  | "idArticle"
  | "qty"
  | "idUnit"
  | "taxedAmount"
  | "untaxedAmount"
>;

// ============================================================================
// Client Types
// ============================================================================

export type Client = Prisma.ClientGetPayload<{}>;

export type ClientListItem = Pick<
  Client,
  | "id"
  | "idOrg"
  | "idEtb"
  | "reference"
  | "firstName"
  | "lastName"
  | "email"
  | "tel"
>;

// ============================================================================
// Common Types
// ============================================================================

/**
 * Pagination metadata returned by list APIs
 */
export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Standard API response format
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Type for file uploads
 */
export interface FileUpload {
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
}

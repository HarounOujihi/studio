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
  taxedPrice?: number | null;
  subArticles?: ArticleListItem[];
  discount?: {
    value: number;
    profitType: "PERCENT" | "VALUE";
  } | null;
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
// Deposit Types
// ============================================================================

export type Deposit = Prisma.DepositGetPayload<{}>;
export type DepositType = Prisma.DepositType;

export type DepositListItem = Pick<
  Deposit,
  | "id"
  | "idOrg"
  | "idEtb"
  | "reference"
  | "designation"
  | "type"
  | "isDefault"
> & {
  createdAt?: string | null;
  address?: {
    street: string | null;
    city: string | null;
    country: string | null;
  } | null;
  locationCount?: number;
};

// ============================================================================
// Location Types
// ============================================================================

export type Location = Prisma.LocationGetPayload<{}>;

export type LocationListItem = Pick<
  Location,
  | "id"
  | "idOrg"
  | "idEtb"
  | "idDepo"
  | "reference"
  | "designation"
  | "volume"
> & {
  createdAt?: string | null;
  deposit?: {
    reference: string;
    designation: string | null;
  } | null;
};

// ============================================================================
// Unit Types
// ============================================================================

export type Unit = Prisma.UnitGetPayload<{}>;

export type UnitListItem = Pick<
  Unit,
  | "id"
  | "idOrg"
  | "idEtb"
  | "reference"
  | "designation"
> & {
  createdAt?: string | null;
};

// ============================================================================
// Client Types
// ============================================================================

export type Client = Prisma.ClientGetPayload<{}>;
export type Nature = Prisma.Nature;

export type ClientListItem = Pick<
  Client,
  | "id"
  | "idOrg"
  | "idEtb"
  | "reference"
  | "firstName"
  | "lastName"
  | "companyName"
  | "email"
  | "tel"
  | "nature"
  | "taxIdNumber"
  | "note"
> & {
  createdAt?: string | null;
  address?: {
    street: string | null;
    city: string | null;
    country: string | null;
  } | null;
};

// ============================================================================
// Provider Types
// ============================================================================

export type Provider = Prisma.ProviderGetPayload<{}>;

export type ProviderListItem = Pick<
  Provider,
  | "id"
  | "idOrg"
  | "idEtb"
  | "reference"
  | "firstName"
  | "lastName"
  | "companyName"
  | "email"
  | "tel"
  | "nature"
  | "taxIdNumber"
  | "note"
> & {
  createdAt?: string | null;
  address?: {
    street: string | null;
    city: string | null;
    country: string | null;
  } | null;
};

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

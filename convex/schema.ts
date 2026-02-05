import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Enums
// const UserGender = {
//   MALE: "MALE",
//   FEMALE: "FEMALE",
// } as const;

// const OrganizationRole = {
//   SUPER_ADMIN: "SUPER_ADMIN",
//   MANAGER: "MANAGER",
//   USER: "USER",
// } as const;

// const EstablishmentDomain = {
//   BUSINESS: "BUSINESS",
//   EDUCATION: "EDUCATION",
//   CATERING: "CATERING",
// } as const;

// const DepositType = {
//   WAREHOUSE: "WAREHOUSE",
//   STORE: "STORE",
//   SHOWROOM: "SHOWROOM",
//   OTHER: "OTHER",
// } as const;

// const Nature = {
//   COMPANY: "COMPANY",
//   INDIVIDUAL: "INDIVIDUAL",
// } as const;

// const MediaType = {
//   TEXT: "TEXT",
//   VIDEO: "VIDEO",
//   IMAGE: "IMAGE",
//   FILE: "FILE",
// } as const;

// const ProductType = {
//   PHYSICAL_PRODUCT: "PHYSICAL_PRODUCT",
//   DIGITAL_PRODUCT: "DIGITAL_PRODUCT",
//   SERVICE: "SERVICE",
//   WEBINAR: "WEBINAR",
// } as const;

// const ServiceType = {
//   CONSULTING: "CONSULTING",
//   ADVERTISING: "ADVERTISING",
//   SUBSCRIPTION: "SUBSCRIPTION",
// } as const;

// const BuySell = {
//   CAN_BE_PURCHASED: "CAN_BE_PURCHASED",
//   CAN_BE_SOLD: "CAN_BE_SOLD",
//   CAN_BE_MANUFACTURED: "CAN_BE_MANUFACTURED",
// } as const;

// const Picking = {
//   FIFO: "FIFO",
//   LIFO: "LIFO",
//   FEFO: "FEFO",
// } as const;

// const StockManagement = {
//   IN_STOCK: "IN_STOCK",
//   OUT_OF_STOCK: "OUT_OF_STOCK",
// } as const;

// const ArticleManagement = {
//   BY_LOT: "BY_LOT",
//   BY_SERIAL_NUMBER: "BY_SERIAL_NUMBER",
//   BY_EAN: "BY_EAN",
// } as const;

// const VariantType = {
//   COLOR: "COLOR",
//   SIZE: "SIZE",
//   NUMBER: "NUMBER",
//   TEXT: "TEXT",
// } as const;

// const InventoryType = {
//   INVENTORY: "INVENTORY",
//   TRANSFER: "TRANSFER",
//   ADJUSTMENT: "ADJUSTMENT",
// } as const;

// const InventoryStatus = {
//   DRAFT: "DRAFT",
//   APPROVED: "APPROVED",
//   CANCELLED: "CANCELLED",
// } as const;

// const OperationAction = {
//   ADD: "ADD",
//   MINUS: "MINUS",
//   UNCHANGED: "UNCHANGED",
// } as const;

// const DocType = {
//   QUOTE: "QUOTE",
//   ORDER: "ORDER",
//   DELIVERY_ORDER: "DELIVERY_ORDER",
//   INVOICE: "INVOICE",
//   DEPO_TRANSFER: "DEPO_TRANSFER",
// } as const;

// const HeaderStatus = {
//   DRAFT: "DRAFT",
//   PAID: "PAID",
//   UNPAID: "UNPAID",
//   CANCELLED: "CANCELLED",
//   OVERDUE: "OVERDUE",
//   REFUNDED: "REFUNDED",
//   SENT: "SENT",
//   APPROVED: "APPROVED",
// } as const;

// const ProfitType = {
//   PERCENT: "PERCENT",
//   VALUE: "VALUE",
// } as const;

// const RegulationProvider = {
//   STRIPE: "STRIPE",
//   TWINT: "TWINT",
//   CHEQUE: "CHEQUE",
//   BANK_TRANSFER: "BANK_TRANSFER",
//   CASH: "CASH",
//   BITCOIN: "BITCOIN",
//   KONNECT: "KONNECT",
// } as const;

// const RegulationStatus = {
//   INITIATED: "INITIATED",
//   PENDING: "PENDING",
//   PAID: "PAID",
//   FAILED: "FAILED",
//   REFUNDED: "REFUNDED",
// } as const;

// const CustomizationType = {
//   COLOR: "COLOR",
//   TEXT: "TEXT",
//   SIZE: "SIZE",
//   NUMBER: "NUMBER",
// } as const;

// const EntityType = {
//   ARTICLE: "ARTICLE",
//   CATEGORY: "CATEGORY",
//   CLIENT: "CLIENT",
//   HEADER: "HEADER",
//   MOVEMENT: "MOVEMENT",
//   DEPOSIT: "DEPOSIT",
//   LOCATION: "LOCATION",
//   CONTACT: "CONTACT",
//   PROVIDER: "PROVIDER",
//   LOT_COMPOSITION: "LOT_COMPOSITION",
//   INVENTORY_HEADER: "INVENTORY_HEADER",
//   INVENTORY_MOVEMENT: "INVENTORY_MOVEMENT",
//   PROJECT: "PROJECT",
// } as const;

// const FieldType = {
//   TEXT: "TEXT",
//   NUMBER: "NUMBER",
//   DATE: "DATE",
//   BOOLEAN: "BOOLEAN",
//   SELECT: "SELECT",
//   MULTISELECT: "MULTISELECT",
// } as const;

// const ResetRule = {
//   NEVER: "NEVER",
//   YEARLY: "YEARLY",
//   MONTHLY: "MONTHLY",
//   DAILY: "DAILY",
// } as const;

// const ProjectStatus = {
//   NOT_STARTED: "NOT_STARTED",
//   IN_PROGRESS: "IN_PROGRESS",
//   FINISHED: "FINISHED",
// } as const;

// const ProjectRole = {
//   EMPLOYEE: "EMPLOYEE",
//   CHEIF: "CHEIF",
//   ADMIN: "ADMIN",
// } as const;

// const FamilyStatus = {
//   SINGLE: "SINGLE",
//   MARRIED: "MARRIED",
//   DIVORCED: "DIVORCED",
// } as const;

// const EmployeeRole = {
//   ADMIN: "ADMIN",
//   REG_USER: "REG_USER",
//   CHIEF: "CHIEF",
//   EMPLOYEE: "EMPLOYEE",
// } as const;

// const WorkDay = {
//   FULL: "FULL",
//   HALF: "HALF",
//   NONE: "NONE",
// } as const;

// const LessonType = {
//   ONLINE: "ONLINE",
//   OFFLINE: "OFFLINE",
//   OTHER: "OTHER",
// } as const;

// const QuestionType = {
//   SINGLE_CHOICE: "SINGLE_CHOICE",
//   MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
//   TRUE_FALSE: "TRUE_FALSE",
// } as const;

// const CustomerRole = {
//   CUSTOMER: "CUSTOMER",
//   ADMIN: "ADMIN",
//   TRAINER: "TRAINER",
// } as const;

// const EnrollmentStatus = {
//   PENDING: "PENDING",
//   ENROLLED: "ENROLLED",
//   CANCELLED: "CANCELLED",
// } as const;

// const ConsultationStatus = {
//   PENDING: "PENDING",
//   ACCEPTED: "ACCEPTED",
//   REJECTED: "REJECTED",
// } as const;

// const JobType = {
//   SESSION_REMINDER: "SESSION_REMINDER",
//   ENROLLMENT_CONFIRMATION: "ENROLLMENT_CONFIRMATION",
//   MARKETING_EMAIL: "MARKETING_EMAIL",
// } as const;

// const JobStatus = {
//   PENDING: "PENDING",
//   PROCESSING: "PROCESSING",
//   COMPLETED: "COMPLETED",
//   FAILED: "FAILED",
// } as const;

// const SupportConversationStatus = {
//   OPEN: "OPEN",
//   PENDING: "PENDING",
//   RESOLVED: "RESOLVED",
//   CLOSED: "CLOSED",
// } as const;

// const SupportPriority = {
//   LOW: "LOW",
//   MEDIUM: "MEDIUM",
//   HIGH: "HIGH",
//   URGENT: "URGENT",
// } as const;

// const KBArticleStatus = {
//   DRAFT: "DRAFT",
//   PUBLISHED: "PUBLISHED",
//   ARCHIVED: "ARCHIVED",
// } as const;

export default defineSchema({
  // ============================================================
  // USERS & ORGANIZATION
  // ============================================================

  users: defineTable({
    // ID from Prisma (oidcId)
    oidcId: v.string(),

    // Basic info
    firstName: v.optional(v.string()),
    middleName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    gender: v.optional(v.string()),
    birthDay: v.optional(v.number()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    picture: v.optional(v.string()),
    password: v.optional(v.string()),

    // Address & Bio
    address: v.optional(v.string()),
    bio: v.optional(v.string()),
    nationality: v.optional(v.string()),
    socialFacebook: v.optional(v.string()),
    socialLinkedin: v.optional(v.string()),
    socialTwitter: v.optional(v.string()),
    website: v.optional(v.string()),

    isAgent: v.optional(v.boolean()),
  })
    .index("by_oidc", ["oidcId"])
    .index("by_email", ["email"]),

  organizations: defineTable({
    id: v.string(),
    reference: v.string(),
    name: v.optional(v.string()),
    logo: v.optional(v.string()),
    active: v.optional(v.boolean()),
    commercialRegister: v.optional(v.string()),
    taxIdNumber: v.optional(v.string()),
    customsCode: v.optional(v.string()),
    phones: v.optional(v.array(v.string())),
    emails: v.optional(v.array(v.string())),
  })
    .index("by_reference", ["reference"]),

  establishments: defineTable({
    id: v.string(),
    idOrg: v.string(),
    reference: v.string(),
    designation: v.optional(v.string()),
    idCurrency: v.optional(v.string()),
    domain: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    isHidden: v.optional(v.boolean()),
  })
    .index("by_org", ["idOrg"])
    .index("by_reference", ["reference"])
    .index("by_org_default", ["idOrg", "isDefault"]),

  userOrganizations: defineTable({
    idOrg: v.string(),
    userId: v.string(),
    role: v.string(),
  })
    .index("by_org", ["idOrg"])
    .index("by_user", ["userId"])
    .index("by_user_org", ["userId", "idOrg"]),

  // ============================================================
  // ADDRESSES & CONTACTS
  // ============================================================

  addresses: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    referToId: v.optional(v.string()),
    street: v.optional(v.string()),
    street2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    country: v.optional(v.string()),
    lat: v.optional(v.string()),
    lng: v.optional(v.string()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"]),

  deposits: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    reference: v.string(),
    designation: v.optional(v.string()),
    type: v.string(),
    media: v.optional(v.string()),
    idAddress: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"]),

  locations: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idDepo: v.string(),
    reference: v.string(),
    designation: v.optional(v.string()),
    volume: v.optional(v.string()),
    media: v.optional(v.string()),
  })
    .index("by_org_etb_depo", ["idOrg", "idEtb", "idDepo"]),

  contactTypes: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    reference: v.string(),
    designation: v.optional(v.string()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"]),

  banks: defineTable({
    id: v.string(),
    idOrg: v.string(),
    reference: v.string(),
    designation: v.optional(v.string()),
  })
    .index("by_org", ["idOrg"]),

  bankAccounts: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idBank: v.string(),
    reference: v.string(),
    RIB: v.string(),
  })
    .index("by_org_etb", ["idOrg", "idEtb"]),

  taxes: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    reference: v.string(),
    designation: v.optional(v.string()),
    value: v.optional(v.number()),
    taxType: v.optional(v.string()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"]),

  currencies: defineTable({
    id: v.string(),
    reference: v.string(),
    designation: v.optional(v.string()),
    symbol: v.optional(v.string()),
    decimals: v.optional(v.number()),
  })
    .index("by_reference", ["reference"]),

  currencyCoefficients: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    reference: v.string(),
    designation: v.optional(v.string()),
    value: v.optional(v.number()),
    idCurrencyFrom: v.string(),
    idCurrencyTo: v.string(),
  })
    .index("by_org_etb", ["idOrg", "idEtb"]),

  discounts: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    reference: v.string(),
    designation: v.optional(v.string()),
    value: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    idArticle: v.optional(v.string()),
    idClient: v.optional(v.string()),
    profitType: v.string(),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_article", ["idArticle"])
    .index("by_client", ["idClient"]),

  contacts: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idTypeContact: v.string(),
    idBankAccount: v.string(),
    reference: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    companyName: v.optional(v.string()),
    email: v.optional(v.string()),
    tel: v.optional(v.string()),
    personalIdType: v.optional(v.string()),
    personalId: v.optional(v.string()),
    taxIdNumber: v.optional(v.string()),
    customsCode: v.optional(v.string()),
    nature: v.string(),
  })
    .index("by_org_etb", ["idOrg", "idEtb"]),

  // ============================================================
  // PRODUCTS & INVENTORY
  // ============================================================

  categories: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idParent: v.optional(v.string()),
    reference: v.string(),
    slug: v.optional(v.string()),
    designation: v.optional(v.string()),
    isSubCategory: v.optional(v.boolean()),
    logo: v.optional(v.string()),
    image: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    sortIndex: v.optional(v.number()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_parent", ["idParent"])
    .index("by_slug", ["slug"]),

  media: defineTable({
    id: v.string(),
    path: v.string(),
    type: v.optional(v.string()),
    idOrg: v.string(),
    idEtb: v.string(),
    sortIndex: v.optional(v.number()),
    isDefault: v.optional(v.boolean()),
    idArticle: v.optional(v.string()),
    idCategory: v.optional(v.string()),
    idLesson: v.optional(v.string()),
    idSupportConversation: v.optional(v.string()),
    idSupportMessage: v.optional(v.string()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_article", ["idArticle"])
    .index("by_category", ["idCategory"]),

  articleCategories: defineTable({
    idOrg: v.string(),
    idEtb: v.string(),
    idArticle: v.string(),
    idCategory: v.string(),
  })
    .index("by_article", ["idArticle"])
    .index("by_category", ["idCategory"])
    .index("by_org_etb", ["idOrg", "idEtb"]),

  units: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    reference: v.string(),
    designation: v.optional(v.string()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"]),

  unitCoefficients: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    reference: v.string(),
    designation: v.optional(v.string()),
    unitFrom: v.string(),
    unitTo: v.string(),
    value: v.number(),
  })
    .index("by_org_etb", ["idOrg", "idEtb"]),

  // Mirror of Article model from Prisma
  articles: defineTable({
    // IDs from Prisma
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),

    // Basic info
    reference: v.string(),
    slug: v.optional(v.string()),
    designation: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    details: v.optional(v.string()),
    materials: v.optional(v.string()),

    // Media
    media: v.optional(v.string()),
    gallery: v.optional(v.array(v.string())),

    // Classification
    productType: v.optional(v.string()),
    isService: v.optional(v.boolean()),
    isDigitalProduct: v.optional(v.boolean()),
    isPublish: v.optional(v.boolean()),

    // Stock & Pricing info
    saleUnit: v.optional(v.string()),
    purchaseUnit: v.optional(v.string()),
    weight: v.optional(v.number()),
    volume: v.optional(v.string()),

    // Status
    sortIndex: v.optional(v.number()),
    isSubArticle: v.boolean(),
    idParent: v.optional(v.string()),

    // Timestamps
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),

    // Sync status
    lastSyncedAt: v.number(),
  })
    .index("by_org", ["idOrg"])
    .index("by_etb", ["idEtb"])
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_parent", ["idParent"])
    .index("by_publish", ["isPublish"])
    .index("by_product_type", ["productType"])
    .index("by_slug", ["slug"]),

  variantProps: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idArticle: v.string(),
    idSubArticle: v.optional(v.string()),
    reference: v.string(),
    designation: v.optional(v.string()),
    type: v.string(),
    value: v.string(),
    image: v.optional(v.string()),
    sortIndex: v.optional(v.number()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_article", ["idArticle"])
    .index("by_sub_article", ["idSubArticle"]),

  lotCompositions: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idLot: v.string(),
    idComposant: v.string(),
    reference: v.string(),
    designation: v.optional(v.string()),
    qty: v.optional(v.number()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_lot", ["idLot"])
    .index("by_composant", ["idComposant"]),

  stockpiles: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idDeposit: v.optional(v.string()),
    idLocation: v.optional(v.string()),
    idArticle: v.string(),
    qtyReal: v.optional(v.number()),
    qtyVirtual: v.optional(v.number()),
    qtyReserved: v.optional(v.number()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_article", ["idArticle"])
    .index("by_deposit", ["idDeposit"])
    .index("by_location", ["idLocation"]),

  pricing: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idArticle: v.string(),
    idTax: v.optional(v.string()),
    purchasePrice: v.optional(v.number()),
    fees: v.optional(v.number()),
    profitType: v.string(),
    profitMargin: v.number(),
    salePrice: v.number(),
    effectDate: v.number(),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_article", ["idArticle"]),

  operations: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    codeOperation: v.string(),
    designation: v.optional(v.string()),
    virtualAction: v.optional(v.string()),
    realAction: v.optional(v.string()),
    reservedAction: v.optional(v.string()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_code", ["codeOperation"]),

  inventoryHeaders: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    reference: v.string(),
    designation: v.optional(v.string()),
    codeOperation: v.string(),
    idDeposit: v.string(),
    inventoryType: v.string(),
    inventoryStatus: v.string(),
    createdAt: v.number(),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_deposit", ["idDeposit"]),

  inventoryMovements: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idHeader: v.string(),
    idArticle: v.string(),
    idDeposit: v.string(),
    idUnit: v.string(),
    codeOperation: v.string(),
    qtyReal: v.optional(v.number()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_header", ["idHeader"])
    .index("by_article", ["idArticle"]),

  // ============================================================
  // COMMERCIAL DOCUMENTS
  // ============================================================

  commercialDocs: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    reference: v.string(),
    designation: v.optional(v.string()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"]),

  phases: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    reference: v.string(),
    designation: v.optional(v.string()),
    relatedType: v.optional(v.string()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"]),

  transitions: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idOperation: v.string(),
    idCommercialDoc: v.optional(v.string()),
    idPhase: v.optional(v.string()),
    reference: v.string(),
    designation: v.optional(v.string()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_operation", ["idOperation"])
    .index("by_doc", ["idCommercialDoc"])
    .index("by_phase", ["idPhase"]),

  headers: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idClient: v.optional(v.string()),
    idProvider: v.optional(v.string()),
    idContact: v.optional(v.string()),
    codeOperation: v.optional(v.string()),
    idCommercialDoc: v.optional(v.string()),
    idPhase: v.optional(v.string()),
    idTax: v.optional(v.string()),
    idDeposit: v.optional(v.string()),
    reference: v.string(),
    status: v.optional(v.string()),
    docType: v.string(),
    untaxedAmount: v.optional(v.number()),
    taxedAmount: v.optional(v.number()),
    headerGroup: v.optional(v.string()),
    pickupAt: v.optional(v.number()),
    deliveryClientName: v.optional(v.string()),
    deliveryPhone: v.optional(v.string()),
    deliveryEmail: v.optional(v.string()),
    billingAddress: v.optional(v.string()),
    deliveryAddress: v.optional(v.string()),
    note: v.optional(v.string()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_client", ["idClient"])
    .index("by_provider", ["idProvider"])
    .index("by_doc_type", ["docType"])
    .index("by_status", ["status"]),

  movements: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idHeader: v.string(),
    idArticle: v.string(),
    qty: v.number(),
    options: v.optional(v.array(v.string())),
    idUnit: v.string(),
    idTax: v.optional(v.string()),
    idPricing: v.optional(v.string()),
    idDiscount: v.optional(v.string()),
    idDeposit: v.optional(v.string()),
    idLot: v.optional(v.string()),
    untaxedAmount: v.optional(v.number()),
    taxedAmount: v.optional(v.number()),
    codeOperation: v.optional(v.string()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_header", ["idHeader"])
    .index("by_article", ["idArticle"]),

  ventilations: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idMovement: v.string(),
    idHeader: v.optional(v.string()),
    idStockpile: v.optional(v.string()),
    idArticle: v.string(),
    qty: v.number(),
    idUnit: v.string(),
    idTax: v.optional(v.string()),
    idDeposit: v.optional(v.string()),
    untaxedAmount: v.optional(v.number()),
    taxedAmount: v.optional(v.number()),
    codeOperation: v.optional(v.string()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_article", ["idArticle"])
    .index("by_stockpile", ["idStockpile"]),

  regulations: defineTable({
    id: v.string(),
    idHeader: v.string(),
    regulationProvider: v.optional(v.string()),
    regulationProviderId: v.optional(v.string()),
    status: v.optional(v.string()),
    amount: v.number(),
    currency: v.optional(v.string()),
    method: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    idOrg: v.string(),
    idEtb: v.string(),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_header", ["idHeader"]),

  regulationMovements: defineTable({
    id: v.string(),
    idRegulation: v.string(),
    idMovement: v.string(),
    amount: v.optional(v.number()),
    idOrg: v.string(),
    idEtb: v.string(),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_regulation", ["idRegulation"])
    .index("by_movement", ["idMovement"]),

  // ============================================================
  // CLIENTS & PROVIDERS
  // ============================================================

  providers: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idTax: v.optional(v.string()),
    idBankAccount: v.optional(v.string()),
    idAddress: v.optional(v.string()),
    reference: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    companyName: v.optional(v.string()),
    email: v.optional(v.string()),
    tel: v.optional(v.string()),
    personalIdType: v.optional(v.string()),
    personalId: v.optional(v.string()),
    taxIdNumber: v.optional(v.string()),
    customsCode: v.optional(v.string()),
    note: v.optional(v.string()),
    nature: v.string(),
  })
    .index("by_org_etb", ["idOrg", "idEtb"]),

  clients: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idTax: v.optional(v.string()),
    idBankAccount: v.optional(v.string()),
    idUser: v.optional(v.string()),
    idAddress: v.optional(v.string()),
    reference: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    companyName: v.optional(v.string()),
    email: v.optional(v.string()),
    tel: v.optional(v.string()),
    picture: v.optional(v.string()),
    personalIdType: v.optional(v.string()),
    personalId: v.optional(v.string()),
    taxIdNumber: v.optional(v.string()),
    customsCode: v.optional(v.string()),
    note: v.optional(v.string()),
    nature: v.string(),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_user", ["idUser"]),

  // ============================================================
  // CART & E-COMMERCE
  // ============================================================

  carts: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    clientId: v.optional(v.string()),
    userId: v.optional(v.string()),
    pickupTime: v.optional(v.string()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_client", ["clientId"])
    .index("by_user", ["userId"]),

  cartItems: defineTable({
    id: v.string(),
    cartId: v.string(),
    articleId: v.string(),
    qty: v.number(),
    idLot: v.optional(v.string()),
  })
    .index("by_cart", ["cartId"])
    .index("by_article", ["articleId"]),

  garnishes: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    title: v.string(),
    isMultiple: v.optional(v.boolean()),
    options: v.array(v.string()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"]),

  articleGarnishes: defineTable({
    idOrg: v.string(),
    idEtb: v.string(),
    idArticle: v.string(),
    idGarnish: v.string(),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_article", ["idArticle"])
    .index("by_garnish", ["idGarnish"]),

  articleDeposits: defineTable({
    idOrg: v.string(),
    idEtb: v.string(),
    idArticle: v.string(),
    idDeposit: v.string(),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_article", ["idArticle"])
    .index("by_deposit", ["idDeposit"]),

  // ============================================================
  // CUSTOMIZATION
  // ============================================================

  customArticleSections: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idArticle: v.string(),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    description: v.optional(v.string()),
    sortIndex: v.optional(v.number()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_article", ["idArticle"]),

  customArticleOptions: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idSection: v.string(),
    name: v.optional(v.string()),
    value: v.string(),
    type: v.optional(v.string()),
    image: v.optional(v.string()),
    description: v.optional(v.string()),
    sortIndex: v.optional(v.number()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_section", ["idSection"]),

  articleCombinations: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idArticle: v.string(),
    images: v.array(v.string()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_article", ["idArticle"]),

  articleCombinationLinks: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idCombination: v.string(),
    idOption: v.string(),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_combination", ["idCombination"])
    .index("by_option", ["idOption"]),

  // ============================================================
  // SETTINGS
  // ============================================================

  settings: defineTable({
    id: v.string(),
    idOrg: v.optional(v.string()),
    idEtb: v.optional(v.string()),
    key: v.string(),
    value: v.any(),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_scope_key", ["idOrg", "idEtb", "key"]),

  userSettings: defineTable({
    id: v.string(),
    userId: v.string(),
    idOrg: v.optional(v.string()),
    idEtb: v.optional(v.string()),
    key: v.string(),
    value: v.any(),
  })
    .index("by_user", ["userId"])
    .index("by_user_scope", ["userId", "idOrg", "idEtb", "key"]),

  customFields: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.optional(v.string()),
    entityType: v.string(),
    key: v.string(),
    label: v.string(),
    dataType: v.string(),
    required: v.optional(v.boolean()),
    options: v.optional(v.any()),
    validation: v.optional(v.any()),
    ui: v.optional(v.any()),
    active: v.optional(v.boolean()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_entity_type", ["idOrg", "idEtb", "entityType"])
    .index("by_unique_key", ["idOrg", "idEtb", "entityType", "key"]),

  customFieldValues: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.optional(v.string()),
    entityType: v.string(),
    entityId: v.string(),
    fieldId: v.string(),
    value: v.any(),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_entity", ["fieldId", "entityType", "entityId"])
    .index("by_org_entity", ["idOrg", "idEtb", "entityType", "entityId"]),

  numberSequences: defineTable({
    id: v.string(),
    orgId: v.string(),
    etbId: v.string(),
    entityType: v.string(),
    series: v.optional(v.string()),
    pattern: v.string(),
    resetRule: v.string(),
    nextSeq: v.number(),
    locked: v.optional(v.boolean()),
    lastResetAt: v.optional(v.number()),
    periodKey: v.optional(v.string()),
    timezone: v.optional(v.string()),
    active: v.optional(v.boolean()),
  })
    .index("by_org_etb", ["orgId", "etbId"])
    .index("by_entity_type", ["orgId", "etbId", "entityType"])
    .index("by_unique_series", ["orgId", "etbId", "entityType", "series"]),

  // ============================================================
  // POINTING (HR)
  // ============================================================

  projects: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    name: v.string(),
    address: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.optional(v.string()),
    coordinateGPS: v.optional(v.string()),
    isDeleted: v.optional(v.boolean()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_status", ["status"]),

  employees: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idProject: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    tel1: v.string(),
    tel2: v.optional(v.string()),
    birthDay: v.optional(v.number()),
    address: v.optional(v.string()),
    nationality: v.optional(v.string()),
    post: v.optional(v.string()),
    comment: v.optional(v.string()),
    salary: v.optional(v.number()),
    cinPassp: v.optional(v.string()),
    cnss: v.optional(v.string()),
    isDeleted: v.optional(v.boolean()),
    isDeclared: v.optional(v.boolean()),
    createdBy: v.optional(v.string()),
    deletedBy: v.optional(v.string()),
    deletedAt: v.optional(v.number()),
    isFamilyHead: v.optional(v.boolean()),
    kids: v.optional(v.number()),
    familyStatus: v.optional(v.string()),
    role: v.optional(v.string()),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_project", ["idProject"])
    .index("by_email", ["email"]),

  pointings: defineTable({
    id: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    idProject: v.string(),
    idEmployee: v.string(),
    date: v.number(),
    note: v.optional(v.string()),
    salary: v.optional(v.number()),
    deposit: v.optional(v.number()),
    hours: v.string(),
    extraHours: v.number(),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_project", ["idProject"])
    .index("by_employee", ["idEmployee"]),

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  notifications: defineTable({
    id: v.string(),
    userId: v.string(),
    t: v.number(),
    isRead: v.optional(v.boolean()),
    data: v.any(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "isRead"])
    .index("by_time", ["t"]),

  // ============================================================
  // JOBS (Background Tasks)
  // ============================================================

  jobs: defineTable({
    id: v.string(),
    type: v.string(),
    status: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
    payload: v.any(),
    scheduledAt: v.optional(v.number()),
    attempts: v.number(),
    maxAttempts: v.number(),
    error: v.optional(v.string()),
    processedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_scheduled", ["scheduledAt"])
    .index("by_org_etb", ["idOrg", "idEtb"]),

  // ============================================================
  // SUPPORT
  // ============================================================

  supportConversations: defineTable({
    id: v.string(),
    subject: v.optional(v.string()),
    description: v.optional(v.string()),
    createdById: v.string(),
    status: v.string(),
    priority: v.string(),
    firstResponseAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    categoryId: v.optional(v.string()),
    idOrg: v.string(),
    idEtb: v.string(),
  })
    .index("by_org_etb", ["idOrg", "idEtb"])
    .index("by_created_by", ["createdById"])
    .index("by_status", ["status"])
    .index("by_category", ["categoryId"]),

  supportMessages: defineTable({
    id: v.string(),
    content: v.string(),
    senderId: v.string(),
    conversationId: v.string(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"]),

  supportCsatSurveys: defineTable({
    id: v.string(),
    rating: v.number(),
    comment: v.optional(v.string()),
    conversationId: v.string(),
    idOrg: v.string(),
    idEtb: v.string(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_org_etb", ["idOrg", "idEtb"]),
});

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categoriesData = [
  {
    name: "Technical Support",
    description:
      "Issues with the application, bugs, errors, and performance problems.",
    color: "#ef4444",
  },
  {
    name: "Billing & Payments",
    description:
      "Questions about invoices, subscriptions, payments, and pricing plans.",
    color: "#22c55e",
  },
  {
    name: "Account & Security",
    description:
      "Login problems, password resets, user management, and data privacy.",
    color: "#3b82f6",
  },
  {
    name: "Feature Request",
    description:
      "Ideas and suggestions for new features or improvements to existing ones.",
    color: "#a855f7",
  },
  {
    name: "General Inquiry",
    description:
      "General questions, partnership inquiries, and other non-technical topics.",
    color: "#6b7280",
  },
  {
    name: "How-To & Usage",
    description:
      "Questions about how to use specific features or workflows within the ERP.",
    color: "#f59e0b",
  },
  {
    name: "Integration & API",
    description:
      "Issues and questions related to third-party integrations and API usage.",
    color: "#06b6d4",
  },
];

async function main() {
  console.log("Start seeding...");

  for (const category of categoriesData) {
    await prisma.supportTicketCategory.upsert({
      where: { name: category.name },
      update: {}, // Update nothing if it exists
      create: category,
    });
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// SQL QUERY :

//   INSERT INTO "support_ticket_categories" ("id", "name", "description", "color") VALUES
// -- Technical Issues
// ('clt3a1x2k0000s2rm2g8h1e7m', 'Technical Support', 'Issues with the application, bugs, errors, and performance problems.', '#ef4444'),

// -- Billing & Payments
// ('clt3a1x2l0001s2rm2x1j9q0n', 'Billing & Payments', 'Questions about invoices, subscriptions, payments, and pricing plans.', '#22c55e'),

// -- Account & Security
// ('clt3a1x2m0002s2rm2w5h4k8p', 'Account & Security', 'Login problems, password resets, user management, and data privacy.', '#3b82f6'),

// -- Feature Requests
// ('clt3a1x2n0003s2rm2v0l7j6q', 'Feature Request', 'Ideas and suggestions for new features or improvements to existing ones.', '#a855f7'),

// -- General Questions
// ('clt3a1x2o0004s2rm2u3m8z9r', 'General Inquiry', 'General questions, partnership inquiries, and other non-technical topics.', '#6b7280'),

// -- How-to & Usage
// ('clt3a1x2p0005s2rm2t1n2x2s', 'How-To & Usage', 'Questions about how to use specific features or workflows within the ERP.', '#f59e0b'),

// -- Integrations & API
// ('clt3a1x2q0006s2rm2s0o4y5t', 'Integration & API', 'Issues and questions related to third-party integrations and API usage.', '#06b6d4');

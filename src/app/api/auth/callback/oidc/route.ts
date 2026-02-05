import { handlers } from "@/lib/auth";

export const runtime = "nodejs";

// NextAuth's standard callback handler for Next.js 15/16
export const { GET, POST } = handlers;

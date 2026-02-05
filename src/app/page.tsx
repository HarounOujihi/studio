import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  // If authenticated, redirect to dashboard
  redirect("/dashboard");
}

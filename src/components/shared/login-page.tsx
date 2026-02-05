"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function LoginPage() {
  const router = useRouter();

  React.useEffect(() => {
    // Redirect to the NextAuth sign-in page
    router.push("/auth/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    </div>
  );
}

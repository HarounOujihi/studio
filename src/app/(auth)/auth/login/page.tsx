"use client";

import { useState } from "react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Call API endpoint to generate authorization URL
      const response = await fetch("/api/auth/authorize");
      if (!response.ok) {
        throw new Error("Failed to generate authorization URL");
      }

      const { authUrl } = await response.json();

      // Redirect to OIDC provider
      window.location.href = authUrl;
    } catch (err) {
      console.error("Sign-in error:", err);
      setError("Failed to initiate sign-in. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-store h-8 w-8">
              <path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"></path>
              <path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"></path>
              <path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Sawi Studio</h1>
          <p className="text-muted-foreground mt-2">E-commerce management platform</p>
        </div>

        <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-xl">
          <div className="px-6 space-y-1">
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in with your OIDC provider to continue
            </p>
          </div>

          <form onSubmit={handleSignIn}>
            <div className="px-6">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 w-full text-base"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-in">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                      <polyline points="10 17 15 14 15"></polyline>
                      <line x1="15" x2="3" y1="14" y2="14"></line>
                    </svg>
                    Sign in with OIDC
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="px-6">
              <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            </div>
          )}

          <div className="px-6 text-sm text-muted-foreground text-center">
            You&apos;ll be redirected to authenticate
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>© 2025 Sawi Studio. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

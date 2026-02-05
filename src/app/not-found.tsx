import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <FileQuestion className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        {/* Error Code */}
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-muted-foreground/20">404</h1>
          <p className="text-xl font-semibold text-foreground">Page not found</p>
        </div>

        {/* Message */}
        <p className="text-muted-foreground">
          Sorry, we couldn't find the page you're looking for.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/login">
              Sign In
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

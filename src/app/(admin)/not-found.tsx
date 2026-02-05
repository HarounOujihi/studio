import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/shared/admin-shell";
import { Home, ArrowLeft, FileQuestion } from "lucide-react";

export default function ArticlesNotFound() {
  return (
    <AdminShell>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="max-w-md text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-6">
              <FileQuestion className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>

          {/* Error Code */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">404</h1>
            <p className="text-xl font-semibold text-muted-foreground">
              Page not found
            </p>
          </div>

          {/* Message */}
          <p className="text-muted-foreground">
            The article or page you're looking for doesn't exist or has been moved.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default">
              <Link href="/articles">
                <Home className="mr-2 h-4 w-4" />
                Back to Articles
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="javascript:history.back()">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

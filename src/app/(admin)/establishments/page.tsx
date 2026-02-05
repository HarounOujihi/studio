import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, FolderOpen } from "lucide-react";
import Link from "next/link";

export default function EstablishmentsPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="rounded-full bg-muted p-6">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Establishments</h1>
        <p className="text-muted-foreground">Manage your establishments</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <Link href="/articles">
              <Home className="mr-2 h-4 w-4" />
              Go to Articles
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

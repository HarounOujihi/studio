import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, FolderOpen } from "lucide-react";
import Link from "next/link";

const PAGE_INFO = {
  categories: { title: "Categories", description: "Manage your product categories", icon: "📁" },
  orders: { title: "Orders", description: "View and manage customer orders", icon: "📦" },
  customers: { title: "Customers", description: "Manage customer information", icon: "👥" },
  organizations: { title: "Organizations", description: "Manage your organizations", icon: "🏢" },
  establishments: { title: "Establishments", description: "Manage your establishments", icon: "🏪" },
  users: { title: "Users", description: "Manage user accounts and permissions", icon: "👤" },
  settings: { title: "Settings", description: "Configure your application settings", icon: "⚙️" },
} as const;

type PageKey = keyof typeof PAGE_INFO;

export default function PlaceholderPage() {
  // This is a template - you'll need to create specific pages for each route
  // For now, copy this file to each folder and update the PAGE_KEY
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="rounded-full bg-muted p-6">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Coming Soon</h1>
        <p className="text-muted-foreground">This page is under construction</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <Link href="/articles">
              <Home className="mr-2 h-4 w-4" />
              Go to Articles
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
  );
}

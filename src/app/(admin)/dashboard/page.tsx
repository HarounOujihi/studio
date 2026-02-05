"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Plus,
  Download,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, ActionButton, ActionGroup } from "@/components/admin/page-header";
import { useScope } from "@/hooks/useScopedQuery";

interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
}

interface StatsData {
  articleCount: number;
  orderCount: number;
  clientCount: number;
  revenue: number;
}

export default function DashboardPage() {
  const scope = useScope();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stats from Prisma API
  useEffect(() => {
    if (!scope.orgId || !scope.etbId) {
      setStats(null);
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("idOrg", scope.orgId!);
        params.append("idEtb", scope.etbId!);
        const response = await fetch(`/api/stats?${params}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [scope.orgId, scope.etbId]);

  const statCards = useMemo((): StatCard[] => {
    if (!stats) {
      return [
        {
          title: "Total Articles",
          value: "—",
          change: "No scope selected",
          icon: <Package className="h-4 w-4" />,
        },
        {
          title: "Total Orders",
          value: "—",
          change: "No scope selected",
          icon: <ShoppingCart className="h-4 w-4" />,
        },
        {
          title: "Active Customers",
          value: "—",
          change: "No scope selected",
          icon: <Users className="h-4 w-4" />,
        },
        {
          title: "Revenue",
          value: "—",
          change: "No scope selected",
          icon: <TrendingUp className="h-4 w-4" />,
        },
      ];
    }

    return [
      {
        title: "Total Articles",
        value: stats.articleCount.toLocaleString(),
        change: "In current scope",
        icon: <Package className="h-4 w-4" />,
      },
      {
        title: "Total Orders",
        value: stats.orderCount.toLocaleString(),
        change: "In current scope",
        icon: <ShoppingCart className="h-4 w-4" />,
      },
      {
        title: "Active Customers",
        value: stats.clientCount.toLocaleString(),
        change: "In current scope",
        icon: <Users className="h-4 w-4" />,
      },
      {
        title: "Revenue",
        value: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(stats.revenue),
        change: "From orders",
        icon: <TrendingUp className="h-4 w-4" />,
      },
    ];
  }, [stats]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's what's happening with your store."
        actions={
          <ActionGroup>
            <ActionButton variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
              Export Report
            </ActionButton>
            <ActionButton variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              New Order
            </ActionButton>
          </ActionGroup>
        }
      />

      {/* Scope Indicator */}
      <div className="text-sm text-muted-foreground">
        Showing data for <span className="font-medium">{scope.orgId || "No org selected"}</span>
        {scope.etbId && <> / <span className="font-medium">{scope.etbId}</span></>}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className="text-muted-foreground">{stat.icon}</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {stat.change && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.change.startsWith("+") ? (
                        <span className="text-green-500 inline-flex items-center">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          {stat.change}
                        </span>
                      ) : (
                        <span>{stat.change}</span>
                      )}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Manage Articles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Add, edit, or manage your product inventory.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  View Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track and manage customer orders.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer List
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View and manage customer information.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity - Real-time from Convex */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Orders (Real-time)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentActivity scope={scope} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function RecentActivity({ scope }: { scope: { orgId: string | null; etbId: string | null } }) {
  // Use a simple fetch to get recent headers from Convex
  const [recentHeaders, setRecentHeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scope.orgId || !scope.etbId) {
      setRecentHeaders([]);
      setLoading(false);
      return;
    }

    // Poll for recent orders every 5 seconds
    const fetchRecent = async () => {
      try {
        const response = await fetch(`/api/recent-orders?idOrg=${scope.orgId}&idEtb=${scope.etbId}`);
        if (response.ok) {
          const data = await response.json();
          setRecentHeaders(data.headers);
        }
      } catch (error) {
        console.error("Error fetching recent orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
    const interval = setInterval(fetchRecent, 5000);
    return () => clearInterval(interval);
  }, [scope.orgId, scope.etbId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <div className="h-4 bg-muted rounded flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (recentHeaders.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No recent orders. Orders will appear here in real-time when created.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentHeaders.slice(0, 5).map((header) => (
        <div key={header.id} className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <ShoppingCart className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{header.reference}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                header.status === "PAID"
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : header.status === "PENDING"
                  ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                  : "bg-gray-500/10 text-gray-700 dark:text-gray-400"
              }`}>
                {header.status || "DRAFT"}
              </span>
            </div>
            {header.taxedAmount && (
              <p className="text-xs text-muted-foreground">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(header.taxedAmount)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

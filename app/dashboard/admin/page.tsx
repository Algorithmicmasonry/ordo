import {
  getDashboardStats,
  getRecentOrders,
  getRevenueTrend,
  getTopProducts,
} from "@/app/actions/dashboard-stats";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import type { TimePeriod } from "@/lib/types";
import type { Currency } from "@prisma/client";
import { Download } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  CurrencyFilter,
  DashboardHeader,
  PeriodFilter,
  RecentOrders,
  RevenueChart,
  StatsCards,
  TopProducts,
} from "./_components";
import { InstallPrompt } from "@/app/_components/install-prompt";

interface AdminDashboardPageProps {
  searchParams: Promise<{ period?: string; currency?: string }>;
}

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get period and currency from search params
  const params = await searchParams;
  const period = (params?.period || "today") as TimePeriod;
  const currency = (params?.currency as Currency) || "NGN"; // Default to NGN, never show mixed currencies

  // Validate period
  const validPeriods: TimePeriod[] = ["today", "week", "month", "year"];
  const currentPeriod = validPeriods.includes(period) ? period : "today";

  // Fetch all dashboard data in parallel
  const [statsResult, revenueResult, productsResult, ordersResult] =
    await Promise.all([
      getDashboardStats(currentPeriod, currency),
      getRevenueTrend(currentPeriod, currency),
      getTopProducts(currentPeriod, 3, currency),
      getRecentOrders(5),
    ]);

  return (
    <div>
      <DashboardHeader
        heading="Administrator Dashboard"
        text="Monitor your business performance in real-time"
      />

      {/* PWA Components */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <InstallPrompt />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PeriodFilter currentPeriod={currentPeriod} />
          <CurrencyFilter />
        </div>

        <Button>
          <Download className="size-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="space-y-8">
        <StatsCards
          stats={statsResult.success ? statsResult.data : null}
          currency={currency}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <RevenueChart
            data={revenueResult.success ? revenueResult.data : null}
            className="lg:col-span-2"
          />
          <TopProducts
            products={productsResult.success ? productsResult.data : null}
          />
        </div>

        <RecentOrders
          orders={ordersResult.success ? ordersResult.data : null}
        />
      </div>
    </div>
  );
}

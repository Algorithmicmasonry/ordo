import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSalesRepDashboardStats, getAssignedOrders } from "./actions";
import {
  DashboardStats,
  FollowUpReminder,
  AssignedOrdersTable,
  DashboardHeader,
  PeriodFilter,
  CreateOrderDialog,
} from "./_components";
import type { OrderStatus } from "@prisma/client";
import type { TimePeriod } from "@/lib/types";
import { PushNotificationManager } from "@/app/_components/push-notification-manager";
import { InstallPrompt } from "@/app/_components/install-prompt";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
    period?: string;
  }>;
}

export default async function SalesRepDashboardPage({
  searchParams,
}: PageProps) {
  // Authentication check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "SALES_REP") {
    redirect("/dashboard");
  }

  // Parse search params
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const status = (params.status || "ALL") as OrderStatus | "ALL" | "FOLLOW_UP";
  const search = params.search || "";
  const period = (params.period || "month") as TimePeriod;

  // Fetch dashboard data
  const [statsResult, ordersResult] = await Promise.all([
    getSalesRepDashboardStats(period),
    getAssignedOrders({ page, status, search }),
  ]);

  if (!statsResult.success || !statsResult.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">
            Failed to Load Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {statsResult.error || "Unable to fetch dashboard data"}
          </p>
        </div>
      </div>
    );
  }

  if (!ordersResult.success || !ordersResult.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">
            Failed to Load Orders
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {ordersResult.error || "Unable to fetch orders"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Dashboard Header */}
      <div>
        <DashboardHeader
          heading="Dashboard Overview"
          text="Track your orders, performance, and customer interactions"
        />
      </div>

      {/* PWA Components */}
      <div className="grid gap-4 md:grid-cols-2">
        <InstallPrompt />
        <PushNotificationManager />
      </div>

      {/* Period Filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
        <PeriodFilter currentPeriod={period} />
        <CreateOrderDialog />
      </div>

      {/* Stats Cards */}
      <DashboardStats stats={statsResult.data} />

      {/* Follow-up Reminder */}
      {statsResult.data.followUpOrders > 0 && (
        <FollowUpReminder count={statsResult.data.followUpOrders} />
      )}

      {/* Assigned Orders Table */}
      <AssignedOrdersTable
        orders={ordersResult.data.orders}
        pagination={ordersResult.data.pagination}
        currentStatus={status}
        currentSearch={search}
      />
    </div>
  );
}

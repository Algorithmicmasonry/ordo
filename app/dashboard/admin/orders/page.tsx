import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OrdersStats } from "./_components";
import { OrdersTable } from "./_components";
import { getOrders, getOrderStats, getUniqueLocations } from "./actions";
import { OrderStatus, OrderSource } from "@prisma/client";
import { DashboardHeader, PeriodFilter } from "../_components";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { TimePeriod } from "@/lib/types";

type SearchParams = {
  page?: string;
  status?: OrderStatus;
  source?: OrderSource;
  location?: string;
  search?: string;
  period?: string; // Add period parameter
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const searchParameter = await searchParams;
  const searchParamsPage = searchParameter.page || "1";

  // Get and validate period
  const period = (searchParameter.period || "month") as TimePeriod;
  const validPeriods: TimePeriod[] = ["today", "week", "month", "year"];
  const currentPeriod = validPeriods.includes(period) ? period : "month";

  // Parse search params
  const page = parseInt(searchParamsPage);
  const filters = {
    status: searchParameter.status,
    source: searchParameter.source,
    location: searchParameter.location,
    search: searchParameter.search,
  };

  // Fetch data with period
  const [ordersResponse, statsResponse, locationsResponse] = await Promise.all([
    getOrders(filters, { page, perPage: 10 }, currentPeriod),
    getOrderStats(currentPeriod),
    getUniqueLocations(),
  ]);

  // Handle errors - show empty state or error message
  if (!ordersResponse.success || !ordersResponse.data) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          heading="Orders Management"
          text="Track and manage your assigned customer orders in real-time"
        />
        <div className="text-center py-12">
          <p className="text-muted-foreground">{ordersResponse.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Orders Management"
        text="Track and manage your assigned customer orders in real-time"
      />

      {/* Period Filter and Export Button */}
      <div className="flex items-center justify-between">
        <PeriodFilter currentPeriod={currentPeriod} />
        <Button>
          <Download className="size-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {statsResponse.success && statsResponse.data && (
        <OrdersStats stats={statsResponse.data} period={currentPeriod} />
      )}

      <OrdersTable
        orders={ordersResponse.data.orders}
        pagination={ordersResponse.data.pagination}
        locations={locationsResponse.data || []}
      />
    </div>
  );
}

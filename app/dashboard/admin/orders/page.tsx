import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OrdersStats, ExportOrdersButton } from "./_components";
import { OrdersTable } from "./_components";
import { getOrders, getOrderStats, getUniqueLocations } from "./actions";
import { OrderStatus, OrderSource, Currency } from "@prisma/client";
import { DashboardHeader, PeriodFilter, CurrencyFilter } from "../_components";
import type { TimePeriod } from "@/lib/types";

type SearchParams = {
  page?: string;
  status?: OrderStatus;
  source?: OrderSource;
  location?: string;
  search?: string;
  period?: string;
  currency?: Currency; // Add currency filter
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
    currency: searchParameter.currency,
  };

  // Fetch data with period and currency
  const [ordersResponse, statsResponse, locationsResponse] = await Promise.all([
    getOrders(filters, { page, perPage: 10 }, currentPeriod),
    getOrderStats(currentPeriod, filters.currency),
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
    <div className="space-y-4 sm:space-y-6">
      <DashboardHeader
        heading="Orders Management"
        text="Track and manage your assigned customer orders in real-time"
      />

      {/* Period and Currency Filters with Export Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <PeriodFilter currentPeriod={currentPeriod} />
          <CurrencyFilter />
        </div>
        <ExportOrdersButton
          orders={ordersResponse.data.orders}
          currency={filters.currency}
          className="w-full sm:w-auto"
        />
      </div>

      {statsResponse.success && statsResponse.data && (
        <OrdersStats stats={statsResponse.data} period={currentPeriod} currency={filters.currency} />
      )}

      <OrdersTable
        orders={ordersResponse.data.orders}
        pagination={ordersResponse.data.pagination}
        locations={locationsResponse.data || []}
      />
    </div>
  );
}

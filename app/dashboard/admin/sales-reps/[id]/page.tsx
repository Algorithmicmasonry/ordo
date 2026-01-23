import { Suspense } from "react";
import { notFound } from "next/navigation";
import SalesRepDetailsClient from "./_components/sales-rep-details-client";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import type { OrderStatus, OrderSource } from "@prisma/client";
import type { Metadata } from "next";
import { TimePeriod } from "@/lib/types";
import {
  getDateRange,
  getPreviousPeriodRange,
  calculatePercentageChange,
} from "@/lib/date-utils";

async function getSalesRepDetails(repId: string, period: TimePeriod = "month") {
  const { startDate, endDate } = getDateRange(period);
  const previousRange = getPreviousPeriodRange(period);

  // Fetch sales rep with orders in BOTH periods
  const salesRep = await db.user.findUnique({
    where: {
      id: repId,
      role: "SALES_REP",
    },
    include: {
      orders: {
        where: {
          createdAt: {
            gte: previousRange.startDate,
            lte: endDate,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!salesRep) {
    notFound();
  }

  // Split orders into current and previous periods
  const currentOrders = salesRep.orders.filter(
    (o) => o.createdAt >= startDate && o.createdAt <= endDate,
  );
  const previousOrders = salesRep.orders.filter(
    (o) =>
      o.createdAt >= previousRange.startDate &&
      o.createdAt <= previousRange.endDate,
  );

  // Calculate current period stats
  const totalOrders = currentOrders.length;
  const deliveredOrders = currentOrders.filter(
    (o) => o.status === "DELIVERED",
  ).length;

  // Calculate revenue (current period)
  const revenue = currentOrders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, order) => {
      const orderRevenue = order.items.reduce(
        (itemSum, item) => itemSum + item.price * item.quantity,
        0,
      );
      return sum + orderRevenue;
    }, 0);

  // Calculate profit using real cost from order items
  const cost = currentOrders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, order) => {
      const orderCost = order.items.reduce(
        (itemSum, item) => itemSum + item.cost * item.quantity,
        0,
      );
      return sum + orderCost;
    }, 0);

  // For individual sales reps, show Gross Profit (Revenue - Cost)
  // Company-wide expenses are tracked at the dashboard level, not per rep
  const profit = revenue - cost;

  const conversionRate =
    totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

  // Calculate previous period stats for trends
  const prevTotalOrders = previousOrders.length;
  const prevDeliveredOrders = previousOrders.filter(
    (o) => o.status === "DELIVERED",
  ).length;

  const prevRevenue = previousOrders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, order) => {
      const orderRevenue = order.items.reduce(
        (itemSum, item) => itemSum + item.price * item.quantity,
        0,
      );
      return sum + orderRevenue;
    }, 0);

  const prevCost = previousOrders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, order) => {
      const orderCost = order.items.reduce(
        (itemSum, item) => itemSum + item.cost * item.quantity,
        0,
      );
      return sum + orderCost;
    }, 0);

  // Previous period gross profit (Revenue - Cost)
  const prevProfit = prevRevenue - prevCost;

  const prevConversionRate =
    prevTotalOrders > 0
      ? Math.round((prevDeliveredOrders / prevTotalOrders) * 100)
      : 0;

  // Calculate real trends
  const trends = {
    orders: calculatePercentageChange(totalOrders, prevTotalOrders),
    delivered: calculatePercentageChange(deliveredOrders, prevDeliveredOrders),
    revenue: calculatePercentageChange(revenue, prevRevenue),
    profit: calculatePercentageChange(profit, prevProfit),
    conversion: calculatePercentageChange(conversionRate, prevConversionRate),
  };

  // Orders by status (current period only)
  const ordersByStatus = currentOrders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    },
    {} as Record<OrderStatus, number>,
  );

  // Orders by source (current period only)
  const ordersBySource = currentOrders.reduce(
    (acc, order) => {
      acc[order.source] = (acc[order.source] || 0) + 1;
      return acc;
    },
    {} as Record<OrderSource, number>,
  );

  return {
    ...salesRep,
    orders: currentOrders, // Only return current period orders for display
    stats: {
      totalOrders,
      deliveredOrders,
      revenue,
      profit,
      conversionRate,
      ordersByStatus,
      ordersBySource,
      trends,
    },
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string }>;
}

export default async function SalesRepDetailsPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const period = (query?.period || "month") as TimePeriod;

  const salesRep = await getSalesRepDetails(id, period);

  return (
    <Suspense fallback={<SalesRepDetailsSkeleton />}>
      <SalesRepDetailsClient salesRep={salesRep} currentPeriod={period} />
    </Suspense>
  );
}

function SalesRepDetailsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <Skeleton className="h-5 w-48" />

      {/* Profile Header */}
      <Skeleton className="h-40" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>

      {/* Table */}
      <Skeleton className="h-96" />
    </div>
  );
}
// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const salesRep = await db.user.findUnique({
    where: { id },
    select: { name: true },
  });

  return {
    title: salesRep
      ? `${salesRep.name} - Sales Rep Details`
      : "Sales Rep Details",
    description: `Performance details and statistics for ${salesRep?.name || "sales representative"}`,
  };
}

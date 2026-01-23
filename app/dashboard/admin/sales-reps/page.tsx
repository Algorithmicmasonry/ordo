import { Suspense } from "react";
import { SalesRepsClient } from "./_components";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { TimePeriod } from "@/lib/types";
import {
  getDateRange,
  getPreviousPeriodRange,
  calculatePercentageChange,
} from "@/lib/date-utils";

async function getSalesRepsData(period: TimePeriod = "month") {
  const { startDate, endDate } = getDateRange(period);
  const previousRange = getPreviousPeriodRange(period);

  // Fetch all sales reps with their orders in BOTH periods
  const salesReps = await db.user.findMany({
    where: {
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
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate stats for each rep with trends
  const salesRepsWithStats = salesReps.map((rep) => {
    // Split orders into current and previous periods
    const currentOrders = rep.orders.filter(
      (o) => o.createdAt >= startDate && o.createdAt <= endDate,
    );
    const previousOrders = rep.orders.filter(
      (o) =>
        o.createdAt >= previousRange.startDate &&
        o.createdAt <= previousRange.endDate,
    );

    // Calculate current period stats
    const totalOrders = currentOrders.length;
    const deliveredOrders = currentOrders.filter(
      (o) => o.status === "DELIVERED",
    ).length;
    const conversionRate =
      totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;
    const revenue = currentOrders
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Calculate previous period stats
    const prevTotalOrders = previousOrders.length;
    const prevDeliveredOrders = previousOrders.filter(
      (o) => o.status === "DELIVERED",
    ).length;
    const prevRevenue = previousOrders
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Calculate percentage changes
    const ordersChange = calculatePercentageChange(totalOrders, prevTotalOrders);
    const deliveredChange = calculatePercentageChange(
      deliveredOrders,
      prevDeliveredOrders,
    );
    const revenueChange = calculatePercentageChange(revenue, prevRevenue);

    return {
      ...rep,
      stats: {
        totalOrders,
        deliveredOrders,
        conversionRate,
        revenue,
        trends: {
          orders: ordersChange,
          delivered: deliveredChange,
          revenue: revenueChange,
        },
      },
    };
  });

  // Calculate overall stats with trends
  const totalReps = salesReps.length;
  const activeReps = salesReps.filter((rep) => rep.isActive).length;

  // Current period totals
  const totalOrders = salesRepsWithStats.reduce(
    (sum, rep) => sum + rep.stats.totalOrders,
    0,
  );
  const avgConversion =
    salesRepsWithStats.length > 0
      ? Math.round(
          salesRepsWithStats.reduce(
            (sum, rep) => sum + rep.stats.conversionRate,
            0,
          ) / salesRepsWithStats.length,
        )
      : 0;

  // Previous period totals for trends
  const prevTotalOrders = salesRepsWithStats.reduce((sum, rep) => {
    const prevOrders = rep.orders.filter(
      (o) =>
        o.createdAt >= previousRange.startDate &&
        o.createdAt <= previousRange.endDate,
    );
    return sum + prevOrders.length;
  }, 0);

  const prevAvgConversion =
    salesRepsWithStats.length > 0
      ? Math.round(
          salesRepsWithStats.reduce((sum, rep) => {
            const prevOrders = rep.orders.filter(
              (o) =>
                o.createdAt >= previousRange.startDate &&
                o.createdAt <= previousRange.endDate,
            );
            const prevDelivered = prevOrders.filter(
              (o) => o.status === "DELIVERED",
            ).length;
            const prevConv =
              prevOrders.length > 0
                ? (prevDelivered / prevOrders.length) * 100
                : 0;
            return sum + prevConv;
          }, 0) / salesRepsWithStats.length,
        )
      : 0;

  return {
    salesReps: salesRepsWithStats,
    stats: {
      totalReps,
      activeReps,
      totalOrders,
      avgConversion,
      trends: {
        totalReps: 0, // Rep count doesn't change with period
        orders: calculatePercentageChange(totalOrders, prevTotalOrders),
        avgConversion: calculatePercentageChange(avgConversion, prevAvgConversion),
      },
    },
  };
}

interface SalesRepsPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function SalesRepsPage({
  searchParams,
}: SalesRepsPageProps) {
  const params = await searchParams;
  const period = (params?.period || "month") as TimePeriod;

  const data = await getSalesRepsData(period);

  return (
    <Suspense fallback={<SalesRepsPageSkeleton />}>
      <SalesRepsClient
        salesReps={data.salesReps}
        stats={data.stats}
        currentPeriod={period}
      />
    </Suspense>
  );
}

function SalesRepsPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      {/* Search */}
      <Skeleton className="h-10 w-96" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      {/* Leaderboard */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>

      {/* Table */}
      <Skeleton className="h-96" />
    </div>
  );
}

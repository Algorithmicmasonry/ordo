import { Suspense } from "react";
import { SalesRepsClient } from "./_components";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";

async function getSalesRepsData() {
  // Fetch all sales reps with their orders
  const salesReps = await db.user.findMany({
    where: {
      role: "SALES_REP",
    },
    include: {
      orders: {
        select: {
          id: true,
          status: true,
          totalAmount: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate stats for each rep
  const salesRepsWithStats = salesReps.map((rep) => {
    const totalOrders = rep.orders.length;
    const deliveredOrders = rep.orders.filter(
      (order) => order.status === "DELIVERED",
    ).length;
    const conversionRate =
      totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;
    const revenue = rep.orders
      .filter((order) => order.status === "DELIVERED")
      .reduce((sum, order) => sum + order.totalAmount, 0);

    return {
      ...rep,
      stats: {
        totalOrders,
        deliveredOrders,
        conversionRate,
        revenue,
      },
    };
  });

  // Calculate overall stats
  const totalReps = salesReps.length;
  const activeReps = salesReps.filter((rep) => rep.isActive).length;
  const totalOrders = salesReps.reduce(
    (sum, rep) => sum + rep.orders.length,
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

  return {
    salesReps: salesRepsWithStats,
    stats: {
      totalReps,
      activeReps,
      totalOrders,
      avgConversion,
    },
  };
}

export default async function SalesRepsPage() {
  const data = await getSalesRepsData();

  return (
    <Suspense fallback={<SalesRepsPageSkeleton />}>
      <SalesRepsClient salesReps={data.salesReps} stats={data.stats} />
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

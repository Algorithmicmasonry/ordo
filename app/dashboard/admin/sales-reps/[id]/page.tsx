import { Suspense } from "react";
import { notFound } from "next/navigation";
import SalesRepDetailsClient from "./_components/sales-rep-details-client";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import type { OrderStatus, OrderSource } from "@prisma/client";
import type { Metadata } from "next";

async function getSalesRepDetails(repId: string) {
  // Fetch sales rep with all orders
  const salesRep = await db.user.findUnique({
    where: {
      id: repId,
      role: "SALES_REP",
    },
    include: {
      orders: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!salesRep) {
    notFound();
  }

  // Calculate statistics
  const totalOrders = salesRep.orders.length;
  const deliveredOrders = salesRep.orders.filter(
    (order) => order.status === "DELIVERED",
  ).length;
  const revenue = salesRep.orders
    .filter((order) => order.status === "DELIVERED")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  // Calculate profit (assuming 30% margin for demonstration)
  const profit = revenue * 0.3;

  const conversionRate =
    totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

  // Orders by status
  const ordersByStatus = salesRep.orders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    },
    {} as Record<OrderStatus, number>,
  );

  // Orders by source
  const ordersBySource = salesRep.orders.reduce(
    (acc, order) => {
      acc[order.source] = (acc[order.source] || 0) + 1;
      return acc;
    },
    {} as Record<OrderSource, number>,
  );

  // Mock trends (in production, compare with previous period)
  const trends = {
    orders: 12,
    delivered: 8,
    revenue: 15,
    profit: -2,
    conversion: 1.2,
  };

  return {
    ...salesRep,
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
  params: {
    id: string;
  };
}

export default async function SalesRepDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const salesRep = await getSalesRepDetails(id);

  return (
    <Suspense fallback={<SalesRepDetailsSkeleton />}>
      <SalesRepDetailsClient salesRep={salesRep} />
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

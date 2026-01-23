import { Suspense } from "react";
import { CustomersClient } from "./_components";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import {
  getDateRange,
  getPreviousPeriodRange,
  calculatePercentageChange,
} from "@/lib/date-utils";
import type { TimePeriod } from "@/lib/types";

interface CustomersPageProps {
  searchParams: Promise<{ period?: string }>;
}

async function getCustomersData(period: TimePeriod = "month") {
  const { startDate, endDate } = getDateRange(period);
  const previousRange = getPreviousPeriodRange(period);

  // Fetch orders from both current and previous periods for trend calculation
  const orders = await db.order.findMany({
    where: {
      createdAt: {
        gte: previousRange.startDate,
        lte: endDate,
      },
    },
    select: {
      customerName: true,
      customerPhone: true,
      customerWhatsapp: true,
      totalAmount: true,
      status: true,
      createdAt: true,
      city: true,
      state: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Split orders into current and previous periods
  const currentOrders = orders.filter(
    (o) => o.createdAt >= startDate && o.createdAt <= endDate
  );
  const previousOrders = orders.filter(
    (o) =>
      o.createdAt >= previousRange.startDate &&
      o.createdAt <= previousRange.endDate
  );

  // Group current period orders by customer phone (unique identifier)
  const customerMap = new Map();

  currentOrders.forEach((order) => {
    const phone = order.customerPhone;

    if (!customerMap.has(phone)) {
      customerMap.set(phone, {
        name: order.customerName,
        phone: order.customerPhone,
        whatsapp: order.customerWhatsapp || order.customerPhone,
        orders: [],
        totalSpent: 0,
        successfulOrders: 0,
        cancelledOrders: 0,
        firstOrderDate: order.createdAt,
        lastOrderDate: order.createdAt,
        location:
          order.city && order.state ? `${order.city}, ${order.state}` : null,
      });
    }

    const customer = customerMap.get(phone);
    customer.orders.push(order);
    customer.totalSpent += order.totalAmount;
    customer.lastOrderDate = order.createdAt; // Most recent

    if (order.status === "DELIVERED") {
      customer.successfulOrders++;
    } else if (order.status === "CANCELLED") {
      customer.cancelledOrders++;
    }
  });

  // Convert map to array and calculate reliability
  const customers = Array.from(customerMap.values()).map((customer) => {
    const totalOrders = customer.orders.length;
    const reliabilityRate =
      totalOrders > 0 ? (customer.successfulOrders / totalOrders) * 100 : 0;

    let reliability: "high" | "average" | "low";
    if (reliabilityRate >= 80) {
      reliability = "high";
    } else if (reliabilityRate >= 50) {
      reliability = "average";
    } else {
      reliability = "low";
    }

    return {
      ...customer,
      totalOrders,
      reliabilityRate,
      reliability,
    };
  });

  // Calculate current period stats
  const totalCustomers = customers.length;

  // Active customers (ordered in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const activeCustomers = customers.filter(
    (c) => new Date(c.lastOrderDate) >= thirtyDaysAgo,
  ).length;

  // Returning customers (2+ orders)
  const returningCustomers = customers.filter((c) => c.totalOrders >= 2).length;
  const returningRate =
    totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

  // Average lifetime value
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgLifetimeValue =
    totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  // Calculate previous period stats for trends
  const prevCustomerMap = new Map();
  previousOrders.forEach((order) => {
    const phone = order.customerPhone;
    if (!prevCustomerMap.has(phone)) {
      prevCustomerMap.set(phone, {
        totalSpent: 0,
        orders: [],
        successfulOrders: 0,
        lastOrderDate: order.createdAt,
      });
    }
    const customer = prevCustomerMap.get(phone);
    customer.orders.push(order);
    customer.totalSpent += order.totalAmount;
    customer.lastOrderDate = order.createdAt;
    if (order.status === "DELIVERED") {
      customer.successfulOrders++;
    }
  });

  const prevCustomers = Array.from(prevCustomerMap.values());
  const prevTotalCustomers = prevCustomers.length;

  // Previous active customers (ordered in last 30 days of previous period)
  const prevPeriodEndDate = previousRange.endDate;
  const prevThirtyDaysAgo = new Date(prevPeriodEndDate);
  prevThirtyDaysAgo.setDate(prevThirtyDaysAgo.getDate() - 30);
  const prevActiveCustomers = prevCustomers.filter(
    (c) => new Date(c.lastOrderDate) >= prevThirtyDaysAgo
  ).length;

  // Previous returning customers
  const prevReturningCustomers = prevCustomers.filter(
    (c) => c.orders.length >= 2
  ).length;
  const prevReturningRate =
    prevTotalCustomers > 0
      ? (prevReturningCustomers / prevTotalCustomers) * 100
      : 0;

  // Previous average lifetime value
  const prevTotalRevenue = prevCustomers.reduce(
    (sum, c) => sum + c.totalSpent,
    0
  );
  const prevAvgLifetimeValue =
    prevTotalCustomers > 0 ? prevTotalRevenue / prevTotalCustomers : 0;

  // Calculate percentage changes
  const trends = {
    totalCustomers: calculatePercentageChange(
      totalCustomers,
      prevTotalCustomers
    ),
    activeCustomers: calculatePercentageChange(
      activeCustomers,
      prevActiveCustomers
    ),
    returningRate: calculatePercentageChange(returningRate, prevReturningRate),
    avgLifetimeValue: calculatePercentageChange(
      avgLifetimeValue,
      prevAvgLifetimeValue
    ),
  };

  // Sort by total spent (descending)
  customers.sort((a, b) => b.totalSpent - a.totalSpent);

  return {
    customers,
    stats: {
      totalCustomers,
      activeCustomers,
      returningRate,
      avgLifetimeValue,
      trends,
    },
  };
}

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const params = await searchParams;
  const period = (params?.period || "month") as TimePeriod;
  const data = await getCustomersData(period);

  return (
    <Suspense fallback={<CustomersPageSkeleton />}>
      <CustomersClient
        customers={data.customers}
        stats={data.stats}
        currentPeriod={period}
      />
    </Suspense>
  );
}

function CustomersPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      {/* Table */}
      <Skeleton className="h-96" />
    </div>
  );
}

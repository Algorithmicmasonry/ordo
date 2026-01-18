"use server";

import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { calculateRevenue, calculateProfit } from "@/lib/calculations";
import {
  getDateRange,
  getPreviousPeriodRange,
  calculatePercentageChange,
  getTimeBuckets,
  getDayLabels,
} from "@/lib/date-utils";
import type {
  TimePeriod,
  DashboardStats,
  RevenueTrendData,
  TopProduct,
  RecentOrder,
} from "@/lib/types";

/**
 * Get comprehensive dashboard statistics with period comparison
 */
export async function getDashboardStats(period: TimePeriod = "today") {
  try {
    const { startDate, endDate } = getDateRange(period);
    const previousRange = getPreviousPeriodRange(period);

    // Parallel queries for current period
    const [
      currentRevenue,
      currentProfit,
      currentOrdersCount,
      currentDelivered,
      currentCancelled,
      previousRevenue,
      previousProfit,
      previousOrdersCount,
    ] = await Promise.all([
      // Current period metrics
      calculateRevenue(startDate, endDate),
      calculateProfit(startDate, endDate),
      db.order.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      db.order.count({
        where: {
          status: OrderStatus.DELIVERED,
          deliveredAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      db.order.count({
        where: {
          status: OrderStatus.CANCELLED,
          cancelledAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      // Previous period for comparison
      calculateRevenue(previousRange.startDate, previousRange.endDate),
      calculateProfit(previousRange.startDate, previousRange.endDate),
      db.order.count({
        where: {
          createdAt: {
            gte: previousRange.startDate,
            lte: previousRange.endDate,
          },
        },
      }),
    ]);

    // Calculate fulfillment and cancellation rates
    const fulfillmentRate =
      currentOrdersCount > 0
        ? Number(((currentDelivered / currentOrdersCount) * 100).toFixed(1))
        : 0;

    const cancelledRate =
      currentOrdersCount > 0
        ? Number(((currentCancelled / currentOrdersCount) * 100).toFixed(1))
        : 0;

    // Calculate percentage changes
    const revenueChange = calculatePercentageChange(
      currentRevenue,
      previousRevenue,
    );
    const profitChange = calculatePercentageChange(
      currentProfit,
      previousProfit,
    );
    const ordersChange = calculatePercentageChange(
      currentOrdersCount,
      previousOrdersCount,
    );

    const stats: DashboardStats = {
      revenue: currentRevenue,
      revenueChange,
      profit: currentProfit,
      profitChange,
      ordersCount: currentOrdersCount,
      ordersChange,
      fulfillmentRate,
      cancelledRate,
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      success: false,
      error: "Failed to fetch dashboard statistics",
      data: null,
    };
  }
}

/**
 * Get revenue trend data for charts (current vs previous period)
 */
export async function getRevenueTrend(period: TimePeriod = "today") {
  try {
    const { startDate, endDate } = getDateRange(period);
    const previousRange = getPreviousPeriodRange(period);

    // Get time buckets for the period
    const currentBuckets = getTimeBuckets(period, startDate);
    const previousBuckets = getTimeBuckets(period, previousRange.startDate);
    const labels = getDayLabels(period);

    // Fetch orders for current period
    const currentOrders = await db.order.findMany({
      where: {
        status: OrderStatus.DELIVERED,
        deliveredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        deliveredAt: true,
        items: {
          select: {
            price: true,
            quantity: true,
          },
        },
      },
    });

    // Fetch orders for previous period
    const previousOrders = await db.order.findMany({
      where: {
        status: OrderStatus.DELIVERED,
        deliveredAt: {
          gte: previousRange.startDate,
          lte: previousRange.endDate,
        },
      },
      select: {
        deliveredAt: true,
        items: {
          select: {
            price: true,
            quantity: true,
          },
        },
      },
    });

    // Helper function to group orders by time bucket
    const groupOrdersByBucket = (
      orders: typeof currentOrders,
      buckets: Date[],
    ) => {
      return buckets.map((bucket, index) => {
        const nextBucket =
          index < buckets.length - 1
            ? buckets[index + 1]
            : new Date(bucket.getTime() + 24 * 60 * 60 * 1000);

        const revenue = orders
          .filter((order) => {
            const orderDate = order.deliveredAt;
            return orderDate && orderDate >= bucket && orderDate < nextBucket;
          })
          .reduce((sum, order) => {
            const orderRevenue = order.items.reduce(
              (itemSum, item) => itemSum + item.price * item.quantity,
              0,
            );
            return sum + orderRevenue;
          }, 0);

        return revenue;
      });
    };

    const currentRevenues = groupOrdersByBucket(currentOrders, currentBuckets);
    const previousRevenues = groupOrdersByBucket(
      previousOrders,
      previousBuckets,
    );

    // Format data for chart
    const trendData: RevenueTrendData[] = labels.map((label, index) => ({
      label,
      current: currentRevenues[index] || 0,
      previous: previousRevenues[index] || 0,
    }));

    return {
      success: true,
      data: trendData,
    };
  } catch (error) {
    console.error("Error fetching revenue trend:", error);
    return {
      success: false,
      error: "Failed to fetch revenue trend",
      data: null,
    };
  }
}

/**
 * Get top selling products by revenue
 */
export async function getTopProducts(
  period: TimePeriod = "today",
  limit: number = 3,
) {
  try {
    const { startDate, endDate } = getDateRange(period);

    // Get delivered orders with items in the period
    const orders = await db.order.findMany({
      where: {
        status: OrderStatus.DELIVERED,
        deliveredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        items: {
          select: {
            productId: true,
            price: true,
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    // Aggregate revenue by product
    const productMap = new Map<
      string,
      {
        id: string;
        name: string;
        description: string | null;
        revenue: number;
        ordersCount: number;
      }
    >();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.productId;
        const revenue = item.price * item.quantity;

        if (productMap.has(productId)) {
          const existing = productMap.get(productId)!;
          existing.revenue += revenue;
          existing.ordersCount += 1;
        } else {
          productMap.set(productId, {
            id: item.product.id,
            name: item.product.name,
            description: item.product.description,
            revenue,
            ordersCount: 1,
          });
        }
      });
    });

    // Convert to array and sort by revenue
    const topProducts: TopProduct[] = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    return {
      success: true,
      data: topProducts,
    };
  } catch (error) {
    console.error("Error fetching top products:", error);
    return {
      success: false,
      error: "Failed to fetch top products",
      data: null,
    };
  }
}

/**
 * Get recent orders for display
 */
import type { OrderWithRelations } from "@/lib/types";

export async function getRecentOrders(
  limit: number = 5,
): Promise<OrderWithRelations[]> {
  const orders = await db.order.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
      agent: {
        select: { id: true, name: true, location: true },
      },
      items: {
        include: {
          product: {
            select: { id: true, name: true, price: true },
          },
        },
      },
      notes: true,
    },
  });

  return orders as OrderWithRelations[];
}

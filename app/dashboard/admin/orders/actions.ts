"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { OrderStatus, OrderSource, Currency, Prisma } from "@prisma/client";
import type { TimePeriod } from "@/lib/types";

// Define the exact type that matches what Prisma returns
type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    assignedTo: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    agent: {
      select: {
        id: true;
        name: true;
        location: true;
      };
    };
    items: {
      include: {
        product: {
          select: {
            id: true;
            name: true;
            price: true;
          };
        };
      };
    };
    notes: true;
  };
}>;

// Types for return values
type ActionResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export type OrderFilters = {
  status?: OrderStatus;
  source?: OrderSource;
  location?: string;
  search?: string;
  currency?: Currency;
};

export type PaginationParams = {
  page: number;
  perPage: number;
};

type OrdersData = {
  orders: OrderWithRelations[]; // Use the properly typed version
  pagination: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

// ... rest of your code stays the same ...

type StatsData = {
  totalHandled: number;
  deliveryRate: number;
  revenue: number;
  ordersChange: number;
  deliveryRateChange: number;
  revenueChange: number;
};

function getDateRangeForPeriod(period: TimePeriod) {
  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  return { startDate, endDate: now };
}

export async function getOrders(
  filters: OrderFilters = {},
  pagination: PaginationParams = { page: 1, perPage: 10 },
  period: TimePeriod = "month",
): Promise<ActionResponse<OrdersData>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        message: "You must be logged in to view orders",
      };
    }

    // Build where clause based on filters
    const where: Prisma.OrderWhereInput = {};

    // If user is SALES_REP, only show their assigned orders
    if (session.user.role === "SALES_REP") {
      where.assignedToId = session.user.id;
    }

    // Apply period filter
    const { startDate } = getDateRangeForPeriod(period);
    where.createdAt = {
      gte: startDate,
    };

    // Apply other filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.source) {
      where.source = filters.source;
    }

    if (filters.location) {
      where.OR = [
        { city: { contains: filters.location, mode: "insensitive" } },
        { state: { contains: filters.location, mode: "insensitive" } },
      ];
    }

    if (filters.currency) {
      where.currency = filters.currency;
    }

    if (filters.search) {
      const searchOrConditions: any[] = [
        { customerName: { contains: filters.search, mode: "insensitive" } },
        { customerPhone: { contains: filters.search, mode: "insensitive" } },
      ];

      // If search is a valid number, also search by orderNumber
      const searchAsNumber = parseInt(filters.search, 10);
      if (!isNaN(searchAsNumber)) {
        searchOrConditions.push({ orderNumber: searchAsNumber });
      }

      where.AND = [
        {
          OR: searchOrConditions,
        },
      ];
    }

    // Get total count for pagination
    const totalOrders = await db.order.count({ where });

    // Fetch orders with pagination
    const orders = await db.order.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        notes: {
          // ← ADD THIS
          orderBy: {
            createdAt: "desc",
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (pagination.page - 1) * pagination.perPage,
      take: pagination.perPage,
    });

    return {
      success: true,
      message: `Successfully loaded ${orders.length} order${orders.length !== 1 ? "s" : ""}`,
      data: {
        orders,
        pagination: {
          total: totalOrders,
          page: pagination.page,
          perPage: pagination.perPage,
          totalPages: Math.ceil(totalOrders / pagination.perPage),
        },
      },
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return {
      success: false,
      message: "Failed to load orders. Please try again.",
    };
  }
}

export async function getOrderStats(
  period: TimePeriod = "month",
  currency?: Currency,
): Promise<ActionResponse<StatsData>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        message: "You must be logged in to view statistics",
      };
    }

    // Build where clause - filter by user if SALES_REP
    const where: Prisma.OrderWhereInput = {};
    if (session.user.role === "SALES_REP") {
      where.assignedToId = session.user.id;
    }
    // Filter by currency if provided (defaults to NGN in UI)
    if (currency) {
      where.currency = currency;
    }

    // Get date ranges based on period
    const { startDate: currentStart } = getDateRangeForPeriod(period);
    const periodLength = new Date().getTime() - currentStart.getTime();
    const previousStart = new Date(currentStart.getTime() - periodLength);

    // ============ CURRENT PERIOD ============

    // Total orders in current period
    const currentPeriodOrders = await db.order.count({
      where: {
        ...where,
        createdAt: {
          gte: currentStart,
        },
      },
    });

    // Delivered orders in current period
    const currentDeliveredOrders = await db.order.count({
      where: {
        ...where,
        status: "DELIVERED",
        createdAt: {
          gte: currentStart,
        },
      },
    });

    // Current delivery rate
    const currentDeliveryRate =
      currentPeriodOrders > 0
        ? (currentDeliveredOrders / currentPeriodOrders) * 100
        : 0;

    // Current revenue
    const currentRevenueData = await db.order.aggregate({
      where: {
        ...where,
        status: "DELIVERED",
        createdAt: {
          gte: currentStart,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });
    const currentRevenue = currentRevenueData._sum.totalAmount || 0;

    // ============ PREVIOUS PERIOD ============

    // Total orders in previous period
    const previousPeriodOrders = await db.order.count({
      where: {
        ...where,
        createdAt: {
          gte: previousStart,
          lt: currentStart,
        },
      },
    });

    // Delivered orders in previous period
    const previousDeliveredOrders = await db.order.count({
      where: {
        ...where,
        status: "DELIVERED",
        createdAt: {
          gte: previousStart,
          lt: currentStart,
        },
      },
    });

    // Previous delivery rate
    const previousDeliveryRate =
      previousPeriodOrders > 0
        ? (previousDeliveredOrders / previousPeriodOrders) * 100
        : 0;

    // Previous revenue
    const previousRevenueData = await db.order.aggregate({
      where: {
        ...where,
        status: "DELIVERED",
        createdAt: {
          gte: previousStart,
          lt: currentStart,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });
    const previousRevenue = previousRevenueData._sum.totalAmount || 0;

    // ============ CALCULATE PERCENTAGE CHANGES ============

    // Orders change
    const ordersChange =
      previousPeriodOrders > 0
        ? parseFloat(
            (
              ((currentPeriodOrders - previousPeriodOrders) /
                previousPeriodOrders) *
              100
            ).toFixed(1),
          )
        : currentPeriodOrders > 0
          ? 100.0
          : 0.0;

    // Delivery rate change
    const deliveryRateChange =
      previousDeliveryRate > 0
        ? parseFloat(
            (
              ((currentDeliveryRate - previousDeliveryRate) /
                previousDeliveryRate) *
              100
            ).toFixed(1),
          )
        : currentDeliveryRate > 0
          ? 100.0
          : 0.0;

    // Revenue change
    const revenueChange =
      previousRevenue > 0
        ? parseFloat(
            (
              ((currentRevenue - previousRevenue) / previousRevenue) *
              100
            ).toFixed(1),
          )
        : currentRevenue > 0
          ? 100.0
          : 0.0;

    return {
      success: true,
      message: "Statistics loaded successfully",
      data: {
        totalHandled: currentPeriodOrders,
        deliveryRate: parseFloat(currentDeliveryRate.toFixed(1)),
        revenue: currentRevenue,
        ordersChange,
        deliveryRateChange,
        revenueChange,
      },
    };
  } catch (error) {
    console.error("Error fetching order stats:", error);
    return {
      success: false,
      message: "Failed to load statistics. Please try again.",
    };
  }
}

export async function getOrderById(
  orderId: string,
): Promise<ActionResponse<Awaited<ReturnType<typeof db.order.findUnique>>>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        message: "You must be logged in to view order details",
      };
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            phone: true,
            location: true,
            address: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        notes: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!order) {
      return {
        success: false,
        message: "Order not found. It may have been deleted.",
      };
    }

    // If user is SALES_REP, verify they own this order
    if (
      session.user.role === "SALES_REP" &&
      order.assignedToId !== session.user.id
    ) {
      return {
        success: false,
        message: "You don't have permission to view this order",
      };
    }

    return {
      success: true,
      message: "Order loaded successfully",
      data: order,
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    return {
      success: false,
      message: "Failed to load order details. Please try again.",
    };
  }
}

export async function getUniqueLocations(): Promise<
  ActionResponse<{ value: string; label: string }[]>
> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        message: "You must be logged in to view locations",
        data: [],
      };
    }

    const orders = await db.order.findMany({
      where: {
        city: {
          // This excludes both empty strings and (if nullable) nulls safely
          not: "",
        },
        // If your schema allows nulls (String?), Prisma handles this automatically:
        // NOT: [{ city: "" }, { city: null }]
      },
      select: {
        city: true,
        state: true,
      },
      distinct: ["city"],
    });

    // Map to the format expected by your Select component
    const locations = orders.map((order) => {
      // Ensure we have a string for the value to satisfy Radix UI
      const cityValue = order.city.trim();

      return {
        value: cityValue,
        label: order.state ? `${cityValue}, ${order.state}` : cityValue,
      };
    });

    return {
      success: true,
      message: "Locations loaded successfully",
      data: locations,
    };
  } catch (error) {
    console.error("Error fetching locations:", error);
    return {
      success: false,
      message: "Failed to load locations. Using defaults.",
      data: [],
    };
  }
}

// Additional helper action for updating order status
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<ActionResponse<null>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        message: "You must be logged in to update orders",
      };
    }

    // Check if order exists and user has permission
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, assignedToId: true, status: true },
    });

    if (!order) {
      return {
        success: false,
        message: "Order not found",
      };
    }

    // Sales reps can only update their own orders
    if (
      session.user.role === "SALES_REP" &&
      order.assignedToId !== session.user.id
    ) {
      return {
        success: false,
        message: "You don't have permission to update this order",
      };
    }

    // Update the order status
    await db.order.update({
      where: { id: orderId },
      data: {
        status,
        // Update timestamp fields based on status
        ...(status === "CONFIRMED" && { confirmedAt: new Date() }),
        ...(status === "DISPATCHED" && { dispatchedAt: new Date() }),
        ...(status === "DELIVERED" && { deliveredAt: new Date() }),
        ...(status === "CANCELLED" && { cancelledAt: new Date() }),
      },
    });

    return {
      success: true,
      message: `Order status updated to ${status.toLowerCase()}`,
    };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      message: "Failed to update order status. Please try again.",
    };
  }
}

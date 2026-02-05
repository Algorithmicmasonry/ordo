"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDateRange, getPreviousPeriodRange } from "@/lib/date-utils";
import type { OrderStatus, OrderSource, Prisma } from "@prisma/client";
import type { TimePeriod } from "@/lib/types";

export async function getSalesRepDashboardStats(period: TimePeriod = "month") {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.role !== "SALES_REP") {
      return { success: false, error: "Unauthorized" };
    }

    const salesRepId = session.user.id;

    // Get date ranges based on selected period
    const currentPeriodRange = getDateRange(period);
    const previousPeriodRange = getPreviousPeriodRange(period);

    // Total orders for the selected period
    const totalOrders = await db.order.count({
      where: {
        assignedToId: salesRepId,
        createdAt: {
          gte: currentPeriodRange.startDate,
          lte: currentPeriodRange.endDate,
        },
      },
    });

    // Orders in previous period
    const previousPeriodOrders = await db.order.count({
      where: {
        assignedToId: salesRepId,
        createdAt: {
          gte: previousPeriodRange.startDate,
          lte: previousPeriodRange.endDate,
        },
      },
    });

    // Calculate percentage change
    const percentageChange =
      previousPeriodOrders > 0
        ? ((totalOrders - previousPeriodOrders) / previousPeriodOrders) * 100
        : totalOrders > 0
        ? 100
        : 0;

    // Pending (NEW status) orders - current period
    const pendingOrders = await db.order.count({
      where: {
        assignedToId: salesRepId,
        status: "NEW",
        createdAt: {
          gte: currentPeriodRange.startDate,
          lte: currentPeriodRange.endDate,
        },
      },
    });

    // Confirmed orders - current period
    const confirmedOrders = await db.order.count({
      where: {
        assignedToId: salesRepId,
        status: "CONFIRMED",
        createdAt: {
          gte: currentPeriodRange.startDate,
          lte: currentPeriodRange.endDate,
        },
      },
    });

    // Delivered orders for the selected period
    const deliveredThisPeriod = await db.order.count({
      where: {
        assignedToId: salesRepId,
        status: "DELIVERED",
        createdAt: {
          gte: currentPeriodRange.startDate,
          lte: currentPeriodRange.endDate,
        },
      },
    });

    // Conversion rate (DELIVERED / Total) - for current period
    const deliveredTotal = await db.order.count({
      where: {
        assignedToId: salesRepId,
        status: "DELIVERED",
        createdAt: {
          gte: currentPeriodRange.startDate,
          lte: currentPeriodRange.endDate,
        },
      },
    });
    const conversionRate = totalOrders > 0 ? (deliveredTotal / totalOrders) * 100 : 0;

    // Orders requiring follow-up (have notes with follow-up dates that are today or in the past)
    const followUpOrders = await db.order.count({
      where: {
        assignedToId: salesRepId,
        notes: {
          some: {
            followUpDate: {
              lte: new Date(),
            },
          },
        },
        status: {
          in: ["NEW", "CONFIRMED"],
        },
      },
    });

    return {
      success: true,
      data: {
        totalOrders,
        percentageChange,
        pendingOrders,
        confirmedOrders,
        deliveredThisPeriod,
        conversionRate,
        followUpOrders,
      },
    };
  } catch (error) {
    console.error("Error fetching sales rep dashboard stats:", error);
    return { success: false, error: "Failed to fetch dashboard statistics" };
  }
}

interface GetAssignedOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus | "ALL" | "FOLLOW_UP";
  search?: string;
}

export async function getAssignedOrders({
  page = 1,
  limit = 10,
  status = "ALL",
  search,
}: GetAssignedOrdersParams = {}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.role !== "SALES_REP") {
      return { success: false, error: "Unauthorized" };
    }

    const salesRepId = session.user.id;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      assignedToId: salesRepId,
    };

    // Filter by status
    if (status === "FOLLOW_UP") {
      whereClause.notes = {
        some: {
          followUpDate: {
            lte: new Date(),
          },
        },
      };
      whereClause.status = {
        in: ["NEW", "CONFIRMED"],
      };
    } else if (status !== "ALL") {
      whereClause.status = status;
    }

    // Search by customer name or phone
    if (search && search.trim() !== "") {
      whereClause.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const totalOrders = await db.order.count({ where: whereClause });

    // Get paginated orders
    const orders = await db.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        notes: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Check which orders have pending follow-ups
    const ordersWithFollowUp = orders.map((order) => ({
      ...order,
      hasPendingFollowUp: order.notes.some(
        (note) => note.followUpDate && note.followUpDate <= new Date()
      ),
    }));

    return {
      success: true,
      data: {
        orders: ordersWithFollowUp,
        pagination: {
          total: totalOrders,
          page,
          limit,
          totalPages: Math.ceil(totalOrders / limit),
        },
      },
    };
  } catch (error) {
    console.error("Error fetching assigned orders:", error);
    return { success: false, error: "Failed to fetch assigned orders" };
  }
}

/**
 * Get available products for order creation
 */
export async function getAvailableProducts() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.role !== "SALES_REP") {
      return { success: false, error: "Unauthorized" };
    }

    const products = await db.product.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        price: true,
        currentStock: true,
        currency: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, data: products };
  } catch (error) {
    console.error("Error fetching available products:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

/**
 * Create order manually (assigned to current sales rep)
 */
export async function createManualOrder(data: {
  customerName: string;
  customerPhone: string;
  customerWhatsapp?: string;
  deliveryAddress: string;
  state: string;
  city: string;
  source: OrderSource;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.role !== "SALES_REP") {
      return { success: false, error: "Unauthorized" };
    }

    const salesRepId = session.user.id;

    // Calculate total amount and prepare order items
    let totalAmount = 0;
    const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];

    for (const item of data.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return {
          success: false,
          error: `Product not found: ${item.productId}`,
        };
      }

      if (!product.isActive || product.isDeleted) {
        return {
          success: false,
          error: `Product "${product.name}" is not available`,
        };
      }

      totalAmount += product.price * item.quantity;

      orderItems.push({
        product: { connect: { id: product.id } },
        quantity: item.quantity,
        price: product.price,
        cost: product.cost,
      });
    }

    // Create order assigned to current sales rep
    const order = await db.order.create({
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerWhatsapp: data.customerWhatsapp,
        deliveryAddress: data.deliveryAddress,
        state: data.state,
        city: data.city,
        source: data.source,
        totalAmount,
        assignedTo: { connect: { id: salesRepId } },
        status: "NEW",
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        assignedTo: true,
      },
    });

    revalidatePath("/dashboard/sales-rep");
    revalidatePath("/dashboard/sales-rep/orders");

    return {
      success: true,
      data: order,
    };
  } catch (error) {
    console.error("Error creating manual order:", error);
    return {
      success: false,
      error: "Failed to create order",
    };
  }
}

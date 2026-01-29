"use server";

import { db } from "@/lib/db";
import { getNextSalesRep } from "@/lib/round-robin";
import { updateInventoryOnDelivery } from "@/lib/calculations";
import { OrderFormData } from "@/lib/types";
import { OrderStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notifySalesRep } from "./push-notifications";
import { createNotification } from "./notifications";

/**
 * Create a new order from the embedded form
 * Automatically assigns to sales rep using round-robin
 */
export async function createOrder(data: OrderFormData) {
  try {
    // Get next sales rep in round-robin
    const assignedToId = await getNextSalesRep();

    if (!assignedToId) {
      return {
        success: false,
        error: "No active sales representatives available",
      };
    }

    // Calculate total amount
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

      totalAmount += product.price * item.quantity;

      orderItems.push({
        product: { connect: { id: product.id } },
        quantity: item.quantity,
        price: product.price,
        cost: product.cost,
      });
    }

    // Create order with items
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
        assignedTo: { connect: { id: assignedToId } },
        status: OrderStatus.NEW,
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

    // Notify the assigned sales rep (push notification)
    await notifySalesRep(assignedToId, {
      title: "New Order Assigned 📦",
      body: `Order ${order.orderNumber} from ${order.customerName} has been assigned to you`,
      url: `/dashboard/sales-rep/orders/${order.id}`,
      orderId: order.id,
    });

    // Create in-app notification
    await createNotification({
      userId: assignedToId,
      type: "ORDER_ASSIGNED",
      title: "New Order Assigned",
      message: `Order ${order.orderNumber} from ${order.customerName} (${order.customerPhone}) has been assigned to you`,
      link: `/dashboard/sales-rep/orders/${order.id}`,
      orderId: order.id,
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      success: false,
      error: "Failed to create order",
    };
  }
}

/**
 * Update order status (Sales Rep & Admin)
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  userId: string,
  userRole: string,
) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { assignedTo: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Sales reps can only update their own orders
    if (userRole === "SALES_REP" && order.assignedToId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    const updateData: any = { status };

    // Update timestamps based on status
    if (status === OrderStatus.CONFIRMED) {
      updateData.confirmedAt = new Date();
    } else if (status === OrderStatus.DISPATCHED) {
      updateData.dispatchedAt = new Date();
    } else if (status === OrderStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
      // Deduct inventory on delivery
      await updateInventoryOnDelivery(orderId);
    } else if (status === OrderStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
    }

    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        assignedTo: true,
        agent: true,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, error: "Failed to update order status" };
  }
}

/**
 * Assign agent to order (Sales Rep & Admin)
 */
export async function assignAgentToOrder(
  orderId: string,
  agentId: string,
  userId: string,
  userRole: string,
) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Sales reps can only update their own orders
    if (userRole === "SALES_REP" && order.assignedToId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: { agentId },
      include: {
        agent: true,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error("Error assigning agent:", error);
    return { success: false, error: "Failed to assign agent" };
  }
}

/**
 * Add note to order
 */
export async function addOrderNote(
  orderId: string,
  note: string,
  isFollowUp: boolean,
  followUpDate: Date | null,
  userId: string,
  userRole: string,
) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Sales reps can only add notes to their own orders
    if (userRole === "SALES_REP" && order.assignedToId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    const orderNote = await db.orderNote.create({
      data: {
        orderId,
        note,
        isFollowUp,
        followUpDate,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return { success: true, note: orderNote };
  } catch (error) {
    console.error("Error adding note:", error);
    return { success: false, error: "Failed to add note" };
  }
}

/**
 * Get orders for sales rep
 */
export async function getSalesRepOrders(salesRepId: string) {
  try {
    const orders = await db.order.findMany({
      where: { assignedToId: salesRepId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        agent: true,
        notes: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, orders };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}

/**
 * Get all orders (Admin only)
 */
export async function getAllOrders() {
  try {
    const orders = await db.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
        assignedTo: true,
        agent: true,
        notes: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, orders };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}

// lib/queries/orders.ts

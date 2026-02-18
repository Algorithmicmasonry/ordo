"use server";

import { db } from "@/lib/db";
import { getNextSalesRep } from "@/lib/round-robin";
import { updateInventoryOnDelivery } from "@/lib/calculations";
import { OrderFormData, OrderFormDataV2 } from "@/lib/types";
import { OrderStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notifySalesRep, notifyAdmins } from "./push-notifications";
import { createNotification, createBulkNotifications } from "./notifications";
import { determineOrderSource, formatUTMSource } from "@/lib/utm-parser";
import { formatCurrency } from "@/lib/currency";

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
        include: {
          productPrices: true,
        },
      });

      if (!product) {
        return {
          success: false,
          error: `Product not found: ${item.productId}`,
        };
      }

      // Get pricing for the product's primary currency
      const productPrice = product.productPrices.find(
        (p) => p.currency === product.currency
      );

      if (!productPrice) {
        return {
          success: false,
          error: `Pricing not configured for product: ${product.name}`,
        };
      }

      totalAmount += productPrice.price * item.quantity;

      orderItems.push({
        product: { connect: { id: product.id } },
        quantity: item.quantity,
        price: productPrice.price,
        cost: productPrice.cost,
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
      title: `Order #${order.orderNumber}`,
      body: `Order from ${order.customerName} has been assigned to you`,
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
 * Create a new order from the V2 embedded form (with packages and UTM tracking)
 * Automatically assigns to sales rep using round-robin
 */
export async function createOrderV2(data: OrderFormDataV2) {
  try {
    // Get next sales rep in round-robin
    const assignedToId = await getNextSalesRep();

    if (!assignedToId) {
      return {
        success: false,
        error: "No active sales representatives available",
      };
    }

    // Get product, packages, and pricing (filter by currency)
    const product = await db.product.findUnique({
      where: { id: data.productId },
      include: {
        packages: {
          where: {
            id: { in: data.selectedPackages },
            isActive: true,
            currency: data.currency,
          },
        },
        productPrices: {
          where: {
            currency: data.currency,
          },
        },
      },
    });

    if (!product) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    if (product.packages.length === 0) {
      return {
        success: false,
        error: `No packages available for ${data.currency}. Please select a different currency or contact support.`,
      };
    }

    // Get product cost from ProductPrice table
    const productPrice = product.productPrices[0];
    if (!productPrice) {
      return {
        success: false,
        error: `Pricing not configured for ${data.currency}. Please contact support.`,
      };
    }

    // Calculate total amount and create order items
    let totalAmount = 0;
    const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];

    for (const pkg of product.packages) {
      totalAmount += pkg.price;

      // Store unit price (package price / quantity) so that quantity × price = package price
      const unitPrice = pkg.price / pkg.quantity;

      orderItems.push({
        product: { connect: { id: product.id } },
        quantity: pkg.quantity,
        price: unitPrice, // Price per unit in package
        cost: productPrice.cost, // Cost per unit from ProductPrice table
      });
    }

    // Determine order source from UTM/referrer
    const utmSource = data.utmParams
      ? formatUTMSource(data.utmParams)
      : undefined;
    const orderSource = determineOrderSource(utmSource, data.referrer);

    // Create order with items
    const order = await db.order.create({
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerWhatsapp: data.customerWhatsapp,
        deliveryAddress: data.deliveryAddress,
        state: data.state,
        city: data.city,
        source: orderSource,
        currency: data.currency,
        utmSource,
        referrer: data.referrer,
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
      title: `Order #${order.orderNumber}`,
      body: `Order from ${order.customerName} - ${formatCurrency(order.totalAmount, data.currency)}`,
      url: `/dashboard/sales-rep/orders/${order.id}`,
      orderId: order.id,
    });

    // Create in-app notification for sales rep
    await createNotification({
      userId: assignedToId,
      type: "ORDER_ASSIGNED",
      title: "New Order Assigned",
      message: `Order ${order.orderNumber} from ${order.customerName} (${order.customerPhone}) - ${formatCurrency(order.totalAmount, data.currency)}`,
      link: `/dashboard/sales-rep/orders/${order.id}`,
      orderId: order.id,
    });

    // Notify all active admins
    const admins = await db.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true, name: true },
    });

    // Create in-app notifications for admins
    await createBulkNotifications({
      userIds: admins.map((a) => a.id),
      type: "NEW_ORDER",
      title: "New Order Received",
      message: `Order ${order.orderNumber} from ${order.customerName} (${order.customerPhone}) - ${formatCurrency(order.totalAmount, data.currency)}`,
      link: `/dashboard/admin/orders/${order.id}`,
      orderId: order.id,
    });

    // Send push notifications to admins
    await notifyAdmins({
      title: `Order #${order.orderNumber}`,
      body: `Order from ${order.customerName} - ${formatCurrency(order.totalAmount, data.currency)}`,
      url: `/dashboard/admin/orders/${order.id}`,
      orderId: order.id,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/orders");

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

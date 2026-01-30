"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getOrderDetails(orderId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch order with all relations
    const order = await db.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
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
        agent: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    return { success: true, data: order };
  } catch (error) {
    console.error("Error fetching order details:", error);
    return { success: false, error: "Failed to fetch order details" };
  }
}

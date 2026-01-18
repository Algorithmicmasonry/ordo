"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return null;
    }

    // Fetch full user data including role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

/**
 * Get all active sales reps (for filtering/dropdown)
 */
export async function getAllSalesReps() {
  try {
    const salesReps = await db.user.findMany({
      where: {
        role: "SALES_REP",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, salesReps };
  } catch (error) {
    console.error("Error fetching sales reps:", error);
    return { success: false, error: "Failed to fetch sales reps" };
  }
}
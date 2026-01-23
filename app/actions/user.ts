"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { resetRoundRobin } from "@/lib/round-robin";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

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

interface CreateSalesRepData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  isActive?: boolean;
}

/**
 * Create a new sales rep or user
 * Only accessible by ADMIN users
 */
export async function createSalesRep(data: CreateSalesRepData) {
  try {
    // Check authorization
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Unauthorized - Please log in" };
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized - Admin access required" };
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { success: false, error: "Email already exists" };
    }

    // Create user via Better Auth
    await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
      },
    });

    // Update user with role and active status
    const user = await db.user.update({
      where: { email: data.email },
      data: {
        role: data.role || "SALES_REP",
        isActive: data.isActive !== undefined ? data.isActive : true,
        emailVerified: true,
      },
    });

    // Reset round-robin when adding new sales reps
    if (user.role === "SALES_REP" && user.isActive) {
      await resetRoundRobin();
    }

    // Revalidate paths
    revalidatePath("/dashboard/admin/sales-reps");
    revalidatePath("/dashboard/admin");

    return { success: true, user };
  } catch (error: any) {
    console.error("Error creating sales rep:", error);
    return {
      success: false,
      error: error.message || "Failed to create sales rep",
    };
  }
}

interface UpdateSalesRepData {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

/**
 * Update an existing sales rep or user
 * Only accessible by ADMIN users
 */
export async function updateSalesRep(
  userId: string,
  data: UpdateSalesRepData
) {
  try {
    // Check authorization
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Unauthorized - Please log in" };
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized - Admin access required" };
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    // If email is being changed, check for uniqueness
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        return { success: false, error: "Email already exists" };
      }
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (data.password && data.password.trim() !== "") {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    // Update user
    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(hashedPassword && { password: hashedPassword }),
        ...(data.role && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    // Revalidate paths
    revalidatePath("/dashboard/admin/sales-reps");
    revalidatePath(`/dashboard/admin/sales-reps/${userId}`);
    revalidatePath("/dashboard/admin");

    return { success: true, user };
  } catch (error: any) {
    console.error("Error updating sales rep:", error);
    return {
      success: false,
      error: error.message || "Failed to update sales rep",
    };
  }
}

/**
 * Toggle sales rep active status
 * Only accessible by ADMIN users
 */
export async function toggleSalesRepStatus(
  userId: string,
  isActive: boolean
) {
  try {
    // Check authorization
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Unauthorized - Please log in" };
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized - Admin access required" };
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    // Update active status
    const user = await db.user.update({
      where: { id: userId },
      data: { isActive },
    });

    // Revalidate paths
    revalidatePath("/dashboard/admin/sales-reps");
    revalidatePath(`/dashboard/admin/sales-reps/${userId}`);

    return { success: true, user };
  } catch (error: any) {
    console.error("Error toggling sales rep status:", error);
    return {
      success: false,
      error: error.message || "Failed to toggle status",
    };
  }
}
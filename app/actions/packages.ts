"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * Get all packages for a specific product
 */
export async function getProductPackages(productId: string) {
  try {
    const packages = await db.productPackage.findMany({
      where: {
        productId,
        isActive: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    return { success: true, data: packages };
  } catch (error) {
    console.error("Error fetching product packages:", error);
    return { success: false, error: "Failed to fetch packages" };
  }
}

/**
 * Get all packages for a product (including inactive) - Admin only
 */
export async function getAllProductPackages(productId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const packages = await db.productPackage.findMany({
      where: {
        productId,
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    return { success: true, data: packages };
  } catch (error) {
    console.error("Error fetching all product packages:", error);
    return { success: false, error: "Failed to fetch packages" };
  }
}

/**
 * Create a new product package
 */
export async function createPackage({
  productId,
  name,
  description,
  quantity,
  price,
  currency = "NGN",
  displayOrder = 0,
}: {
  productId: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  currency?: import("@prisma/client").Currency;
  displayOrder?: number;
}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    // VALIDATION: Check if product has pricing for the selected currency
    const productPrice = await db.productPrice.findUnique({
      where: {
        productId_currency: {
          productId,
          currency,
        },
      },
    });

    if (!productPrice) {
      return {
        success: false,
        error: `Cannot create ${currency} package. Please add ${currency} pricing to this product first.`,
      };
    }

    // Check for duplicate package name + currency combination
    const existingPackage = await db.productPackage.findFirst({
      where: {
        productId,
        name,
        currency,
        isActive: true,
      },
    });

    if (existingPackage) {
      return {
        success: false,
        error: `A package named "${name}" already exists for ${currency}`,
      };
    }

    const package_ = await db.productPackage.create({
      data: {
        productId,
        name,
        description,
        quantity,
        price,
        currency,
        displayOrder,
      },
    });

    revalidatePath("/dashboard/admin/inventory");
    revalidatePath(`/order-form`);

    return { success: true, data: package_ };
  } catch (error) {
    console.error("Error creating package:", error);
    return { success: false, error: "Failed to create package" };
  }
}

/**
 * Update a product package
 */
export async function updatePackage({
  id,
  name,
  description,
  quantity,
  price,
  currency,
  isActive,
  displayOrder,
}: {
  id: string;
  name?: string;
  description?: string;
  quantity?: number;
  price?: number;
  currency?: import("@prisma/client").Currency;
  isActive?: boolean;
  displayOrder?: number;
}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (price !== undefined) updateData.price = price;
    if (currency !== undefined) updateData.currency = currency;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    const package_ = await db.productPackage.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/dashboard/admin/inventory");
    revalidatePath(`/order-form`);

    return { success: true, data: package_ };
  } catch (error) {
    console.error("Error updating package:", error);
    return { success: false, error: "Failed to update package" };
  }
}

/**
 * Delete a product package
 */
export async function deletePackage(id: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    await db.productPackage.delete({
      where: { id },
    });

    revalidatePath("/dashboard/admin/inventory");
    revalidatePath(`/order-form`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting package:", error);
    return { success: false, error: "Failed to delete package" };
  }
}

/**
 * Toggle package active status
 */
export async function togglePackageStatus(id: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const package_ = await db.productPackage.findUnique({
      where: { id },
    });

    if (!package_) {
      return { success: false, error: "Package not found" };
    }

    const updated = await db.productPackage.update({
      where: { id },
      data: { isActive: !package_.isActive },
    });

    revalidatePath("/dashboard/admin/inventory");
    revalidatePath(`/order-form`);

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error toggling package status:", error);
    return { success: false, error: "Failed to toggle package status" };
  }
}

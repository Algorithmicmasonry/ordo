"use server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Create a new product (Admin only)
 */
export async function createProduct(data: {
  name: string;
  description?: string;
  price: number;
  cost: number;
  sku?: string;
  openingStock: number;
  reorderPoint?: number;
  isActive?: boolean;
}) {
  try {
    // Check if SKU is provided and already exists
    if (data.sku) {
      const existingProduct = await db.product.findUnique({
        where: { sku: data.sku },
        select: { id: true, name: true, sku: true },
      });

      if (existingProduct) {
        return {
          success: false,
          error: `SKU "${data.sku}" is already in use by "${existingProduct.name}". Please use a different SKU.`,
        };
      }
    }

    // Create the product
    const product = await db.product.create({
      data: {
        ...data,
        currentStock: data.openingStock,
        reorderPoint: data.reorderPoint ?? 0,
        isActive: data.isActive ?? true,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/dashboard/admin/inventory");

    return { success: true, product };
  } catch (error: any) {
    console.error("Error creating product:", error);

    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      const target = error.meta?.target;

      if (target?.includes("sku")) {
        return {
          success: false,
          error: "This SKU is already in use. Please choose a different one.",
        };
      }

      if (target?.includes("name")) {
        return {
          success: false,
          error: "A product with this name already exists.",
        };
      }

      return {
        success: false,
        error: "A product with these details already exists.",
      };
    }

    // Handle other potential errors
    return {
      success: false,
      error: "Failed to create product. Please try again.",
    };
  }
}
/**
 * Update product (Admin only)
 */
export async function updateProduct(
  productId: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    cost?: number;
    sku?: string;
    isActive?: boolean;
  },
) {
  try {
    const product = await db.product.update({
      where: { id: productId },
      data,
    });

    revalidatePath("/admin/products");

    return { success: true, product };
  } catch (error) {
    console.error("Error updating product:", error);
    return { success: false, error: "Failed to update product" };
  }
}

/**
 * Add stock to product (Admin only)
 */
export async function addStock(productId: string, quantity: number) {
  try {
    const product = await db.product.update({
      where: { id: productId },
      data: {
        currentStock: {
          increment: quantity,
        },
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/dashboard/admin/inventory");

    return { success: true, product };
  } catch (error) {
    console.error("Error adding stock:", error);
    return { success: false, error: "Failed to add stock" };
  }
}

/**
 * Get all products
 */
export async function getAllProducts() {
  try {
    const products = await db.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, products };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

/**
 * Get active products (for order form)
 */
export async function getActiveProducts() {
  try {
    const products = await db.product.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, products };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

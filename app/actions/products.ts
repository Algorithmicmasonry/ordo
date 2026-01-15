"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

/**
 * Create a new product (Admin only)
 */
export async function createProduct(data: {
  name: string
  description?: string
  price: number
  cost: number
  sku?: string
  openingStock: number
}) {
  try {
    const product = await db.product.create({
      data: {
        ...data,
        currentStock: data.openingStock,
      },
    })

    revalidatePath("/admin/products")

    return { success: true, product }
  } catch (error) {
    console.error("Error creating product:", error)
    return { success: false, error: "Failed to create product" }
  }
}

/**
 * Update product (Admin only)
 */
export async function updateProduct(
  productId: string,
  data: {
    name?: string
    description?: string
    price?: number
    cost?: number
    sku?: string
    isActive?: boolean
  }
) {
  try {
    const product = await db.product.update({
      where: { id: productId },
      data,
    })

    revalidatePath("/admin/products")

    return { success: true, product }
  } catch (error) {
    console.error("Error updating product:", error)
    return { success: false, error: "Failed to update product" }
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
    })

    revalidatePath("/admin/products")
    revalidatePath("/admin/inventory")

    return { success: true, product }
  } catch (error) {
    console.error("Error adding stock:", error)
    return { success: false, error: "Failed to add stock" }
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
    })

    return { success: true, products }
  } catch (error) {
    console.error("Error fetching products:", error)
    return { success: false, error: "Failed to fetch products" }
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
    })

    return { success: true, products }
  } catch (error) {
    console.error("Error fetching products:", error)
    return { success: false, error: "Failed to fetch products" }
  }
}

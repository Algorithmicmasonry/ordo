"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface GetProductsCatalogParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  stockFilter?: string;
}

export async function getProductsCatalog({
  page = 1,
  limit = 12,
  search = "",
  sort = "name",
  stockFilter = "all",
}: GetProductsCatalogParams = {}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.role !== "SALES_REP") {
      return { success: false, error: "Unauthorized" };
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      isActive: true,
      isDeleted: false,
    };

    // Search filter
    if (search && search.trim() !== "") {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Stock filter
    if (stockFilter === "in-stock") {
      whereClause.currentStock = { gt: 10 };
    } else if (stockFilter === "low-stock") {
      whereClause.currentStock = { gte: 1, lte: 10 };
    } else if (stockFilter === "out-of-stock") {
      whereClause.currentStock = { lte: 0 };
    }

    // Build order by clause
    let orderBy: any = {};
    switch (sort) {
      case "name":
        orderBy = { name: "asc" };
        break;
      case "price-asc":
      case "price-desc":
        // Price sorting will be done after fetching since price is in ProductPrice table
        orderBy = { name: "asc" };
        break;
      case "stock-asc":
        orderBy = { currentStock: "asc" };
        break;
      case "stock-desc":
        orderBy = { currentStock: "desc" };
        break;
      default:
        orderBy = { name: "asc" };
    }

    // Get total count
    const totalProducts = await db.product.count({ where: whereClause });

    // Get all matching products (will sort/paginate after price lookup)
    const allProducts = await db.product.findMany({
      where: whereClause,
      orderBy,
      select: {
        id: true,
        name: true,
        description: true,
        sku: true,
        currentStock: true,
        reorderPoint: true,
        currency: true,
        productPrices: true,
      },
    });

    // Transform products to include price
    let productsWithPrice = allProducts
      .map((product) => {
        const productPrice = product.productPrices.find(
          (p) => p.currency === product.currency
        );
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          sku: product.sku,
          currentStock: product.currentStock,
          reorderPoint: product.reorderPoint,
          price: productPrice?.price || 0,
        };
      });

    // Sort by price if needed
    if (sort === "price-asc") {
      productsWithPrice.sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      productsWithPrice.sort((a, b) => b.price - a.price);
    }

    // Apply pagination after sorting
    const products = productsWithPrice.slice(skip, skip + limit);

    // Get stats
    const totalActive = await db.product.count({
      where: { isActive: true, isDeleted: false },
    });

    const lowStockCount = await db.product.count({
      where: {
        isActive: true,
        isDeleted: false,
        currentStock: { gte: 1, lte: 10 },
      },
    });

    const outOfStockCount = await db.product.count({
      where: {
        isActive: true,
        isDeleted: false,
        currentStock: { lte: 0 },
      },
    });

    return {
      success: true,
      data: {
        products,
        pagination: {
          total: totalProducts,
          page,
          limit,
          totalPages: Math.ceil(totalProducts / limit),
        },
        stats: {
          totalActive,
          lowStockCount,
          outOfStockCount,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching products catalog:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

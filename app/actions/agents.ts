"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

/**
 * Create a new agent (Admin only)
 */
export async function createAgent(data: {
  name: string
  phone: string
  location: string
  address?: string
}) {
  try {
    const agent = await db.agent.create({
      data,
    })

    revalidatePath("/admin/agents")

    return { success: true, agent }
  } catch (error) {
    console.error("Error creating agent:", error)
    return { success: false, error: "Failed to create agent" }
  }
}

/**
 * Update agent (Admin only)
 */
export async function updateAgent(
  agentId: string,
  data: {
    name?: string
    phone?: string
    location?: string
    address?: string
    isActive?: boolean
  }
) {
  try {
    const agent = await db.agent.update({
      where: { id: agentId },
      data,
    })

    revalidatePath("/admin/agents")

    return { success: true, agent }
  } catch (error) {
    console.error("Error updating agent:", error)
    return { success: false, error: "Failed to update agent" }
  }
}

/**
 * Assign stock to agent (Admin only)
 */
export async function assignStockToAgent(
  agentId: string,
  productId: string,
  quantity: number
) {
  try {
    // Check if agent stock record exists
    const existingStock = await db.agentStock.findUnique({
      where: {
        agentId_productId: {
          agentId,
          productId,
        },
      },
    })

    let agentStock

    if (existingStock) {
      agentStock = await db.agentStock.update({
        where: {
          agentId_productId: {
            agentId,
            productId,
          },
        },
        data: {
          quantity: {
            increment: quantity,
          },
        },
      })
    } else {
      agentStock = await db.agentStock.create({
        data: {
          agentId,
          productId,
          quantity,
        },
      })
    }

    // Deduct from global product stock
    await db.product.update({
      where: { id: productId },
      data: {
        currentStock: {
          decrement: quantity,
        },
      },
    })

    revalidatePath("/admin/agents")
    revalidatePath("/dashboard/admin/inventory")

    return { success: true, agentStock }
  } catch (error) {
    console.error("Error assigning stock to agent:", error)
    return { success: false, error: "Failed to assign stock to agent" }
  }
}

/**
 * Update agent stock defective/missing items
 */
export async function updateAgentStockIssues(
  agentId: string,
  productId: string,
  defective?: number,
  missing?: number
) {
  try {
    const updateData: any = {}

    if (defective !== undefined) {
      updateData.defective = defective
    }

    if (missing !== undefined) {
      updateData.missing = missing
    }

    const agentStock = await db.agentStock.update({
      where: {
        agentId_productId: {
          agentId,
          productId,
        },
      },
      data: updateData,
    })

    revalidatePath("/admin/agents")
    revalidatePath("/dashboard/admin/inventory")

    return { success: true, agentStock }
  } catch (error) {
    console.error("Error updating agent stock issues:", error)
    return { success: false, error: "Failed to update stock issues" }
  }
}

/**
 * Get all agents
 */
export async function getAllAgents() {
  try {
    const agents = await db.agent.findMany({
      include: {
        stock: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, agents }
  } catch (error) {
    console.error("Error fetching agents:", error)
    return { success: false, error: "Failed to fetch agents" }
  }
}

/**
 * Get active agents
 */
export async function getActiveAgents() {
  try {
    const agents = await db.agent.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return { success: true, agents }
  } catch (error) {
    console.error("Error fetching agents:", error)
    return { success: false, error: "Failed to fetch agents" }
  }
}

/**
 * Delete agent (Admin only)
 * Validates that agent has no active orders or stock holdings
 */
export async function deleteAgent(agentId: string) {
  try {
    // 1. Check for active orders
    const activeOrders = await db.order.count({
      where: {
        agentId,
        status: { in: ["CONFIRMED", "DISPATCHED"] },
      },
    })

    if (activeOrders > 0) {
      return {
        success: false,
        error: `Cannot delete agent with ${activeOrders} active order(s). Please reassign orders first.`,
      }
    }

    // 2. Check for stock holdings
    const stockHoldings = await db.agentStock.count({
      where: { agentId, quantity: { gt: 0 } },
    })

    if (stockHoldings > 0) {
      return {
        success: false,
        error:
          "Agent has stock holdings. Please reconcile stock before deletion.",
      }
    }

    // 3. Delete agent
    await db.agent.delete({ where: { id: agentId } })

    revalidatePath("/dashboard/admin/agents")

    return { success: true, message: "Agent deleted successfully" }
  } catch (error: any) {
    console.error("Error deleting agent:", error)
    return { success: false, error: error.message || "Failed to delete agent" }
  }
}

/**
 * Reconcile agent stock (return, defective, missing tracking)
 */
export async function reconcileAgentStock(data: {
  agentId: string
  productId: string
  returnedQuantity?: number
  defective?: number
  missing?: number
  notes?: string
}) {
  try {
    return await db.$transaction(async (tx) => {
      const agentStock = await tx.agentStock.findUnique({
        where: {
          agentId_productId: {
            agentId: data.agentId,
            productId: data.productId,
          },
        },
      })

      if (!agentStock) {
        throw new Error("Stock record not found")
      }

      // Validate quantities
      const totalReconciled =
        (data.returnedQuantity || 0) + (data.defective || 0) + (data.missing || 0)

      if (totalReconciled > agentStock.quantity) {
        throw new Error("Reconciled quantities exceed current stock")
      }

      // Update agent stock
      await tx.agentStock.update({
        where: {
          agentId_productId: {
            agentId: data.agentId,
            productId: data.productId,
          },
        },
        data: {
          quantity:
            data.returnedQuantity !== undefined
              ? { decrement: data.returnedQuantity }
              : undefined,
          defective: data.defective ?? agentStock.defective,
          missing: data.missing ?? agentStock.missing,
        },
      })

      // Return stock to warehouse
      if (data.returnedQuantity && data.returnedQuantity > 0) {
        await tx.product.update({
          where: { id: data.productId },
          data: {
            currentStock: { increment: data.returnedQuantity },
          },
        })
      }

      revalidatePath("/dashboard/admin/agents")
      revalidatePath("/dashboard/admin/inventory")

      return { success: true, message: "Stock reconciled successfully" }
    })
  } catch (error: any) {
    console.error("Error reconciling stock:", error)
    return { success: false, error: error.message || "Failed to reconcile stock" }
  }
}

/**
 * Create settlement record for agent
 */
export async function createSettlement(data: {
  agentId: string
  stockValue: number
  cashCollected: number
  cashReturned: number
  adjustments: number
  notes?: string
  settledBy: string
}) {
  try {
    const balanceDue =
      data.stockValue + data.cashCollected - data.cashReturned + data.adjustments

    const settlement = await db.settlement.create({
      data: {
        agentId: data.agentId,
        stockValue: data.stockValue,
        cashCollected: data.cashCollected,
        cashReturned: data.cashReturned,
        adjustments: data.adjustments,
        balanceDue,
        notes: data.notes,
        settledBy: data.settledBy,
      },
    })

    revalidatePath("/dashboard/admin/agents")

    return { success: true, settlement }
  } catch (error: any) {
    console.error("Error creating settlement:", error)
    return { success: false, error: error.message || "Failed to create settlement" }
  }
}

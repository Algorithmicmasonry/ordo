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

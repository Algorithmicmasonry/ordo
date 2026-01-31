import { db } from './db'
import { OrderStatus, Currency } from '@prisma/client'

/**
 * Calculate revenue from delivered orders only
 */
export async function calculateRevenue(
  startDate?: Date,
  endDate?: Date,
  salesRepId?: string,
  currency?: Currency
): Promise<number> {
  const where: any = {
    status: OrderStatus.DELIVERED,
  }

  if (startDate && endDate) {
    where.deliveredAt = {
      gte: startDate,
      lte: endDate,
    }
  }

  if (salesRepId) {
    where.assignedToId = salesRepId
  }

  if (currency) {
    where.currency = currency
  }

  const orders = await db.order.findMany({
    where,
    include: {
      items: true,
    },
  })

  return orders.reduce((total, order) => {
    const orderTotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    return total + orderTotal
  }, 0)
}

/**
 * Calculate profit: Revenue - (Cost + Expenses)
 */
export async function calculateProfit(
  startDate?: Date,
  endDate?: Date,
  productId?: string,
  currency?: Currency
): Promise<number> {
  const where: any = {
    status: OrderStatus.DELIVERED,
  }

  if (startDate && endDate) {
    where.deliveredAt = {
      gte: startDate,
      lte: endDate,
    }
  }

  if (currency) {
    where.currency = currency
  }

  // Get delivered orders
  const orders = await db.order.findMany({
    where,
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  // Calculate revenue and cost
  let revenue = 0
  let cost = 0

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (!productId || item.productId === productId) {
        revenue += item.price * item.quantity
        cost += item.cost * item.quantity
      }
    })
  })

  // Get expenses
  const expenseWhere: any = {}

  if (startDate && endDate) {
    expenseWhere.date = {
      gte: startDate,
      lte: endDate,
    }
  }

  if (productId) {
    expenseWhere.productId = productId
  }

  if (currency) {
    expenseWhere.currency = currency
  }

  const expenses = await db.expense.findMany({
    where: expenseWhere,
  })

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return revenue - cost - totalExpenses
}

/**
 * Calculate sales rep performance stats
 */
export async function calculateSalesRepStats(
  salesRepId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = {
    assignedToId: salesRepId,
  }

  if (startDate && endDate) {
    where.createdAt = {
      gte: startDate,
      lte: endDate,
    }
  }

  const orders = await db.order.findMany({
    where,
    include: {
      items: true,
    },
  })

  const totalOrders = orders.length
  const deliveredOrders = orders.filter((o) => o.status === OrderStatus.DELIVERED).length
  const cancelledOrders = orders.filter((o) => o.status === OrderStatus.CANCELLED).length
  const postponedOrders = orders.filter((o) => o.status === OrderStatus.POSTPONED).length

  const deliveredPercentage = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0
  const cancelledPercentage = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0

  // Calculate revenue from delivered orders only
  const totalRevenue = orders
    .filter((o) => o.status === OrderStatus.DELIVERED)
    .reduce((total, order) => {
      const orderTotal = order.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )
      return total + orderTotal
    }, 0)

  return {
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    postponedOrders,
    deliveredPercentage,
    cancelledPercentage,
    totalRevenue,
  }
}

/**
 * Update inventory when order is delivered
 */
export async function updateInventoryOnDelivery(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  // Deduct from global stock
  for (const item of order.items) {
    await db.product.update({
      where: { id: item.productId },
      data: {
        currentStock: {
          decrement: item.quantity,
        },
      },
    })

    // If order has an agent assigned, deduct from agent stock too
    if (order.agentId) {
      const agentStock = await db.agentStock.findUnique({
        where: {
          agentId_productId: {
            agentId: order.agentId,
            productId: item.productId,
          },
        },
      })

      if (agentStock) {
        await db.agentStock.update({
          where: {
            agentId_productId: {
              agentId: order.agentId,
              productId: item.productId,
            },
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        })
      }
    }
  }
}

/**
 * Restore inventory when reverting from delivered status
 */
export async function restoreInventoryFromDelivery(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  // Restore global stock
  for (const item of order.items) {
    await db.product.update({
      where: { id: item.productId },
      data: {
        currentStock: {
          increment: item.quantity,
        },
      },
    })

    // If order has an agent assigned, restore agent stock too
    if (order.agentId) {
      const agentStock = await db.agentStock.findUnique({
        where: {
          agentId_productId: {
            agentId: order.agentId,
            productId: item.productId,
          },
        },
      })

      if (agentStock) {
        await db.agentStock.update({
          where: {
            agentId_productId: {
              agentId: order.agentId,
              productId: item.productId,
            },
          },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        })
      }
    }
  }
}

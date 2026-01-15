"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

/**
 * Create a new expense (Admin only)
 */
export async function createExpense(data: {
  productId?: string
  type: string
  amount: number
  description?: string
  date?: Date
}) {
  try {
    const expense = await db.expense.create({
      data: {
        ...data,
        date: data.date || new Date(),
      },
    })

    revalidatePath("/admin/expenses")
    revalidatePath("/admin")

    return { success: true, expense }
  } catch (error) {
    console.error("Error creating expense:", error)
    return { success: false, error: "Failed to create expense" }
  }
}

/**
 * Update expense (Admin only)
 */
export async function updateExpense(
  expenseId: string,
  data: {
    productId?: string
    type?: string
    amount?: number
    description?: string
    date?: Date
  }
) {
  try {
    const expense = await db.expense.update({
      where: { id: expenseId },
      data,
    })

    revalidatePath("/admin/expenses")
    revalidatePath("/admin")

    return { success: true, expense }
  } catch (error) {
    console.error("Error updating expense:", error)
    return { success: false, error: "Failed to update expense" }
  }
}

/**
 * Delete expense (Admin only)
 */
export async function deleteExpense(expenseId: string) {
  try {
    await db.expense.delete({
      where: { id: expenseId },
    })

    revalidatePath("/admin/expenses")
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Error deleting expense:", error)
    return { success: false, error: "Failed to delete expense" }
  }
}

/**
 * Get all expenses
 */
export async function getAllExpenses() {
  try {
    const expenses = await db.expense.findMany({
      include: {
        product: true,
      },
      orderBy: {
        date: "desc",
      },
    })

    return { success: true, expenses }
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return { success: false, error: "Failed to fetch expenses" }
  }
}

/**
 * Get expenses by date range
 */
export async function getExpensesByDateRange(startDate: Date, endDate: Date) {
  try {
    const expenses = await db.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        product: true,
      },
      orderBy: {
        date: "desc",
      },
    })

    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    return { success: true, expenses, total }
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return { success: false, error: "Failed to fetch expenses" }
  }
}

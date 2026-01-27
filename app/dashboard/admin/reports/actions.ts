"use server";

import { db } from "@/lib/db";
import { getDateRange } from "@/lib/date-utils";
import type { TimePeriod } from "@/lib/types";

/**
 * Get financial overview data
 */
export async function getFinancialOverview(period: TimePeriod = "month") {
  try {
    const { startDate, endDate } = getDateRange(period);

    // Get previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = new Date(startDate.getTime() - 1);

    // Current period orders
    const currentOrders = await db.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    // Previous period orders
    const previousOrders = await db.order.findMany({
      where: {
        createdAt: { gte: previousStartDate, lte: previousEndDate },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    // Current period expenses
    const currentExpenses = await db.expense.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
    });

    // Previous period expenses
    const previousExpenses = await db.expense.findMany({
      where: {
        date: { gte: previousStartDate, lte: previousEndDate },
      },
    });

    // Calculate current period metrics
    const currentRevenue = currentOrders
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, order) => {
        const orderTotal = order.items.reduce(
          (itemSum, item) => itemSum + item.price * item.quantity,
          0
        );
        return sum + orderTotal;
      }, 0);

    const currentCost = currentOrders
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, order) => {
        const orderCost = order.items.reduce(
          (itemSum, item) => itemSum + item.cost * item.quantity,
          0
        );
        return sum + orderCost;
      }, 0);

    const currentTotalExpenses = currentExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    const currentNetProfit = currentRevenue - currentCost - currentTotalExpenses;
    const currentGrossMargin =
      currentRevenue > 0 ? ((currentRevenue - currentCost) / currentRevenue) * 100 : 0;
    const currentNetMargin =
      currentRevenue > 0 ? (currentNetProfit / currentRevenue) * 100 : 0;

    // Calculate previous period metrics
    const previousRevenue = previousOrders
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, order) => {
        const orderTotal = order.items.reduce(
          (itemSum, item) => itemSum + item.price * item.quantity,
          0
        );
        return sum + orderTotal;
      }, 0);

    const previousCost = previousOrders
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, order) => {
        const orderCost = order.items.reduce(
          (itemSum, item) => itemSum + item.cost * item.quantity,
          0
        );
        return sum + orderCost;
      }, 0);

    const previousTotalExpenses = previousExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    const previousNetProfit = previousRevenue - previousCost - previousTotalExpenses;
    const previousGrossMargin =
      previousRevenue > 0 ? ((previousRevenue - previousCost) / previousRevenue) * 100 : 0;
    const previousNetMargin =
      previousRevenue > 0 ? (previousNetProfit / previousRevenue) * 100 : 0;

    // Calculate percentage changes
    const netProfitChange =
      previousNetProfit !== 0
        ? ((currentNetProfit - previousNetProfit) / Math.abs(previousNetProfit)) * 100
        : 0;
    const grossMarginChange = currentGrossMargin - previousGrossMargin;
    const netMarginChange = currentNetMargin - previousNetMargin;
    const burnRateChange =
      previousTotalExpenses !== 0
        ? ((currentTotalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100
        : 0;

    // Generate monthly revenue vs expenses chart data
    const chartData = await generateMonthlyChartData(startDate, endDate);

    // Calculate expense categories
    const expensesByCategory = await getExpensesByCategory(startDate, endDate);

    // Calculate budget progress (mock data for now - you can implement actual budgets later)
    const budgetProgress = {
      marketing: {
        actual: expensesByCategory.find((e) => e.category === "AD_SPEND")?.total || 0,
        budget: 50000,
      },
      logistics: {
        actual: expensesByCategory.find((e) => e.category === "DELIVERY")?.total || 0,
        budget: 30000,
      },
    };

    return {
      success: true,
      data: {
        kpis: {
          netProfit: {
            value: currentNetProfit,
            change: netProfitChange,
          },
          grossMargin: {
            value: currentGrossMargin,
            change: grossMarginChange,
          },
          netMargin: {
            value: currentNetMargin,
            change: netMarginChange,
          },
          burnRate: {
            value: currentTotalExpenses,
            change: burnRateChange,
          },
        },
        chartData,
        expensesByCategory,
        budgetProgress,
        breakEvenProgress: currentRevenue > 0 ? (currentNetProfit / currentRevenue) * 100 : 0,
      },
    };
  } catch (error) {
    console.error("Error fetching financial overview:", error);
    return {
      success: false,
      error: "Failed to fetch financial overview",
    };
  }
}

/**
 * Generate monthly chart data for revenue vs expenses
 */
async function generateMonthlyChartData(startDate: Date, endDate: Date) {
  const months = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
        status: "DELIVERED",
      },
      include: {
        items: true,
      },
    });

    const expenses = await db.expense.findMany({
      where: {
        date: { gte: monthStart, lte: monthEnd },
      },
    });

    const revenue = orders.reduce((sum, order) => {
      const orderTotal = order.items.reduce(
        (itemSum, item) => itemSum + item.price * item.quantity,
        0
      );
      return sum + orderTotal;
    }, 0);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    months.push({
      month: monthStart.toLocaleDateString("en-US", { month: "short" }),
      revenue,
      expenses: totalExpenses,
    });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return months;
}

/**
 * Get expenses grouped by category
 */
async function getExpensesByCategory(startDate: Date, endDate: Date) {
  const expenses = await db.expense.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
  });

  const categoryTotals = expenses.reduce((acc, expense) => {
    const category = expense.category || "OTHER";
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(categoryTotals)
    .map(([category, total]) => ({
      category,
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

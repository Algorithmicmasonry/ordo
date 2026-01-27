"use server";

import { db } from "@/lib/db";
import { getDateRange } from "@/lib/date-utils";
import type { TimePeriod } from "@/lib/types";

/**
 * Get financial overview data
 */
export async function getFinancialOverview(
  period: TimePeriod = "month",
  customStartDate?: Date,
  customEndDate?: Date
) {
  try {
    // Use custom dates if provided, otherwise calculate from period
    let startDate: Date;
    let endDate: Date;

    if (customStartDate && customEndDate) {
      startDate = customStartDate;
      endDate = customEndDate;
    } else {
      const dateRange = getDateRange(period);
      startDate = dateRange.startDate;
      endDate = dateRange.endDate;
    }

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

    const currentGrossProfit = currentRevenue - currentCost;
    const currentNetProfit = currentRevenue - currentCost - currentTotalExpenses;

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

    const previousGrossProfit = previousRevenue - previousCost;
    const previousNetProfit = previousRevenue - previousCost - previousTotalExpenses;

    // Calculate percentage changes
    const revenueChange =
      previousRevenue !== 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0 ? 100 : 0;

    const grossProfitChange =
      previousGrossProfit !== 0
        ? ((currentGrossProfit - previousGrossProfit) / Math.abs(previousGrossProfit)) * 100
        : currentGrossProfit > 0 ? 100 : 0;

    const netProfitChange =
      previousNetProfit !== 0
        ? ((currentNetProfit - previousNetProfit) / Math.abs(previousNetProfit)) * 100
        : currentNetProfit > 0 ? 100 : 0;

    const burnRateChange =
      previousTotalExpenses !== 0
        ? ((currentTotalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100
        : currentTotalExpenses > 0 ? 100 : 0;

    // Generate revenue vs expenses chart data based on period
    const chartData = await generateChartDataByPeriod(startDate, endDate, period);

    // Calculate expense categories
    const expensesByCategory = await getExpensesByCategory(startDate, endDate);

    return {
      success: true,
      data: {
        kpis: {
          revenue: {
            value: currentRevenue,
            change: revenueChange,
          },
          grossProfit: {
            value: currentGrossProfit,
            change: grossProfitChange,
          },
          netProfit: {
            value: currentNetProfit,
            change: netProfitChange,
          },
          burnRate: {
            value: currentTotalExpenses,
            change: burnRateChange,
          },
        },
        chartData,
        expensesByCategory,
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
 * Generate chart data based on the selected period
 */
async function generateChartDataByPeriod(
  startDate: Date,
  endDate: Date,
  period: TimePeriod
) {
  const chartData: Array<{ label: string; revenue: number; expenses: number }> = [];

  if (period === "today") {
    // Hourly data for today
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(startDate);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(startDate);
      hourEnd.setHours(hour, 59, 59, 999);

      const orders = await db.order.findMany({
        where: {
          createdAt: { gte: hourStart, lte: hourEnd },
          status: "DELIVERED",
        },
        include: { items: true },
      });

      const expenses = await db.expense.findMany({
        where: {
          date: { gte: hourStart, lte: hourEnd },
        },
      });

      const revenue = orders.reduce((sum, order) => {
        return sum + order.items.reduce((s, item) => s + item.price * item.quantity, 0);
      }, 0);

      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      chartData.push({
        label: `${hour.toString().padStart(2, "0")}:00`,
        revenue,
        expenses: totalExpenses,
      });
    }
  } else if (period === "week") {
    // Daily data for the week
    for (let day = 0; day < 7; day++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(startDate.getDate() + day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const orders = await db.order.findMany({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
          status: "DELIVERED",
        },
        include: { items: true },
      });

      const expenses = await db.expense.findMany({
        where: {
          date: { gte: dayStart, lte: dayEnd },
        },
      });

      const revenue = orders.reduce((sum, order) => {
        return sum + order.items.reduce((s, item) => s + item.price * item.quantity, 0);
      }, 0);

      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      chartData.push({
        label: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
        revenue,
        expenses: totalExpenses,
      });
    }
  } else if (period === "month") {
    // Daily data for the month (every 3 days to avoid overcrowding)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const interval = Math.max(1, Math.floor(totalDays / 10)); // Show ~10 data points

    for (let day = 0; day < totalDays; day += interval) {
      const dayStart = new Date(startDate);
      dayStart.setDate(startDate.getDate() + day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + interval - 1);
      dayEnd.setHours(23, 59, 59, 999);

      const orders = await db.order.findMany({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
          status: "DELIVERED",
        },
        include: { items: true },
      });

      const expenses = await db.expense.findMany({
        where: {
          date: { gte: dayStart, lte: dayEnd },
        },
      });

      const revenue = orders.reduce((sum, order) => {
        return sum + order.items.reduce((s, item) => s + item.price * item.quantity, 0);
      }, 0);

      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      chartData.push({
        label: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue,
        expenses: totalExpenses,
      });
    }
  } else if (period === "year") {
    // Monthly data for the year
    const startMonth = startDate.getMonth();
    const startYear = startDate.getFullYear();
    const endMonth = endDate.getMonth();
    const endYear = endDate.getFullYear();

    let currentYear = startYear;
    let currentMonth = startMonth;

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      const monthStart = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
      const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

      const orders = await db.order.findMany({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: "DELIVERED",
        },
        include: { items: true },
      });

      const expenses = await db.expense.findMany({
        where: {
          date: { gte: monthStart, lte: monthEnd },
        },
      });

      const revenue = orders.reduce((sum, order) => {
        return sum + order.items.reduce((s, item) => s + item.price * item.quantity, 0);
      }, 0);

      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      chartData.push({
        label: monthStart.toLocaleDateString("en-US", { month: "short" }),
        revenue,
        expenses: totalExpenses,
      });

      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }
  }

  return chartData;
}

/**
 * Get expenses grouped by type
 */
async function getExpensesByCategory(startDate: Date, endDate: Date) {
  const expenses = await db.expense.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
  });

  const categoryTotals = expenses.reduce((acc, expense) => {
    const category = expense.type || "OTHER";
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

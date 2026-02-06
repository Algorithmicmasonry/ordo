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

/**
 * Get sales rep financial performance data
 */
export async function getSalesRepFinance(
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

    // Get all sales reps
    const salesReps = await db.user.findMany({
      where: {
        role: "SALES_REP",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Get performance data for each sales rep
    const repPerformance = await Promise.all(
      salesReps.map(async (rep) => {
        // Get delivered orders for this rep
        const orders = await db.order.findMany({
          where: {
            assignedToId: rep.id,
            status: "DELIVERED",
            deliveredAt: { gte: startDate, lte: endDate },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        // Calculate revenue and cost
        const revenue = orders.reduce((sum, order) => {
          return (
            sum +
            order.items.reduce(
              (itemSum, item) => itemSum + item.price * item.quantity,
              0
            )
          );
        }, 0);

        const cost = orders.reduce((sum, order) => {
          return (
            sum +
            order.items.reduce(
              (itemSum, item) => itemSum + item.cost * item.quantity,
              0
            )
          );
        }, 0);

        // Get product IDs from orders
        const productIds = [
          ...new Set(orders.flatMap((o) => o.items.map((i) => i.productId))),
        ];

        // Get expenses for products in this rep's orders
        const expenses = await db.expense.findMany({
          where: {
            productId: { in: productIds },
            date: { gte: startDate, lte: endDate },
          },
        });

        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        // Calculate metrics
        const deliveredCount = orders.length;
        const netProfit = revenue - cost - totalExpenses;
        const cpa = deliveredCount > 0 ? totalExpenses / deliveredCount : 0;
        const totalCost = cost + totalExpenses;
        const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

        return {
          repId: rep.id,
          repName: rep.name,
          repEmail: rep.email,
          revenue,
          cost,
          expenses: totalExpenses,
          deliveredCount,
          netProfit,
          cpa,
          roi,
        };
      })
    );

    // Sort by net profit (top performers first)
    repPerformance.sort((a, b) => b.netProfit - a.netProfit);

    // Calculate team metrics
    const totalRevenue = repPerformance.reduce((sum, rep) => sum + rep.revenue, 0);
    const totalCost = repPerformance.reduce((sum, rep) => sum + rep.cost, 0);
    const totalExpenses = repPerformance.reduce(
      (sum, rep) => sum + rep.expenses,
      0
    );
    const totalNetProfit = totalRevenue - totalCost - totalExpenses;
    const totalDelivered = repPerformance.reduce(
      (sum, rep) => sum + rep.deliveredCount,
      0
    );
    const teamROI =
      totalCost + totalExpenses > 0
        ? (totalNetProfit / (totalCost + totalExpenses)) * 100
        : 0;
    const avgCPA = totalDelivered > 0 ? totalExpenses / totalDelivered : 0;
    const topPerformer =
      repPerformance.length > 0 ? repPerformance[0] : null;

    return {
      success: true,
      data: {
        teamMetrics: {
          teamROI,
          avgCPA,
          topPerformer: topPerformer
            ? {
                name: topPerformer.repName,
                revenue: topPerformer.revenue,
              }
            : null,
        },
        repPerformance,
      },
    };
  } catch (error) {
    console.error("Error fetching sales rep finance data:", error);
    return {
      success: false,
      error: "Failed to fetch sales rep finance data",
    };
  }
}

/**
 * Get agent cost analysis data
 */
export async function getAgentCostAnalysis(
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

    // Get all active agents
    const agents = await db.agent.findMany({
      where: {
        isActive: true,
      },
      include: {
        stock: {
          include: {
            product: {
              include: {
                productPrices: true,
              },
            },
          },
        },
      },
    });

    // Get all delivered orders with agent assignments in the period
    const deliveredOrders = await db.order.findMany({
      where: {
        status: "DELIVERED",
        agentId: { not: null },
        deliveredAt: { gte: startDate, lte: endDate },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        agent: true,
      },
    });

    // Get delivery expenses for the period
    const deliveryExpenses = await db.expense.findMany({
      where: {
        type: "delivery",
        date: { gte: startDate, lte: endDate },
      },
    });

    const totalDeliveryExpenses = deliveryExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    // Calculate agent performance metrics
    const agentPerformance = await Promise.all(
      agents.map(async (agent) => {
        // Get orders delivered by this agent
        const agentOrders = deliveredOrders.filter(
          (order) => order.agentId === agent.id
        );

        // Get all orders assigned to this agent (for success rate)
        const allAssignedOrders = await db.order.findMany({
          where: {
            agentId: agent.id,
            createdAt: { gte: startDate, lte: endDate },
          },
        });

        const totalDeliveries = agentOrders.length;
        const totalAssigned = allAssignedOrders.length;
        const successRate =
          totalAssigned > 0 ? (totalDeliveries / totalAssigned) * 100 : 0;

        // Calculate stock value in hand using ProductPrice table
        const stockValue = agent.stock.reduce((sum, stock) => {
          const productPrice = stock.product.productPrices.find(
            (p) => p.currency === stock.product.currency
          );
          const cost = productPrice?.cost || 0;
          return sum + stock.quantity * cost;
        }, 0);

        // Calculate defective and missing stock counts and values
        const defectiveCount = agent.stock.reduce(
          (sum, stock) => sum + stock.defective,
          0
        );
        const missingCount = agent.stock.reduce(
          (sum, stock) => sum + stock.missing,
          0
        );
        const defectiveValue = agent.stock.reduce((sum, stock) => {
          const productPrice = stock.product.productPrices.find(
            (p) => p.currency === stock.product.currency
          );
          const cost = productPrice?.cost || 0;
          return sum + stock.defective * cost;
        }, 0);
        const missingValue = agent.stock.reduce((sum, stock) => {
          const productPrice = stock.product.productPrices.find(
            (p) => p.currency === stock.product.currency
          );
          const cost = productPrice?.cost || 0;
          return sum + stock.missing * cost;
        }, 0);
        const totalStockIssues = defectiveCount + missingCount;
        const totalStockIssuesValue = defectiveValue + missingValue;

        // Calculate revenue and profit from agent's deliveries
        const revenue = agentOrders.reduce((sum, order) => {
          return (
            sum +
            order.items.reduce(
              (itemSum, item) => itemSum + item.price * item.quantity,
              0
            )
          );
        }, 0);

        const cost = agentOrders.reduce((sum, order) => {
          return (
            sum +
            order.items.reduce(
              (itemSum, item) => itemSum + item.cost * item.quantity,
              0
            )
          );
        }, 0);

        // Get product IDs from orders
        const productIds = [
          ...new Set(agentOrders.flatMap((o) => o.items.map((i) => i.productId))),
        ];

        // Get expenses for products in this agent's orders
        const expenses = await db.expense.findMany({
          where: {
            productId: { in: productIds },
            date: { gte: startDate, lte: endDate },
          },
        });

        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const profitContribution = revenue - cost - totalExpenses;

        return {
          agentId: agent.id,
          agentName: agent.name,
          location: agent.location,
          totalDeliveries,
          successRate,
          stockValue,
          profitContribution,
          totalStockIssues,
          totalStockIssuesValue,
          defectiveCount,
          missingCount,
        };
      })
    );

    // Sort by total deliveries (most active first)
    agentPerformance.sort((a, b) => b.totalDeliveries - a.totalDeliveries);

    // Calculate total stock value across all agents using ProductPrice table
    const totalStockValue = agents.reduce((sum, agent) => {
      return (
        sum +
        agent.stock.reduce((stockSum, stock) => {
          const productPrice = stock.product.productPrices.find(
            (p) => p.currency === stock.product.currency
          );
          const cost = productPrice?.cost || 0;
          return stockSum + stock.quantity * cost;
        }, 0)
      );
    }, 0);

    // Calculate defective and missing stock losses using ProductPrice table
    const defectiveValue = agents.reduce((sum, agent) => {
      return (
        sum +
        agent.stock.reduce((stockSum, stock) => {
          const productPrice = stock.product.productPrices.find(
            (p) => p.currency === stock.product.currency
          );
          const cost = productPrice?.cost || 0;
          return stockSum + stock.defective * cost;
        }, 0)
      );
    }, 0);

    const missingValue = agents.reduce((sum, agent) => {
      return (
        sum +
        agent.stock.reduce((stockSum, stock) => {
          const productPrice = stock.product.productPrices.find(
            (p) => p.currency === stock.product.currency
          );
          const cost = productPrice?.cost || 0;
          return stockSum + stock.missing * cost;
        }, 0)
      );
    }, 0);

    const totalStockLoss = defectiveValue + missingValue;

    // Calculate total orders delivered by agents
    const totalOrdersDelivered = deliveredOrders.length;

    // Get previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = new Date(startDate.getTime() - 1);

    const previousDeliveryExpenses = await db.expense.findMany({
      where: {
        type: "delivery",
        date: { gte: previousStartDate, lte: previousEndDate },
      },
    });

    const previousTotalDeliveryExpenses = previousDeliveryExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    // Calculate percentage change
    const deliveryCostChange =
      previousTotalDeliveryExpenses !== 0
        ? ((totalDeliveryExpenses - previousTotalDeliveryExpenses) /
            previousTotalDeliveryExpenses) *
          100
        : totalDeliveryExpenses > 0
        ? 100
        : 0;

    return {
      success: true,
      data: {
        kpis: {
          totalDeliveryCosts: {
            value: totalDeliveryExpenses,
            change: deliveryCostChange,
          },
          totalOrdersDelivered: {
            value: totalOrdersDelivered,
          },
          totalStockValue: {
            value: totalStockValue,
            units: agents.reduce(
              (sum, agent) =>
                sum +
                agent.stock.reduce((s, stock) => s + stock.quantity, 0),
              0
            ),
          },
          stockLoss: {
            value: totalStockLoss,
            percentage:
              totalStockValue > 0 ? (totalStockLoss / totalStockValue) * 100 : 0,
            breakdown: {
              defective: defectiveValue,
              missing: missingValue,
            },
          },
        },
        agentPerformance,
      },
    };
  } catch (error) {
    console.error("Error fetching agent cost analysis:", error);
    return {
      success: false,
      error: "Failed to fetch agent cost analysis data",
    };
  }
}

/**
 * Get profit and loss statement data
 */
export async function getProfitLossStatement(
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
        status: "DELIVERED",
      },
      include: {
        items: true,
      },
    });

    // Previous period orders
    const previousOrders = await db.order.findMany({
      where: {
        createdAt: { gte: previousStartDate, lte: previousEndDate },
        status: "DELIVERED",
      },
      include: {
        items: true,
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

    // Calculate current period revenue
    const currentRevenue = currentOrders.reduce((sum, order) => {
      return (
        sum +
        order.items.reduce(
          (itemSum, item) => itemSum + item.price * item.quantity,
          0
        )
      );
    }, 0);

    // Calculate current period COGS
    const currentCOGS = currentOrders.reduce((sum, order) => {
      return (
        sum +
        order.items.reduce(
          (itemSum, item) => itemSum + item.cost * item.quantity,
          0
        )
      );
    }, 0);

    // Calculate current period expenses by type
    const currentExpensesByType = currentExpenses.reduce((acc, expense) => {
      const type = expense.type || "other";
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const currentTotalExpenses = currentExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    // Calculate previous period revenue
    const previousRevenue = previousOrders.reduce((sum, order) => {
      return (
        sum +
        order.items.reduce(
          (itemSum, item) => itemSum + item.price * item.quantity,
          0
        )
      );
    }, 0);

    // Calculate previous period COGS
    const previousCOGS = previousOrders.reduce((sum, order) => {
      return (
        sum +
        order.items.reduce(
          (itemSum, item) => itemSum + item.cost * item.quantity,
          0
        )
      );
    }, 0);

    // Calculate previous period expenses by type
    const previousExpensesByType = previousExpenses.reduce((acc, expense) => {
      const type = expense.type || "other";
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const previousTotalExpenses = previousExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    // Calculate gross profit
    const currentGrossProfit = currentRevenue - currentCOGS;
    const previousGrossProfit = previousRevenue - previousCOGS;

    // Calculate net profit
    const currentNetProfit = currentGrossProfit - currentTotalExpenses;
    const previousNetProfit = previousGrossProfit - previousTotalExpenses;

    // Calculate margins
    const grossMargin = currentRevenue > 0 ? (currentGrossProfit / currentRevenue) * 100 : 0;
    const netMargin = currentRevenue > 0 ? (currentNetProfit / currentRevenue) * 100 : 0;

    // Calculate percentage changes
    const revenueChange =
      previousRevenue !== 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0
        ? 100
        : 0;

    const cogsChange =
      previousCOGS !== 0
        ? ((currentCOGS - previousCOGS) / previousCOGS) * 100
        : currentCOGS > 0
        ? 100
        : 0;

    const grossProfitChange =
      previousGrossProfit !== 0
        ? ((currentGrossProfit - previousGrossProfit) / Math.abs(previousGrossProfit)) * 100
        : currentGrossProfit > 0
        ? 100
        : 0;

    const netProfitChange =
      previousNetProfit !== 0
        ? ((currentNetProfit - previousNetProfit) / Math.abs(previousNetProfit)) * 100
        : currentNetProfit > 0
        ? 100
        : 0;

    // Calculate expense changes by type
    const expenseTypes = ["ad_spend", "delivery", "shipping", "clearing", "other"];
    const expenseDetails = expenseTypes.map((type) => {
      const current = currentExpensesByType[type] || 0;
      const previous = previousExpensesByType[type] || 0;
      const change =
        previous !== 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

      return {
        type,
        current,
        previous,
        change,
      };
    });

    return {
      success: true,
      data: {
        revenue: {
          current: currentRevenue,
          previous: previousRevenue,
          change: revenueChange,
        },
        cogs: {
          current: currentCOGS,
          previous: previousCOGS,
          change: cogsChange,
        },
        grossProfit: {
          current: currentGrossProfit,
          previous: previousGrossProfit,
          change: grossProfitChange,
        },
        expenses: expenseDetails,
        totalExpenses: {
          current: currentTotalExpenses,
          previous: previousTotalExpenses,
          change:
            previousTotalExpenses !== 0
              ? ((currentTotalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100
              : currentTotalExpenses > 0
              ? 100
              : 0,
        },
        netProfit: {
          current: currentNetProfit,
          previous: previousNetProfit,
          change: netProfitChange,
        },
        margins: {
          gross: grossMargin,
          net: netMargin,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching profit and loss statement:", error);
    return {
      success: false,
      error: "Failed to fetch profit and loss statement",
    };
  }
}

/**
 * Get product profitability analysis
 */
export async function getProductProfitability(
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

    // Fetch all products (including soft-deleted for historical data)
    const products = await db.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        cost: true,
      },
    });

    // Fetch all delivered orders in the period with items
    const deliveredOrders = await db.order.findMany({
      where: {
        status: "DELIVERED",
        deliveredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Fetch all product expenses in the period
    const productExpenses = await db.expense.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        productId: { not: null },
      },
    });

    // Calculate profitability per product
    const productProfitability = products.map((product) => {
      // Calculate units sold
      let unitsSold = 0;
      let revenue = 0;
      let cogs = 0;

      deliveredOrders.forEach((order) => {
        order.items.forEach((item) => {
          if (item.productId === product.id) {
            unitsSold += item.quantity;
            revenue += item.price * item.quantity;
            cogs += item.cost * item.quantity;
          }
        });
      });

      // Calculate product-specific expenses by type
      const productExpensesByType = productExpenses
        .filter((exp) => exp.productId === product.id)
        .reduce((acc, exp) => {
          const type = exp.type || "other";
          acc[type] = (acc[type] || 0) + exp.amount;
          return acc;
        }, {} as Record<string, number>);

      const expenses = Object.values(productExpensesByType).reduce(
        (sum, amount) => sum + amount,
        0
      );
      const adSpend = productExpensesByType["ad_spend"] || 0;

      // Calculate net profit
      const netProfit = revenue - cogs - expenses;

      // Calculate margin percentage
      const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      // Calculate ROI
      const totalCost = cogs + expenses;
      const roi = totalCost > 0 ? netProfit / totalCost : 0;

      // Calculate ROAS (Return on Ad Spend)
      const roas = adSpend > 0 ? revenue / adSpend : 0;

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku || "N/A",
        unitsSold,
        revenue,
        cogs,
        expenses,
        adSpend,
        netProfit,
        margin,
        roi,
        roas,
        expensesByType: productExpensesByType,
      };
    });

    // Filter out products with no sales in the period
    const productsWithSales = productProfitability.filter((p) => p.unitsSold > 0);

    // Sort by revenue descending
    productsWithSales.sort((a, b) => b.revenue - a.revenue);

    // Calculate summary statistics
    const totalRevenue = productsWithSales.reduce((sum, p) => sum + p.revenue, 0);
    const totalNetProfit = productsWithSales.reduce((sum, p) => sum + p.netProfit, 0);
    const totalAdSpend = productsWithSales.reduce((sum, p) => sum + p.adSpend, 0);
    const averageMargin =
      productsWithSales.length > 0
        ? productsWithSales.reduce((sum, p) => sum + p.margin, 0) / productsWithSales.length
        : 0;
    const overallRoas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;

    // Find top performer (highest margin with positive profit)
    const topPerformer = productsWithSales
      .filter((p) => p.netProfit > 0)
      .sort((a, b) => b.margin - a.margin)[0] || null;

    // Find products at a loss
    const productsAtLoss = productsWithSales
      .filter((p) => p.netProfit < 0)
      .sort((a, b) => a.netProfit - b.netProfit);

    return {
      success: true,
      data: {
        products: productsWithSales,
        summary: {
          totalRevenue,
          totalNetProfit,
          totalAdSpend,
          averageMargin,
          overallRoas,
          totalProducts: productsWithSales.length,
        },
        insights: {
          topPerformer: topPerformer
            ? {
                name: topPerformer.productName,
                margin: topPerformer.margin,
                netProfit: topPerformer.netProfit,
                revenue: topPerformer.revenue,
              }
            : null,
          worstPerformer:
            productsAtLoss.length > 0
              ? {
                  name: productsAtLoss[0].productName,
                  margin: productsAtLoss[0].margin,
                  netProfit: productsAtLoss[0].netProfit,
                  revenue: productsAtLoss[0].revenue,
                  cogs: productsAtLoss[0].cogs,
                  expenses: productsAtLoss[0].expenses,
                }
              : null,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching product profitability:", error);
    return {
      success: false,
      error: "Failed to fetch product profitability data",
    };
  }
}

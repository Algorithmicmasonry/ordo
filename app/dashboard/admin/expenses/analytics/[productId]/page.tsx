import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import ProductAnalyticsClient from "./_components/product-analytics-client";

export async function generateMetadata({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { name: true },
  });

  if (!product) {
    return {
      title: "Product Not Found | Ordo CRM",
    };
  }

  return {
    title: `${product.name} - Expense Analytics | Ordo CRM`,
    description: `Detailed expense and profit analysis for ${product.name}`,
  };
}

async function getProductAnalytics(productId: string) {
  // Verify product exists
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      cost: true,
    },
  });

  if (!product) {
    return null;
  }

  // Get date 6 months ago
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Fetch all delivered orders containing this product
  const orderItems = await db.orderItem.findMany({
    where: {
      productId: productId,
      order: {
        status: OrderStatus.DELIVERED,
        deliveredAt: {
          gte: sixMonthsAgo,
        },
      },
    },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          deliveredAt: true,
          createdAt: true,
        },
      },
    },
  });

  // Fetch all expenses for this product
  const expenses = await db.expense.findMany({
    where: {
      productId: productId,
      date: {
        gte: sixMonthsAgo,
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Calculate revenue and COGS from order items
  let totalRevenue = 0;
  let totalCOGS = 0;
  let totalUnitsSold = 0;

  orderItems.forEach((item) => {
    totalRevenue += item.price * item.quantity;
    totalCOGS += item.cost * item.quantity;
    totalUnitsSold += item.quantity;
  });

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Calculate net profit
  const netProfit = totalRevenue - totalCOGS - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Group expenses by type
  const expensesByType = expenses.reduce(
    (acc, expense) => {
      acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  // Monthly breakdown (last 6 months)
  const monthlyData = new Map<
    string,
    {
      month: string;
      revenue: number;
      cogs: number;
      expenses: number;
      profit: number;
      unitsSold: number;
    }
  >();

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("en-US", { month: "short" });

    monthlyData.set(monthKey, {
      month: monthLabel,
      revenue: 0,
      cogs: 0,
      expenses: 0,
      profit: 0,
      unitsSold: 0,
    });
  }

  // Populate monthly revenue and COGS
  orderItems.forEach((item) => {
    if (item.order.deliveredAt) {
      const deliveryDate = new Date(item.order.deliveredAt);
      const monthKey = `${deliveryDate.getFullYear()}-${String(deliveryDate.getMonth() + 1).padStart(2, "0")}`;
      const data = monthlyData.get(monthKey);

      if (data) {
        data.revenue += item.price * item.quantity;
        data.cogs += item.cost * item.quantity;
        data.unitsSold += item.quantity;
      }
    }
  });

  // Populate monthly expenses
  expenses.forEach((expense) => {
    const expenseDate = new Date(expense.date);
    const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, "0")}`;
    const data = monthlyData.get(monthKey);

    if (data) {
      data.expenses += expense.amount;
    }
  });

  // Calculate monthly profit
  monthlyData.forEach((data) => {
    data.profit = data.revenue - data.cogs - data.expenses;
  });

  const monthlyBreakdown = Array.from(monthlyData.values());

  // Calculate max values for chart scaling
  const allMonthlyValues = monthlyBreakdown.flatMap((m) => [
    m.revenue,
    m.cogs,
    m.expenses,
    m.profit,
  ]);
  const maxMonthlyValue = Math.max(...allMonthlyValues, 1);

  // Expense breakdown for recent expenses table
  const recentExpenses = expenses.slice(0, 10);

  return {
    product,
    stats: {
      totalRevenue,
      totalCOGS,
      totalExpenses,
      netProfit,
      profitMargin,
      totalUnitsSold,
      averageRevenuePerUnit: totalUnitsSold > 0 ? totalRevenue / totalUnitsSold : 0,
      averageCostPerUnit: totalUnitsSold > 0 ? totalCOGS / totalUnitsSold : 0,
    },
    expensesByType,
    monthlyBreakdown,
    maxMonthlyValue,
    recentExpenses,
    totalExpenseCount: expenses.length,
  };
}

export default async function ProductAnalyticsPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((m) => m.headers()),
  });

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const { productId } = await params;
  const data = await getProductAnalytics(productId);

  if (!data) {
    notFound();
  }

  return <ProductAnalyticsClient {...data} />;
}

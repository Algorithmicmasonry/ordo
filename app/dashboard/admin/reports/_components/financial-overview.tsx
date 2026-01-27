"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PeriodFilter } from "@/app/dashboard/admin/_components/period-filter";
import type { TimePeriod } from "@/lib/types";
import {
  TrendingUp,
  TrendingDown,
  Download,
  BarChart3,
  Target,
  DollarSign,
  FileText,
  Table,
  Building,
  Receipt,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface FinancialOverviewProps {
  data: {
    kpis: {
      netProfit: { value: number; change: number };
      grossMargin: { value: number; change: number };
      netMargin: { value: number; change: number };
      burnRate: { value: number; change: number };
    };
    chartData: Array<{
      month: string;
      revenue: number;
      expenses: number;
    }>;
    expensesByCategory: Array<{
      category: string;
      total: number;
    }>;
    budgetProgress: {
      marketing: { actual: number; budget: number };
      logistics: { actual: number; budget: number };
    };
    breakEvenProgress: number;
  };
  period: TimePeriod;
}

const EXPENSE_COLORS = {
  AD_SPEND: "#137fec",
  DELIVERY: "#38bdf8",
  SHIPPING: "#94a3b8",
  CLEARING: "#cbd5e1",
  OTHER: "#e2e8f0",
};

const EXPENSE_LABELS = {
  AD_SPEND: "Marketing",
  DELIVERY: "Delivery",
  SHIPPING: "Shipping",
  CLEARING: "Clearing",
  OTHER: "Other",
};

export function FinancialOverview({ data, period }: FinancialOverviewProps) {
  const { kpis, chartData, expensesByCategory, budgetProgress, breakEvenProgress } = data;

  // Prepare donut chart data
  const donutData = expensesByCategory.slice(0, 5).map((item) => ({
    name: EXPENSE_LABELS[item.category as keyof typeof EXPENSE_LABELS] || item.category,
    value: item.total,
    color: EXPENSE_COLORS[item.category as keyof typeof EXPENSE_COLORS] || EXPENSE_COLORS.OTHER,
  }));

  const totalExpenses = donutData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      {/* Period Filter and Export Button */}
      <div className="flex items-center justify-between">
        <PeriodFilter currentPeriod={period} />
        <Button size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
              {kpis.netProfit.change >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className="text-3xl font-bold tracking-tight mb-2">
              ₦{kpis.netProfit.value.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              <span
                className={`text-sm font-semibold ${
                  kpis.netProfit.change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {kpis.netProfit.change >= 0 ? "+" : ""}
                {kpis.netProfit.change.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-muted-foreground">Gross Margin %</p>
              {kpis.grossMargin.change >= 0 ? (
                <BarChart3 className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className="text-3xl font-bold tracking-tight mb-2">
              {kpis.grossMargin.value.toFixed(1)}%
            </p>
            <div className="flex items-center gap-1">
              <span
                className={`text-sm font-semibold ${
                  kpis.grossMargin.change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {kpis.grossMargin.change >= 0 ? "+" : ""}
                {kpis.grossMargin.change.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">vs average</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-muted-foreground">Net Profit Margin %</p>
              {kpis.netMargin.change >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className="text-3xl font-bold tracking-tight mb-2">
              {kpis.netMargin.value.toFixed(1)}%
            </p>
            <div className="flex items-center gap-1">
              <span
                className={`text-sm font-semibold ${
                  kpis.netMargin.change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {kpis.netMargin.change >= 0 ? "+" : ""}
                {kpis.netMargin.change.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-muted-foreground">Burn Rate</p>
              <DollarSign className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold tracking-tight mb-2">
              ₦{kpis.burnRate.value.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              <span
                className={`text-sm font-semibold ${
                  kpis.burnRate.change >= 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {kpis.burnRate.change >= 0 ? "+" : ""}
                {kpis.burnRate.change.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">Monthly spend</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section: Main Chart and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue vs. Expenses</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Monthly tracking across fiscal year
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary"></span>
                  <span className="text-xs font-medium text-muted-foreground">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                  <span className="text-xs font-medium text-muted-foreground">Expenses</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#137fec" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#137fec" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7edf3" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e7edf3",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `₦${value.toLocaleString()}`}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#137fec"
                  strokeWidth={3}
                  fill="url(#colorRevenue)"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right Sidebar: Break-even & Budget */}
        <div className="flex flex-col gap-4">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Break-even Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      fill="none"
                      stroke="#e7edf3"
                      strokeWidth="10"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      fill="none"
                      stroke="#137fec"
                      strokeWidth="10"
                      strokeDasharray={`${(breakEvenProgress / 100) * 364} 364`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-2xl font-bold">{breakEvenProgress.toFixed(0)}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Goal
                    </p>
                  </div>
                </div>
                <p className="text-center text-sm font-medium text-muted-foreground">
                  Next target:{" "}
                  <span className="text-foreground font-bold">₦250,000</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Budget vs Actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Marketing</span>
                  <span className="font-bold">
                    {((budgetProgress.marketing.actual / budgetProgress.marketing.budget) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((budgetProgress.marketing.actual / budgetProgress.marketing.budget) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ₦{budgetProgress.marketing.actual.toLocaleString()} of ₦
                  {budgetProgress.marketing.budget.toLocaleString()}
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Logistics</span>
                  <span className="font-bold">
                    {((budgetProgress.logistics.actual / budgetProgress.logistics.budget) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((budgetProgress.logistics.actual / budgetProgress.logistics.budget) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ₦{budgetProgress.logistics.actual.toLocaleString()} of ₦
                  {budgetProgress.logistics.budget.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section: Donut Chart & Quick Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="relative w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="text-lg font-bold">
                    ₦{(totalExpenses / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 flex-1 ml-10">
                {donutData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold">
                      ₦{(item.value / 1000).toFixed(1)}k
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Reports Export */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">P&L Statement</p>
                    <p className="text-xs text-muted-foreground">Monthly PDF</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-muted-foreground" />
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                    <Table className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Sales Tax Data</p>
                    <p className="text-xs text-muted-foreground">CSV Spreadsheet</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-muted-foreground" />
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <Building className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Balance Sheet</p>
                    <p className="text-xs text-muted-foreground">Quarterly PDF</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-muted-foreground" />
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Agent Comms</p>
                    <p className="text-xs text-muted-foreground">Batch Export</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { TimePeriod } from "@/lib/types";

type Stats = {
  totalHandled: number;
  deliveryRate: number;
  revenue: number;
  ordersChange: number;
  deliveryRateChange: number;
  revenueChange: number;
};

interface OrdersStatsProps {
  stats: Stats;
  period?: TimePeriod;
}

const periodLabels = {
  today: "today",
  week: "this week",
  month: "this month",
  year: "this year",
};

export function OrdersStats({ stats, period = "month" }: OrdersStatsProps) {
  const statsData = [
    {
      label: `Total Handled (${periodLabels[period]})`,
      value: stats.totalHandled.toLocaleString(),
      change: `${stats.ordersChange > 0 ? "+" : ""}${stats.ordersChange}%`,
      trend: stats.ordersChange >= 0 ? ("up" as const) : ("down" as const),
    },
    {
      label: "Delivery Rate",
      value: `${stats.deliveryRate}%`,
      change: `${stats.deliveryRateChange > 0 ? "+" : ""}${stats.deliveryRateChange}%`,
      trend:
        stats.deliveryRateChange >= 0 ? ("up" as const) : ("down" as const),
    },
    {
      label: "Revenue Generated",
      value: `₦ ${stats.revenue.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${stats.revenueChange > 0 ? "+" : ""}${stats.revenueChange}%`,
      trend: stats.revenueChange >= 0 ? ("up" as const) : ("down" as const),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statsData.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {stat.label}
            </p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
              <div
                className={`flex items-center gap-1 text-sm font-bold ${
                  stat.trend === "up" ? "text-green-500" : "text-red-500"
                }`}
              >
                {stat.trend === "up" ? (
                  <TrendingUp className="size-4" />
                ) : (
                  <TrendingDown className="size-4" />
                )}
                {stat.change}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

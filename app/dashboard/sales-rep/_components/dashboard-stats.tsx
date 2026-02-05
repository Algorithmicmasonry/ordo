import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimePeriod } from "@/lib/types";

interface DashboardStatsProps {
  stats: {
    totalOrders: number;
    percentageChange: number;
    pendingOrders: number;
    confirmedOrders: number;
    deliveredThisPeriod: number;
    conversionRate: number;
  };
  period: TimePeriod;
}

export function DashboardStats({ stats, period }: DashboardStatsProps) {
  // Get period label for delivered stat
  const periodLabels: Record<TimePeriod, string> = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    year: "This Year",
  };
  const deliveredLabel = `Delivered ${periodLabels[period]}`;
  const isPositiveChange = stats.percentageChange >= 0;
  const confirmedPercentage =
    stats.totalOrders > 0
      ? Math.round((stats.confirmedOrders / stats.totalOrders) * 100)
      : 0;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total Orders */}
      <Card className="shadow-sm">
        <CardContent className="p-6 flex flex-col gap-1">
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
            Total Orders
          </p>
          <p className="text-3xl font-bold tracking-tight">
            {stats.totalOrders.toLocaleString()}
          </p>
          <span
            className={cn(
              "text-xs font-medium flex items-center gap-1 mt-1",
              isPositiveChange ? "text-green-600" : "text-red-600"
            )}
          >
            {isPositiveChange ? (
              <TrendingUp className="size-4" />
            ) : (
              <TrendingDown className="size-4" />
            )}
            {isPositiveChange ? "+" : ""}
            {stats.percentageChange.toFixed(1)}% vs last month
          </span>
        </CardContent>
      </Card>

      {/* Pending (New) */}
      <Card className="shadow-sm ring-2 ring-amber-500/20">
        <CardContent className="p-6 flex flex-col gap-1">
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
            Pending (New)
          </p>
          <p className="text-3xl font-bold tracking-tight">
            {stats.pendingOrders}
          </p>
          <span className="text-xs text-amber-600 font-medium mt-1">
            Needs attention
          </span>
        </CardContent>
      </Card>

      {/* Confirmed */}
      <Card className="shadow-sm">
        <CardContent className="p-6 flex flex-col gap-1">
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
            Confirmed
          </p>
          <p className="text-3xl font-bold tracking-tight">
            {stats.confirmedOrders}
          </p>
          <span className="text-xs text-muted-foreground mt-1">
            {confirmedPercentage}% of total
          </span>
        </CardContent>
      </Card>

      {/* Delivered This Period */}
      <Card className="shadow-sm">
        <CardContent className="p-6 flex flex-col gap-1">
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
            {deliveredLabel}
          </p>
          <p className="text-3xl font-bold tracking-tight">
            {stats.deliveredThisPeriod}
          </p>
          <span className="text-xs text-blue-600 font-medium mt-1">
            On target
          </span>
        </CardContent>
      </Card>

      {/* Conversion Rate */}
      <Card className="shadow-sm bg-primary/5">
        <CardContent className="p-6 flex flex-col gap-1">
          <p className="text-primary text-sm font-bold uppercase tracking-wider">
            Conversion Rate
          </p>
          <p className="text-primary text-3xl font-bold tracking-tight">
            {stats.conversionRate.toFixed(1)}%
          </p>
          <span className="text-xs text-primary font-medium mt-1">
            {stats.conversionRate >= 60 ? "Top performer" : "Keep going"}
          </span>
        </CardContent>
      </Card>
    </section>
  );
}

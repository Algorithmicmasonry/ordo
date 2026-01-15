import { Card, CardContent } from "@/components/ui/card";
import { Wallet, DollarSign, ShoppingBag, TrendingUp } from "lucide-react";

const stats = [
  {
    name: "Total Revenue",
    value: "$128,430.00",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: Wallet,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    previousValue: "vs. $114,160.00 last period",
  },
  {
    name: "Net Profit",
    value: "$43,210.50",
    change: "+8.2%",
    changeType: "positive" as const,
    icon: DollarSign,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    previousValue: "After tax & expenses",
  },
  {
    name: "Orders Today",
    value: "156",
    change: "+15.0%",
    changeType: "positive" as const,
    icon: ShoppingBag,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    previousValue: "Currently processing: 12",
  },
  {
    name: "Fulfillment",
    value: "94%",
    change: "6% Cancelled",
    changeType: "neutral" as const,
    icon: TrendingUp,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    previousValue: "Delivered rate",
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.name}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span
                className={`p-2 ${stat.iconBg} ${stat.iconColor} rounded-lg`}
              >
                <stat.icon className="size-5" />
              </span>
              {stat.changeType !== "neutral" && (
                <span className="text-xs font-bold text-green-500 flex items-center bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                  <TrendingUp className="size-3 mr-1" /> {stat.change}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {stat.name}
            </p>
            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
            <p className="text-[10px] text-muted-foreground mt-2">
              {stat.previousValue}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

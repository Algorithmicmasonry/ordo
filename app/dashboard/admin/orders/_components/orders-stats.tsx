import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

const stats = [
  {
    label: "Total Handled",
    value: "1,240",
    change: "+12%",
    trend: "up" as const,
  },
  {
    label: "Delivery Rate",
    value: "88.5%",
    change: "+2.5%",
    trend: "up" as const,
  },
  {
    label: "Revenue Generated",
    value: "$12,450.00",
    change: "-5%",
    trend: "down" as const,
  },
];

export function OrdersStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
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
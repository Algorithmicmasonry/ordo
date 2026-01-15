"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface RevenueChartProps {
  className?: string;
}

// Sample data - replace with real data later
const chartData = [
  { day: "Mon", current: 18600, previous: 13000 },
  { day: "Tue", current: 30500, previous: 28000 },
  { day: "Wed", current: 23700, previous: 21000 },
  { day: "Thu", current: 7300, previous: 19000 },
  { day: "Fri", current: 20900, previous: 12000 },
  { day: "Sat", current: 21400, previous: 14000 },
  { day: "Sun", current: 28500, previous: 22000 },
];

const chartConfig = {
  current: {
    label: "Current Week",
    color: "var(--chart-1)",
  },
  previous: {
    label: "Previous Week",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function RevenueChart({ className }: RevenueChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Revenue Performance</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-primary"></div>
              <span className="text-xs text-muted-foreground">Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-muted"></div>
              <span className="text-xs text-muted-foreground">Previous</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
              className="text-xs"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="previous"
              type="natural"
              fill="var(--color-current)"
              fillOpacity={0.2}
              stroke="var(--color-current)"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="current"
              type="natural"
              fill="var(--color-previous)"
              fillOpacity={0.3}
              stroke="var(--color-previous)"
              strokeWidth={2}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

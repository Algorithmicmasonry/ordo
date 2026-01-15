import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RevenueChartProps {
  className?: string;
}

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
        <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
          {/* TODO: Integrate a charting library like recharts */}
          Chart placeholder - Install recharts for actual charts
        </div>
        <div className="flex justify-between mt-4">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <p key={day} className="text-muted-foreground text-xs font-bold">{day}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
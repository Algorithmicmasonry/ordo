import { Card, CardContent } from "@/components/ui/card";
import { Users, Circle, Package, Truck, AlertTriangle, XCircle } from "lucide-react";

interface AgentStatsProps {
  totalAgents: number;
  activeAgents: number;
  totalStockValue: number;
  totalDefectiveValue: number;
  totalMissingValue: number;
  pendingDeliveries: number;
}

export function AgentsStats({
  totalAgents,
  activeAgents,
  totalStockValue,
  totalDefectiveValue,
  totalMissingValue,
  pendingDeliveries,
}: AgentStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Total Agents
            </p>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold">{totalAgents}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Active on Duty
            </p>
            <Circle className="w-5 h-5 text-green-500 fill-green-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold">{activeAgents}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Stock with Agents
            </p>
            <Package className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold">
              ₦
              {totalStockValue.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Pending Deliveries
            </p>
            <Truck className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold">{pendingDeliveries}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Defective Stock Value
            </p>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-red-600">
              ₦
              {totalDefectiveValue.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Missing Stock Value
            </p>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-amber-600">
              ₦
              {totalMissingValue.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

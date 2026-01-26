import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@prisma/client";
import { FileText } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  createdAt: Date;
  items: any[];
}

interface AgentOrdersTableProps {
  orders: Order[];
}

function getStatusBadge(status: OrderStatus) {
  const statusConfig = {
    NEW: {
      label: "New",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    CONFIRMED: {
      label: "Confirmed",
      className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
    DISPATCHED: {
      label: "Dispatched",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    DELIVERED: {
      label: "Delivered",
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    POSTPONED: {
      label: "Postponed",
      className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}

export function AgentOrdersTable({ orders }: AgentOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No orders found for this period
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders ({orders.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const totalAmount = order.items.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
              );

              return (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    #{order.orderNumber}
                  </TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    ₦{totalAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {orders.length === 10 && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Showing 10 most recent orders
          </p>
        )}
      </CardContent>
    </Card>
  );
}

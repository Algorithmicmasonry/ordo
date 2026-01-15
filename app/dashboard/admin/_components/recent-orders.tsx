import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const orders = [
  {
    id: "#ORD-23490",
    customer: "Sarah Jenkins",
    date: "Oct 24, 2023",
    amount: "$240.00",
    status: "delivered" as const,
  },
  {
    id: "#ORD-23491",
    customer: "Marcus Wright",
    date: "Oct 24, 2023",
    amount: "$1,205.50",
    status: "processing" as const,
  },
  {
    id: "#ORD-23492",
    customer: "Elena Fisher",
    date: "Oct 23, 2023",
    amount: "$89.00",
    status: "shipped" as const,
  },
];

const statusStyles = {
  delivered: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  processing: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  shipped: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
};

export function RecentOrders() {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold">Recent Transactions</h3>
          <Link href="/dashboard/admin/orders" className="text-primary text-xs font-bold hover:underline">
            View All Orders
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground font-medium">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 font-semibold">{order.id}</td>
                  <td className="px-6 py-4">{order.customer}</td>
                  <td className="px-6 py-4 text-muted-foreground">{order.date}</td>
                  <td className="px-6 py-4 font-bold">{order.amount}</td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className={statusStyles[order.status]}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="icon">
                      <Eye className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
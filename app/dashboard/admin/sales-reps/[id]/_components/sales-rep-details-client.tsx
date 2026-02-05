"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  Edit,
  Mail,
  Calendar,
  PieChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import type { User, Order, OrderStatus, OrderSource } from "@prisma/client";
import { PeriodFilter } from "../../../_components";
import { TimePeriod } from "@/lib/types";
import { EditSalesRepModal } from "../../_components";
import toast from "react-hot-toast";
import { getCurrencySymbol } from "@/lib/currency";

type SalesRepWithDetails = User & {
  orders: (Order & {
    _count?: {
      items: number;
    };
  })[];
  stats: {
    totalOrders: number;
    deliveredOrders: number;
    revenue: number;
    profit: number;
    conversionRate: number;
    ordersByStatus: {
      [key in OrderStatus]: number;
    };
    ordersBySource: {
      [key in OrderSource]: number;
    };
    trends: {
      orders: number;
      delivered: number;
      revenue: number;
      profit: number;
      conversion: number;
    };
  };
};

interface SalesRepDetailsProps {
  salesRep: SalesRepWithDetails;
  currentPeriod: TimePeriod;
}

const statusColors = {
  NEW: "bg-primary/10 text-primary border-primary/20",
  CONFIRMED: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  DISPATCHED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  DELIVERED: "bg-green-500/10 text-green-500 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-500 border-red-500/20",
  POSTPONED: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

const sourceNames = {
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  WHATSAPP: "WhatsApp",
  WEBSITE: "Website",
};

export default function SalesRepDetailsClient({
  salesRep,
  currentPeriod,
}: SalesRepDetailsProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);

  const recentOrders = salesRep.orders.slice(0, 10);

  // Calculate percentages for donut chart
  const totalOrders = salesRep.stats.totalOrders;
  const statusPercentages = Object.entries(salesRep.stats.ordersByStatus).map(
    ([status, count]) => ({
      status,
      count,
      percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0,
    }),
  );

  // Calculate max for source chart
  const maxSourceOrders = Math.max(
    ...Object.values(salesRep.stats.ordersBySource),
  );

  const handleExportReport = () => {
    toast("Export feature coming soon!", {
      icon: "ℹ️",
    });
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/dashboard/admin/sales-reps"
            className="text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            <ArrowLeft className="size-4" />
            Sales Reps
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">{salesRep.name} Performance</span>
        </div>
        <PeriodFilter currentPeriod={currentPeriod} />
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex gap-6 items-center">
              <Avatar className="size-24 border-2 border-primary/20">
                <AvatarImage src={salesRep.image || ""} alt={salesRep.name} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {salesRep.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{salesRep.name}</h1>
                  <Badge
                    variant={salesRep.isActive ? "default" : "destructive"}
                    className={
                      salesRep.isActive
                        ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30"
                        : ""
                    }
                  >
                    {salesRep.isActive ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </div>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="size-4" />
                  {salesRep.email}
                </p>
                <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                  <Calendar className="size-4" />
                  Joined {format(new Date(salesRep.createdAt), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                className="flex-1 md:flex-none"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit className="size-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                className="flex-1 md:flex-none"
                onClick={handleExportReport}
              >
                <Download className="size-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Total Orders
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                {salesRep.stats.totalOrders.toLocaleString()}
              </p>
              {salesRep.stats.trends.orders > 0 ? (
                <p className="text-green-500 text-sm font-medium flex items-center">
                  <TrendingUp className="size-3" />+
                  {salesRep.stats.trends.orders}%
                </p>
              ) : (
                <p className="text-red-500 text-sm font-medium flex items-center">
                  <TrendingDown className="size-3" />
                  {salesRep.stats.trends.orders}%
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Delivered
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                {salesRep.stats.deliveredOrders.toLocaleString()}
              </p>
              {salesRep.stats.trends.delivered > 0 ? (
                <p className="text-green-500 text-sm font-medium flex items-center">
                  <TrendingUp className="size-3" />+
                  {salesRep.stats.trends.delivered}%
                </p>
              ) : (
                <p className="text-red-500 text-sm font-medium flex items-center">
                  <TrendingDown className="size-3" />
                  {salesRep.stats.trends.delivered}%
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Revenue
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                Mixed Currency
              </p>
              {salesRep.stats.trends.revenue > 0 ? (
                <p className="text-green-500 text-sm font-medium flex items-center">
                  <TrendingUp className="size-3" />+
                  {salesRep.stats.trends.revenue}%
                </p>
              ) : (
                <p className="text-red-500 text-sm font-medium flex items-center">
                  <TrendingDown className="size-3" />
                  {salesRep.stats.trends.revenue}%
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Gross Profit
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                Mixed Currency
              </p>
              {salesRep.stats.trends.profit > 0 ? (
                <p className="text-green-500 text-sm font-medium flex items-center">
                  <TrendingUp className="size-3" />+
                  {salesRep.stats.trends.profit}%
                </p>
              ) : (
                <p className="text-red-500 text-sm font-medium flex items-center">
                  <TrendingDown className="size-3" />
                  {salesRep.stats.trends.profit}%
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              Conversion Rate
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-primary">
                {salesRep.stats.conversionRate}%
              </p>
              {salesRep.stats.trends.conversion >= 0 ? (
                <p className="text-green-500 text-sm font-medium flex items-center">
                  <TrendingUp className="size-3" />+
                  {salesRep.stats.trends.conversion}%
                </p>
              ) : (
                <p className="text-red-500 text-sm font-medium flex items-center">
                  <TrendingDown className="size-3" />
                  {salesRep.stats.trends.conversion}%
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="size-5 text-primary" />
              Orders by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusPercentages.map(({ status, count, percentage }) => (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{status}</span>
                    <span className="font-semibold">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Orders by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" />
              Orders by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {Object.entries(salesRep.stats.ordersBySource).map(
                ([source, count]) => {
                  const percentage =
                    maxSourceOrders > 0 ? (count / maxSourceOrders) * 100 : 0;
                  return (
                    <div key={source} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                        <span>{sourceNames[source as OrderSource]}</span>
                        <span>{count} orders</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="link" className="text-primary" asChild>
              <Link href={`/dashboard/admin/orders?salesRep=${salesRep.id}`}>
                View All Orders
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-bold">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(order.createdAt), "MMM dd, HH:mm")}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {getCurrencySymbol(order.currency)}{order.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {sourceNames[order.source]}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColors[order.status]}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <EditSalesRepModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        salesRep={salesRep}
      />
    </div>
  );
}

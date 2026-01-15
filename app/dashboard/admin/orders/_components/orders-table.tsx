"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Eye, Filter, Calendar } from "lucide-react";
import { OrdersTableFilters } from "./orders-table-filters";

// Sample data - replace with real data from database later
const orders = [
  {
    id: "#ORD-9902",
    customer: "Amara Okafor",
    source: "TIKTOK" as const,
    status: "NEW" as const,
    location: "Lagos, NG",
    phone: "+234",
  },
  {
    id: "#ORD-9899",
    customer: "David Chen",
    source: "FACEBOOK" as const,
    status: "CONFIRMED" as const,
    location: "Singapore",
    phone: "+65",
  },
  {
    id: "#ORD-9895",
    customer: "Sarah Jenkins",
    source: "TIKTOK" as const,
    status: "DISPATCHED" as const,
    location: "London, UK",
    phone: "+44",
  },
  {
    id: "#ORD-9892",
    customer: "Marco Rossi",
    source: "FACEBOOK" as const,
    status: "CANCELLED" as const,
    location: "Rome, IT",
    phone: "+39",
  },
];

const statusStyles = {
  NEW: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  CONFIRMED: "bg-green-500/20 text-green-500 border-green-500/30",
  DISPATCHED: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  DELIVERED: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
  CANCELLED: "bg-red-500/20 text-red-500 border-red-500/30",
  POSTPONED: "bg-orange-500/20 text-orange-500 border-orange-500/30",
};

const sourceIcons = {
  FACEBOOK: "📘",
  TIKTOK: "🎵",
  WHATSAPP: "💬",
  WEBSITE: "🌐",
};

export function OrdersTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalOrders = 1240;
  const ordersPerPage = 10;

  return (
    <Card>
      <CardContent className="p-0">
        {/* Filters */}
        <div className="p-4 border-b flex items-center justify-between">
          <OrdersTableFilters />
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Filter className="size-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Calendar className="size-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead className="text-center">Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-bold text-primary">
                    {order.id}
                  </TableCell>
                  <TableCell className="font-medium">{order.customer}</TableCell>
                  <TableCell className="text-center">
                    <span className="text-2xl" title={order.source}>
                      {sourceIcons[order.source]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusStyles[order.status]}
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.location}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border-green-500/30"
                      >
                        <MessageSquare className="size-4" />
                      </Button>
                      <Button size="sm">
                        <Eye className="size-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/50">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">1</span> to{" "}
            <span className="font-medium text-foreground">{ordersPerPage}</span>{" "}
            of <span className="font-medium text-foreground">{totalOrders}</span>{" "}
            orders
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
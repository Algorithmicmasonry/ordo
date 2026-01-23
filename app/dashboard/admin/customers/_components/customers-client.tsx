"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  UserCheck,
  Repeat,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Phone,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { DashboardHeader } from "../../_components/dashboard-header";
import { PeriodFilter } from "../../_components/period-filter";
import type { TimePeriod } from "@/lib/types";

interface Customer {
  name: string;
  phone: string;
  whatsapp: string;
  totalOrders: number;
  successfulOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  reliability: "high" | "average" | "low";
  reliabilityRate: number;
  location?: string | null;
}

interface CustomersPageProps {
  customers: Customer[];
  stats: {
    totalCustomers: number;
    activeCustomers: number;
    returningRate: number;
    avgLifetimeValue: number;
    trends: {
      totalCustomers: number;
      activeCustomers: number;
      returningRate: number;
      avgLifetimeValue: number;
    };
  };
  currentPeriod: TimePeriod;
}

const reliabilityConfig = {
  high: {
    label: "High Reliability",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  average: {
    label: "Average",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  low: {
    label: "Low Reliability",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
  },
};

export default function CustomersClient({
  customers,
  stats,
  currentPeriod,
}: CustomersPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();

  // Filter customers by search query
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.whatsapp.includes(searchQuery),
  );

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleExportData = () => {
    toast("Export feature coming soon!", {
      icon: "ℹ️",
    });
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const message = encodeURIComponent(`Hello ${name}! 👋`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-primary/10 text-primary",
      "bg-orange-100 text-orange-600",
      "bg-purple-100 text-purple-600",
      "bg-red-100 text-red-600",
      "bg-green-100 text-green-600",
      "bg-blue-100 text-blue-600",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <DashboardHeader
        heading="Customer Directory"
        text="Manage your customer relationships and track lifetime value performance"
      />

      {/* Period Filter and Actions */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <PeriodFilter currentPeriod={currentPeriod} />
        <Button onClick={handleExportData}>
          <Download className="size-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Customers
              </span>
              <Users className="size-5 text-primary" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-extrabold">
                {stats.totalCustomers.toLocaleString()}
              </span>
              <span
                className={`text-xs font-bold flex items-center mb-1 ${
                  stats.trends.totalCustomers >= 0
                    ? "text-emerald-500"
                    : "text-rose-500"
                }`}
              >
                {stats.trends.totalCustomers >= 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {Math.abs(stats.trends.totalCustomers)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Active Customers
              </span>
              <UserCheck className="size-5 text-emerald-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-extrabold">
                {stats.activeCustomers.toLocaleString()}
              </span>
              <span
                className={`text-xs font-bold flex items-center mb-1 ${
                  stats.trends.activeCustomers >= 0
                    ? "text-emerald-500"
                    : "text-rose-500"
                }`}
              >
                {stats.trends.activeCustomers >= 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {Math.abs(stats.trends.activeCustomers)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Returning Rate
              </span>
              <Repeat className="size-5 text-primary" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-extrabold">
                {stats.returningRate.toFixed(1)}%
              </span>
              <span
                className={`text-xs font-bold flex items-center mb-1 ${
                  stats.trends.returningRate >= 0
                    ? "text-emerald-500"
                    : "text-rose-500"
                }`}
              >
                {stats.trends.returningRate >= 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {Math.abs(stats.trends.returningRate)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Avg. Lifetime Value
              </span>
              <DollarSign className="size-5 text-primary" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-extrabold">
                ₦{Math.round(stats.avgLifetimeValue).toLocaleString()}
              </span>
              <span
                className={`text-xs font-bold flex items-center mb-1 ${
                  stats.trends.avgLifetimeValue >= 0
                    ? "text-emerald-500"
                    : "text-rose-500"
                }`}
              >
                {stats.trends.avgLifetimeValue >= 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {Math.abs(stats.trends.avgLifetimeValue)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <Button variant="outline" className="flex-1 md:flex-none">
                <Filter className="size-4 mr-2" />
                Source: All
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.refresh()}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact Details</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-center">Successful</TableHead>
                <TableHead className="text-center">Cancelled</TableHead>
                <TableHead>Total Spend</TableHead>
                <TableHead>Reliability</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer) => (
                  <TableRow key={customer.phone}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarFallback
                            className={`font-bold ${getAvatarColor(customer.name)}`}
                          >
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-sm">
                          {customer.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {customer.phone}
                        </span>
                        {customer.location && (
                          <span className="text-xs text-muted-foreground">
                            {customer.location}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {customer.totalOrders}
                    </TableCell>
                    <TableCell className="text-center text-emerald-600 font-bold">
                      {customer.successfulOrders}
                    </TableCell>
                    <TableCell className="text-center text-rose-600 font-bold">
                      {customer.cancelledOrders}
                    </TableCell>
                    <TableCell className="font-bold">
                      ₦{customer.totalSpent.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          reliabilityConfig[customer.reliability].color
                        }
                      >
                        {reliabilityConfig[customer.reliability].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleWhatsApp(customer.whatsapp, customer.name)
                          }
                          title="WhatsApp"
                        >
                          <MessageSquare className="size-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCall(customer.phone)}
                          title="Call"
                        >
                          <Phone className="size-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title="View Details"
                        >
                          <Link
                            href={`/dashboard/admin/customers/${encodeURIComponent(customer.phone)}`}
                          >
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of{" "}
            {filteredCustomers.length} customers
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

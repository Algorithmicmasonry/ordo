"use client";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  CheckCircle2,
  ShoppingBag,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  RefreshCw,
  MoreVertical,
} from "lucide-react";
import { useState } from "react";
import type { User } from "@prisma/client";
import { DashboardHeader, PeriodFilter } from "../../_components";
import { useRouter } from "next/navigation";

type SalesRepWithStats = User & {
  stats: {
    totalOrders: number;
    deliveredOrders: number;
    conversionRate: number;
    revenue: number;
  };
};

interface SalesRepsPageProps {
  salesReps: SalesRepWithStats[];
  stats: {
    totalReps: number;
    activeReps: number;
    totalOrders: number;
    avgConversion: number;
  };
}

export default function SalesRepsClient({
  salesReps,
  stats,
}: SalesRepsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();

  // Sort reps by revenue for leaderboard
  const topPerformers = [...salesReps]
    .sort((a, b) => b.stats.revenue - a.stats.revenue)
    .slice(0, 5);

  // Filter and paginate
  const filteredReps = salesReps.filter(
    (rep) =>
      rep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredReps.length / itemsPerPage);
  const paginatedReps = filteredReps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getRankBadge = (index: number) => {
    const badges = [
      { label: "1st", color: "bg-primary" },
      { label: "2nd", color: "bg-slate-400" },
      { label: "3rd", color: "bg-amber-700" },
    ];
    return badges[index] || null;
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <DashboardHeader
        heading="Sales Representative"
        text="Manage and monitor your sales team performance"
      />
      <div className="flex items-center justify-between">
        <PeriodFilter />
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="size-4 mr-2" />
            Filter by Status
          </Button>
          <Button size="sm">
            <Plus className="size-4 mr-2" />
            Add Sales Rep
          </Button>
        </div>
      </div>

      {/* Search Bar */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Reps
              </span>
              <Users className="size-5 text-primary" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-extrabold">{stats.totalReps}</span>
              <span className="text-emerald-500 text-xs font-bold flex items-center mb-1">
                <ArrowUpRight className="size-3" /> 0%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Active Reps
              </span>
              <CheckCircle2 className="size-5 text-emerald-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-extrabold">
                {stats.activeReps}
              </span>
              <span className="text-emerald-500 text-xs font-bold flex items-center mb-1">
                <ArrowUpRight className="size-3" /> 2%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Orders
              </span>
              <ShoppingBag className="size-5 text-orange-400" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-extrabold">
                {stats.totalOrders.toLocaleString()}
              </span>
              <span className="text-rose-500 text-xs font-bold flex items-center mb-1">
                <ArrowDownRight className="size-3" /> 5%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Avg Conversion
              </span>
              <TrendingUp className="size-5 text-blue-400" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-extrabold">
                {stats.avgConversion}%
              </span>
              <span className="text-emerald-500 text-xs font-bold flex items-center mb-1">
                <ArrowUpRight className="size-3" /> 12%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Leaderboard */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Performance Leaderboard (Top 5)</h3>
          <Button variant="link" size="sm" className="text-primary">
            View Full Ranking
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {topPerformers.map((rep, index) => {
            const rankBadge = getRankBadge(index);
            return (
              <Card
                key={rep.id}
                className="text-center hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-5">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <Avatar
                      className={`w-full h-full ${
                        index === 0
                          ? "ring-2 ring-primary ring-offset-2"
                          : index <= 2
                            ? "ring-2 ring-slate-300"
                            : ""
                      }`}
                    >
                      <AvatarImage src={rep.image || ""} alt={rep.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {rep.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {rankBadge && (
                      <div
                        className={`absolute -top-1 -right-1 ${rankBadge.color} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-background`}
                      >
                        {rankBadge.label}
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-sm">{rep.name}</h4>
                  <p className="text-[11px] text-muted-foreground mb-3">
                    {rep.email}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-bold">
                        ₦{rep.stats.revenue.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={rep.stats.conversionRate}
                      className="h-1.5"
                    />
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span className="text-muted-foreground">Conv Rate</span>
                      <span className="text-primary">
                        {rep.stats.conversionRate}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sales Reps Table */}
      <Card>
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/30">
          <h3 className="font-bold">All Sales Representatives</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <RefreshCw className="size-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="size-4" />
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedReps.map((rep) => (
                <TableRow key={rep.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarImage src={rep.image || ""} alt={rep.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {rep.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold">{rep.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {rep.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={rep.isActive ? "default" : "destructive"}
                      className={
                        rep.isActive
                          ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                          : ""
                      }
                    >
                      {rep.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {rep.stats.totalOrders}
                  </TableCell>
                  <TableCell className="font-medium">
                    {rep.stats.deliveredOrders}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {rep.stats.conversionRate}%
                      </span>
                      <Progress
                        value={rep.stats.conversionRate}
                        className="h-1 w-12"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">
                    ₦{rep.stats.revenue.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        onClick={() =>
                          router.push(`/dashboard/admin/sales-reps/${rep.id}`)
                        }
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="size-4" />
                      </Button>
                      <Switch checked={rep.isActive} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-medium">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredReps.length)} of{" "}
            {filteredReps.length} Sales Representatives
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? "bg-primary" : ""}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

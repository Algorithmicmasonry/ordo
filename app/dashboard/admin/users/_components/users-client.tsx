"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
import {
  Users,
  UserCheck,
  Mail,
  UserPlus,
  Upload,
  Download,
  Settings,
  Search,
  TrendingUp,
  Edit,
  Trash2,
  KeyRound,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { User, UserRole } from "@prisma/client";
import { getInitials, formatRole } from "@/lib/utils";
import { AddUserModal } from "./add-user-modal";
import { EditUserModal } from "./edit-user-modal";
import { toggleUserStatus } from "@/app/actions/user";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface UsersClientProps {
  users: User[];
  stats: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    newUsersThisMonth: number;
    newUsersTrend: number;
  };
  roleDistribution: {
    admin: number;
    salesRep: number;
    inventoryManager: number;
  };
  monthlyGrowth: Array<{ month: string; users: number }>;
}

const roleColors: Record<UserRole, string> = {
  ADMIN: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  SALES_REP: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  INVENTORY_MANAGER:
    "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
};

const PIE_COLORS = ["#137fec", "#818cf8", "#cbd5e1"];

export default function UsersClient({
  users,
  stats,
  roleDistribution,
  monthlyGrowth,
}: UsersClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const itemsPerPage = 10;

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === "all" ? true : user.role === roleFilter;

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
          ? user.isActive
          : !user.isActive;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Prepare pie chart data
  const pieData = [
    {
      name: "Sales Reps",
      value: roleDistribution.salesRep,
      percentage: (
        (roleDistribution.salesRep / stats.totalUsers) *
        100
      ).toFixed(0),
    },
    {
      name: "Admins",
      value: roleDistribution.admin,
      percentage: ((roleDistribution.admin / stats.totalUsers) * 100).toFixed(
        0
      ),
    },
    {
      name: "Inv. Mgr",
      value: roleDistribution.inventoryManager,
      percentage: (
        (roleDistribution.inventoryManager / stats.totalUsers) *
        100
      ).toFixed(0),
    },
  ];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(paginatedUsers.map((u) => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelection = new Set(selectedUsers);
    if (checked) {
      newSelection.add(userId);
    } else {
      newSelection.delete(userId);
    }
    setSelectedUsers(newSelection);
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    const result = await toggleUserStatus(userId, isActive);
    if (result.success) {
      toast.success(`User ${isActive ? "activated" : "deactivated"}`);
    } else {
      toast.error(result.error || "Failed to update user status");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black tracking-tight">
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage company-wide user roles, permissions, and security settings.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Upload className="size-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={() => setAddModalOpen(true)}>
            <UserPlus className="size-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Users
              </span>
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Users className="size-5" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-extrabold">
                {stats.totalUsers}
              </span>
              {stats.newUsersTrend !== 0 && (
                <span className="text-xs text-emerald-500 font-bold mt-2 flex items-center">
                  <TrendingUp className="size-3 mr-1" />
                  {stats.newUsersTrend > 0 ? "+" : ""}
                  {stats.newUsersTrend}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Active Users
              </span>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                <UserCheck className="size-5" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-extrabold">
                {stats.activeUsers}
              </span>
              <span className="text-xs text-muted-foreground mt-2">
                {stats.inactiveUsers} inactive
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pending Invites
              </span>
              <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                <Mail className="size-5" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-extrabold">0</span>
              <span className="text-xs text-muted-foreground mt-2">
                No pending invites
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                New Users (Month)
              </span>
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <UserPlus className="size-5" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-extrabold">
                {stats.newUsersThisMonth}
              </span>
              {stats.newUsersTrend !== 0 && (
                <span className="text-xs text-emerald-500 font-bold mt-2 flex items-center">
                  <TrendingUp className="size-3 mr-1" />
                  {stats.newUsersTrend > 0 ? "+" : ""}
                  {stats.newUsersTrend}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold">User Growth</h2>
              <p className="text-sm text-muted-foreground">
                Growth trend over the last 6 months
              </p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#137fec"
                  strokeWidth={2}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Role Distribution Chart */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold">Role Distribution</h2>
              <p className="text-sm text-muted-foreground">
                Active roles by category
              </p>
            </div>
            <div className="flex items-center justify-center gap-10">
              <div className="relative">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold">{stats.totalUsers}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                    Total
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[index] }}
                    />
                    <span className="text-sm font-medium">
                      {item.name} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 min-w-[300px] gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Select
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SALES_REP">Sales Rep</SelectItem>
                  <SelectItem value="INVENTORY_MANAGER">
                    Inventory Manager
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 border-l border-border pl-4">
              <Button variant="ghost" size="icon" title="Download report">
                <Download className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Settings">
                <Settings className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {selectedUsers.size > 0 && (
          <div className="bg-muted border-b px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedUsers.size === paginatedUsers.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-semibold text-muted-foreground">
                {selectedUsers.size} user{selectedUsers.size > 1 ? "s" : ""}{" "}
                selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-red-600">
                Deactivate
              </Button>
              <Button variant="outline" size="sm">
                Bulk Password Reset
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      paginatedUsers.length > 0 &&
                      selectedUsers.size === paginatedUsers.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name & Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={(checked) =>
                          handleSelectUser(user.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {getInitials(user.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold">{user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={roleColors[user.role]}>
                        {formatRole(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={(checked) =>
                            handleToggleStatus(user.id, checked)
                          }
                        />
                        <span
                          className={`text-sm font-medium ${user.isActive ? "text-emerald-600" : "text-muted-foreground"}`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditModalOpen(true);
                          }}
                          title="Edit"
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Reset Password"
                        >
                          <KeyRound className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
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
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted">
          <span className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of{" "}
            {filteredUsers.length} users
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Modals */}
      <AddUserModal open={addModalOpen} onOpenChange={setAddModalOpen} />
      <EditUserModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={selectedUser}
      />
    </div>
  );
}

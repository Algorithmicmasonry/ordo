"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAllOrders,
  updateOrderStatus,
  assignAgentToOrder,
  addOrderNote,
} from "@/app/actions/orders";
import { getAllAgents } from "@/app/actions/agents";
import { getAllSalesReps } from "@/app/actions/user";
import { OrderStatus, OrderSource } from "@prisma/client";
import type { OrderWithDetails } from "@/lib/types";
import { formatDateTime } from "@/lib/date-utils";
import { getCurrencySymbol } from "@/lib/currency";
import {
  Search,
  X,
  Filter,
  Facebook,
  MessageCircle,
  Globe,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  XCircle,
  Calendar,
  Download,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type Agent = {
  id: string;
  name: string;
};

type SalesRep = {
  id: string;
  name: string;
};

export default function OrdersPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(
    null,
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Note form states
  const [noteText, setNoteText] = useState("");
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Bulk operations states
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [showBulkAgentModal, setShowBulkAgentModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>(
    OrderStatus.CONFIRMED,
  );
  const [bulkAgentId, setBulkAgentId] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<OrderSource | "all">("all");
  const [salesRepFilter, setSalesRepFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "month"
  >("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Sorting states
  type SortField =
    | "orderNumber"
    | "customerName"
    | "totalAmount"
    | "status"
    | "createdAt";
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (!isPending && (!session || (session.user as any).role !== "ADMIN")) {
      router.push("/login");
    } else if (session?.user) {
      loadData();
    }
  }, [session, isPending, router]);

  async function loadData() {
    setLoading(true);
    const [ordersResult, agentsResult, salesRepsResult] = await Promise.all([
      getAllOrders(),
      getAllAgents(),
      getAllSalesReps(),
    ]);

    if (ordersResult.success && ordersResult.orders) {
      setOrders(ordersResult.orders as OrderWithDetails[]);
    }

    if (agentsResult.success && agentsResult.agents) {
      setAgents(
        agentsResult.agents.map((a: any) => ({ id: a.id, name: a.name })),
      );
    }

    if (salesRepsResult.success && salesRepsResult.salesReps) {
      setSalesReps(salesRepsResult.salesReps);
    }

    setLoading(false);
  }

  async function loadOrders() {
    const result = await getAllOrders();
    if (result.success && result.orders) {
      setOrders(result.orders as OrderWithDetails[]);
    }
  }

  async function handleStatusUpdate(orderId: string, status: OrderStatus) {
    if (!session?.user?.id) return;

    const result = await updateOrderStatus(
      orderId,
      status,
      session.user.id,
      "ADMIN",
    );

    if (result.success) {
      loadOrders();
    }
  }

  function getStatusBadgeClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.NEW:
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";
      case OrderStatus.CONFIRMED:
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400";
      case OrderStatus.DISPATCHED:
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400";
      case OrderStatus.DELIVERED:
        return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
      case OrderStatus.CANCELLED:
        return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
      case OrderStatus.POSTPONED:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400";
    }
  }

  function getSourceBadgeClass(source: OrderSource): string {
    switch (source) {
      case OrderSource.FACEBOOK:
        return "bg-blue-100 text-blue-700";
      case OrderSource.TIKTOK:
        return "bg-pink-100 text-pink-700";
      case OrderSource.WHATSAPP:
        return "bg-green-100 text-green-700";
      case OrderSource.WEBSITE:
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function openDetailsModal(order: OrderWithDetails) {
    setSelectedOrder(order);
    setShowDetailsModal(true);
    // Reset note form
    setNoteText("");
    setIsFollowUp(false);
    setFollowUpDate("");
  }

  function closeDetailsModal() {
    setShowDetailsModal(false);
    setSelectedOrder(null);
    setNoteText("");
    setIsFollowUp(false);
    setFollowUpDate("");
  }

  async function handleAgentAssignment(orderId: string, agentId: string) {
    if (!session?.user?.id) return;

    const result = await assignAgentToOrder(
      orderId,
      agentId,
      session.user.id,
      "ADMIN",
    );

    if (result.success) {
      await loadOrders();
      // Update selected order
      if (selectedOrder && selectedOrder.id === orderId) {
        const updatedOrder = orders.find((o) => o.id === orderId);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder as OrderWithDetails);
        }
      }
    }
  }

  async function handleAddNote() {
    if (!selectedOrder || !noteText.trim() || !session?.user?.id) return;

    setIsAddingNote(true);

    const result = await addOrderNote(
      selectedOrder.id,
      noteText.trim(),
      isFollowUp,
      followUpDate ? new Date(followUpDate) : null,
      session.user.id,
      "ADMIN",
    );

    if (result.success) {
      await loadOrders();
      // Update selected order with new note
      const updatedOrder = orders.find((o) => o.id === selectedOrder.id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder as OrderWithDetails);
      }
      // Reset form
      setNoteText("");
      setIsFollowUp(false);
      setFollowUpDate("");
    }

    setIsAddingNote(false);
  }

  function getSourceIcon(source: OrderSource) {
    switch (source) {
      case OrderSource.FACEBOOK:
        return <Facebook className="size-5 text-blue-600" />;
      case OrderSource.TIKTOK:
        return <MessageCircle className="size-5 text-pink-600" />;
      case OrderSource.WHATSAPP:
        return <MessageCircle className="size-5 text-green-600" />;
      case OrderSource.WEBSITE:
        return <Globe className="size-5 text-purple-600" />;
      default:
        return null;
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setSourceFilter("all");
    setSalesRepFilter("all");
    setAgentFilter("all");
    setDateFilter("all");
  }

  // Bulk selection functions
  function toggleOrderSelection(orderId: string) {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  }

  function toggleSelectAll() {
    const currentPageIds = paginatedOrders.map((order) => order.id);
    const allCurrentPageSelected = currentPageIds.every((id) =>
      selectedOrderIds.includes(id),
    );

    if (allCurrentPageSelected) {
      // Deselect all on current page
      setSelectedOrderIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id)),
      );
    } else {
      // Select all on current page
      setSelectedOrderIds((prev) => [...new Set([...prev, ...currentPageIds])]);
    }
  }

  function clearSelection() {
    setSelectedOrderIds([]);
  }

  // Bulk operations
  async function handleBulkStatusUpdate() {
    if (!session?.user?.id || selectedOrderIds.length === 0) return;

    setIsBulkUpdating(true);

    const updatePromises = selectedOrderIds.map((orderId) =>
      updateOrderStatus(orderId, bulkStatus, session.user.id, "ADMIN"),
    );

    await Promise.all(updatePromises);

    await loadOrders();
    setShowBulkStatusModal(false);
    setSelectedOrderIds([]);
    setIsBulkUpdating(false);
  }

  async function handleBulkAgentAssignment() {
    if (!session?.user?.id || selectedOrderIds.length === 0 || !bulkAgentId)
      return;

    setIsBulkUpdating(true);

    const updatePromises = selectedOrderIds.map((orderId) =>
      assignAgentToOrder(orderId, bulkAgentId, session.user.id, "ADMIN"),
    );

    await Promise.all(updatePromises);

    await loadOrders();
    setShowBulkAgentModal(false);
    setSelectedOrderIds([]);
    setBulkAgentId("");
    setIsBulkUpdating(false);
  }

  function exportToCSV() {
    const ordersToExport =
      selectedOrderIds.length > 0
        ? orders.filter((order) => selectedOrderIds.includes(order.id))
        : filteredOrders;

    // Create CSV header
    const headers = [
      "Order Number",
      "Customer Name",
      "Customer Phone",
      "City",
      "State",
      "Source",
      "Status",
      "Total Amount",
      "Sales Rep",
      "Agent",
      "Created Date",
    ];

    // Create CSV rows
    const rows = ordersToExport.map((order) => [
      order.orderNumber,
      order.customerName,
      order.customerPhone,
      order.city,
      order.state,
      order.source,
      order.status,
      order.totalAmount.toString(),
      order.assignedTo?.name || "Unassigned",
      order.agent?.name || "Not assigned",
      new Date(order.createdAt).toLocaleString(),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.toString().replace(/"/g, '""')}`).join(","),
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `orders_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clear selection after export
    if (selectedOrderIds.length > 0) {
      setSelectedOrderIds([]);
    }
  }

  // Apply all filters
  const filteredOrders = orders.filter((order) => {
    // Search filter (order number, customer name, phone)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.toLowerCase().includes(query);

      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }

    // Source filter
    if (sourceFilter !== "all" && order.source !== sourceFilter) {
      return false;
    }

    // Sales rep filter
    if (salesRepFilter !== "all") {
      if (salesRepFilter === "unassigned" && order.assignedToId !== null) {
        return false;
      } else if (
        salesRepFilter !== "unassigned" &&
        order.assignedToId !== salesRepFilter
      ) {
        return false;
      }
    }

    // Agent filter
    if (agentFilter !== "all") {
      if (agentFilter === "unassigned" && order.agentId !== null) {
        return false;
      } else if (
        agentFilter !== "unassigned" &&
        order.agentId !== agentFilter
      ) {
        return false;
      }
    }

    // Date filter
    if (dateFilter !== "all") {
      const orderDate = new Date(order.createdAt);
      const now = new Date();

      if (dateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (orderDate < today) return false;
      } else if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        if (orderDate < weekAgo) return false;
      } else if (dateFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setDate(now.getDate() - 30);
        monthAgo.setHours(0, 0, 0, 0);
        if (orderDate < monthAgo) return false;
      }
    }

    return true;
  });

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== "all" ||
    sourceFilter !== "all" ||
    salesRepFilter !== "all" ||
    agentFilter !== "all" ||
    dateFilter !== "all";

  // Sorting logic
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case "orderNumber":
        aValue = a.orderNumber;
        bValue = b.orderNumber;
        break;
      case "customerName":
        aValue = a.customerName.toLowerCase();
        bValue = b.customerName.toLowerCase();
        break;
      case "totalAmount":
        aValue = a.totalAmount;
        bValue = b.totalAmount;
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      case "createdAt":
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    statusFilter,
    sourceFilter,
    salesRepFilter,
    agentFilter,
    dateFilter,
  ]);

  // Sorting handler
  function handleSort(field: SortField) {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection("desc");
    }
  }

  // Pagination handlers
  function goToPage(page: number) {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }

  function nextPage() {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }

  function previousPage() {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }

  // Sort indicator component
  function SortIndicator({ field }: { field: SortField }) {
    if (sortField !== field) {
      return <ChevronsUpDown className="size-4 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="size-4 text-blue-600" />
    ) : (
      <ChevronDown className="size-4 text-blue-600" />
    );
  }

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-400 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link
              href="/dashboard/admin"
              className="text-blue-600 hover:underline text-sm mb-2 inline-block"
            >
              ← Back to Admin Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Orders Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage all customer orders and track fulfillment
            </p>
          </div>
          <div className="text-right flex items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1}-{Math.min(endIndex, sortedOrders.length)}{" "}
              of {sortedOrders.length} orders
              {sortedOrders.length !== orders.length &&
                ` (filtered from ${orders.length})`}
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
            >
              <Download className="size-4" />
              Export All
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="size-5 text-gray-400" />
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Filters
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <X className="size-4" />
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Order #, customer, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as OrderStatus | "all")
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value={OrderStatus.NEW}>New</option>
                <option value={OrderStatus.CONFIRMED}>Confirmed</option>
                <option value={OrderStatus.DISPATCHED}>Dispatched</option>
                <option value={OrderStatus.DELIVERED}>Delivered</option>
                <option value={OrderStatus.CANCELLED}>Cancelled</option>
                <option value={OrderStatus.POSTPONED}>Postponed</option>
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Source
              </label>
              <select
                value={sourceFilter}
                onChange={(e) =>
                  setSourceFilter(e.target.value as OrderSource | "all")
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sources</option>
                <option value={OrderSource.FACEBOOK}>Facebook</option>
                <option value={OrderSource.TIKTOK}>TikTok</option>
                <option value={OrderSource.WHATSAPP}>WhatsApp</option>
                <option value={OrderSource.WEBSITE}>Website</option>
              </select>
            </div>

            {/* Sales Rep Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sales Rep
              </label>
              <select
                value={salesRepFilter}
                onChange={(e) => setSalesRepFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sales Reps</option>
                <option value="unassigned">Unassigned</option>
                {salesReps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Agent Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Agent
              </label>
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Agents</option>
                <option value="unassigned">Unassigned</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(
                    e.target.value as "all" | "today" | "week" | "month",
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedOrderIds.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Check className="size-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {selectedOrderIds.length} order
                    {selectedOrderIds.length !== 1 ? "s" : ""} selected
                  </span>
                </div>
                <button
                  onClick={clearSelection}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Clear selection
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBulkStatusModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Update Status
                </button>
                <button
                  onClick={() => setShowBulkAgentModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Assign Agent
                </button>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                >
                  <Download className="size-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        paginatedOrders.length > 0 &&
                        paginatedOrders.every((order) =>
                          selectedOrderIds.includes(order.id),
                        )
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort("orderNumber")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Order #
                      <SortIndicator field="orderNumber" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort("customerName")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Customer
                      <SortIndicator field="customerName" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort("totalAmount")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Amount
                      <SortIndicator field="totalAmount" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sales Rep
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Status
                      <SortIndicator field="status" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort("createdAt")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Date
                      <SortIndicator field="createdAt" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      {orders.length === 0
                        ? "No orders found"
                        : sortedOrders.length === 0
                          ? "No orders match your filters"
                          : "No orders on this page"}
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          #{order.orderNumber.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-gray-900 dark:text-gray-100 font-medium">
                          {order.customerName}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">
                          {order.customerPhone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-gray-900 dark:text-gray-100">
                          {order.city}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">
                          {order.state}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="max-w-xs">
                          {order.items.map((item, idx) => (
                            <div
                              key={item.id}
                              className="text-gray-900 dark:text-gray-100"
                            >
                              {item.product.name} × {item.quantity}
                              {idx < order.items.length - 1 && ", "}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {getCurrencySymbol(order.currency)}{order.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSourceBadgeClass(
                            order.source,
                          )}`}
                        >
                          {order.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {order.assignedTo?.name || (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {order.agent?.name || (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusUpdate(
                              order.id,
                              e.target.value as OrderStatus,
                            )
                          }
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(
                            order.status,
                          )} border-0 cursor-pointer`}
                        >
                          <option value={OrderStatus.NEW}>New</option>
                          <option value={OrderStatus.CONFIRMED}>
                            Confirmed
                          </option>
                          <option value={OrderStatus.DISPATCHED}>
                            Dispatched
                          </option>
                          <option value={OrderStatus.DELIVERED}>
                            Delivered
                          </option>
                          <option value={OrderStatus.CANCELLED}>
                            Cancelled
                          </option>
                          <option value={OrderStatus.POSTPONED}>
                            Postponed
                          </option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs">
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openDetailsModal(order)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {sortedOrders.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Rows per page:
                </div>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                    title="First page"
                  >
                    <ChevronLeft className="size-4" />
                    <ChevronLeft className="size-4 -ml-3" />
                  </button>
                  <button
                    onClick={previousPage}
                    disabled={currentPage === 1}
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                    title="Previous page"
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (page === 1 || page === totalPages) return true;
                        if (Math.abs(page - currentPage) <= 1) return true;
                        return false;
                      })
                      .map((page, idx, arr) => {
                        // Add ellipsis between non-consecutive pages
                        const prevPage = arr[idx - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;

                        return (
                          <div key={page} className="flex items-center gap-1">
                            {showEllipsis && (
                              <span className="px-2 text-gray-500 dark:text-gray-400">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => goToPage(page)}
                              className={`min-w-[32px] h-8 px-3 rounded text-sm font-medium ${
                                currentPage === page
                                  ? "bg-blue-600 text-white"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                    title="Next page"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                    title="Last page"
                  >
                    <ChevronRight className="size-4" />
                    <ChevronRight className="size-4 -ml-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Order Details Modal */}
        {showDetailsModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Order #{selectedOrder.orderNumber.slice(0, 12)}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      {getSourceIcon(selectedOrder.source)}
                      <span>{selectedOrder.source}</span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(
                        selectedOrder.status,
                      )}`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-6">
                  {/* Customer Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Customer Information
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Name:
                        </span>{" "}
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {selectedOrder.customerName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Phone:
                        </span>{" "}
                        <span className="text-gray-900 dark:text-gray-100">
                          {selectedOrder.customerPhone}
                        </span>
                      </div>
                      {selectedOrder.customerWhatsapp && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            WhatsApp:
                          </span>{" "}
                          <span className="text-gray-900 dark:text-gray-100">
                            {selectedOrder.customerWhatsapp}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Address:
                        </span>{" "}
                        <span className="text-gray-900 dark:text-gray-100">
                          {selectedOrder.deliveryAddress}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          City:
                        </span>{" "}
                        <span className="text-gray-900 dark:text-gray-100">
                          {selectedOrder.city}
                        </span>
                        , {selectedOrder.state}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Order Items
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300 font-medium">
                              Product
                            </th>
                            <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300 font-medium">
                              Qty
                            </th>
                            <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300 font-medium">
                              Price
                            </th>
                            <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300 font-medium">
                              Cost
                            </th>
                            <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300 font-medium">
                              Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item) => (
                            <tr
                              key={item.id}
                              className="border-t border-gray-200 dark:border-gray-700"
                            >
                              <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
                                {item.product.name}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                                {getCurrencySymbol(selectedOrder.currency)}{item.price.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                                {getCurrencySymbol(selectedOrder.currency)}{item.cost.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 font-medium">
                                {getCurrencySymbol(selectedOrder.currency)}{(item.price * item.quantity).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100 dark:bg-gray-700">
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100"
                            >
                              Total
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                              {getCurrencySymbol(selectedOrder.currency)}{selectedOrder.totalAmount.toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Assignment */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Sales Rep
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm text-gray-900 dark:text-gray-100">
                        {selectedOrder.assignedTo?.name || "Unassigned"}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Delivery Agent
                      </h4>
                      <select
                        value={selectedOrder.agentId || ""}
                        onChange={(e) =>
                          handleAgentAssignment(
                            selectedOrder.id,
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Not assigned</option>
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Status Timeline
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="space-y-4">
                        {/* Created */}
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            <Package className="size-5 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                Order Created
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDateTime(
                                  new Date(selectedOrder.createdAt),
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Confirmed */}
                        {selectedOrder.confirmedAt ? (
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <CheckCircle2 className="size-5 text-yellow-500" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                  Confirmed
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDateTime(
                                    new Date(selectedOrder.confirmedAt),
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3 opacity-50">
                            <div className="mt-1">
                              <Clock className="size-5 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <span className="font-medium text-gray-500 dark:text-gray-400 text-sm">
                                Awaiting Confirmation
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Dispatched */}
                        {selectedOrder.dispatchedAt ? (
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <Truck className="size-5 text-purple-500" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                  Dispatched
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDateTime(
                                    new Date(selectedOrder.dispatchedAt),
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3 opacity-50">
                            <div className="mt-1">
                              <Clock className="size-5 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <span className="font-medium text-gray-500 dark:text-gray-400 text-sm">
                                Awaiting Dispatch
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Delivered or Cancelled */}
                        {selectedOrder.deliveredAt ? (
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <CheckCircle2 className="size-5 text-green-500" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                  Delivered
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDateTime(
                                    new Date(selectedOrder.deliveredAt),
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : selectedOrder.cancelledAt ? (
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <XCircle className="size-5 text-red-500" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                  Cancelled
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDateTime(
                                    new Date(selectedOrder.cancelledAt),
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3 opacity-50">
                            <div className="mt-1">
                              <Clock className="size-5 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <span className="font-medium text-gray-500 dark:text-gray-400 text-sm">
                                Awaiting Delivery
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes & Communication */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Notes & Communication
                    </h4>

                    {/* Existing Notes */}
                    {selectedOrder.notes && selectedOrder.notes.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3 mb-4">
                        {selectedOrder.notes.map((note) => (
                          <div
                            key={note.id}
                            className="text-sm border-l-2 border-blue-500 pl-3 py-1"
                          >
                            <div className="text-gray-900 dark:text-gray-100">
                              {note.note}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                              <span>
                                {formatDateTime(new Date(note.createdAt))}
                              </span>
                              {note.isFollowUp && note.followUpDate && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded">
                                  <Calendar className="size-3" />
                                  Follow-up:{" "}
                                  {new Date(
                                    note.followUpDate,
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Note Form */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Add Note
                      </label>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add a note about this order..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />

                      <div className="mt-3 flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={isFollowUp}
                            onChange={(e) => setIsFollowUp(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300">
                            Follow-up required
                          </span>
                        </label>

                        {isFollowUp && (
                          <input
                            type="date"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        )}

                        <button
                          onClick={handleAddNote}
                          disabled={!noteText.trim() || isAddingNote}
                          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {isAddingNote ? "Adding..." : "Add Note"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                <button
                  onClick={closeDetailsModal}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Status Update Modal */}
        {showBulkStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Update Status for {selectedOrderIds.length} Order
                {selectedOrderIds.length !== 1 ? "s" : ""}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select New Status
                  </label>
                  <select
                    value={bulkStatus}
                    onChange={(e) =>
                      setBulkStatus(e.target.value as OrderStatus)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={OrderStatus.NEW}>New</option>
                    <option value={OrderStatus.CONFIRMED}>Confirmed</option>
                    <option value={OrderStatus.DISPATCHED}>Dispatched</option>
                    <option value={OrderStatus.DELIVERED}>Delivered</option>
                    <option value={OrderStatus.CANCELLED}>Cancelled</option>
                    <option value={OrderStatus.POSTPONED}>Postponed</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleBulkStatusUpdate}
                    disabled={isBulkUpdating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBulkUpdating ? "Updating..." : "Update Status"}
                  </button>
                  <button
                    onClick={() => setShowBulkStatusModal(false)}
                    disabled={isBulkUpdating}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Agent Assignment Modal */}
        {showBulkAgentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Assign Agent to {selectedOrderIds.length} Order
                {selectedOrderIds.length !== 1 ? "s" : ""}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Agent
                  </label>
                  <select
                    value={bulkAgentId}
                    onChange={(e) => setBulkAgentId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select an agent</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleBulkAgentAssignment}
                    disabled={isBulkUpdating || !bulkAgentId}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBulkUpdating ? "Assigning..." : "Assign Agent"}
                  </button>
                  <button
                    onClick={() => {
                      setShowBulkAgentModal(false);
                      setBulkAgentId("");
                    }}
                    disabled={isBulkUpdating}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

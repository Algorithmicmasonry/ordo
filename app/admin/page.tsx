"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getAllOrders, updateOrderStatus } from "@/app/actions/orders"
import { getAdminStats } from "@/app/actions/stats"
import { OrderStatus } from "@prisma/client"
import type { OrderWithDetails, AdminStats } from "@/lib/types"

export default function AdminDashboard() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "today" | OrderStatus>("all")

  useEffect(() => {
    if (!isPending && (!session || session.user.role !== "ADMIN")) {
      router.push("/login")
    } else if (session?.user) {
      loadData()
    }
  }, [session, isPending, router])

  async function loadData() {
    setLoading(true)

    const [statsResult, ordersResult] = await Promise.all([
      getAdminStats(),
      getAllOrders(),
    ])

    if (statsResult.success && statsResult.stats) {
      setStats(statsResult.stats)
    }

    if (ordersResult.success && ordersResult.orders) {
      setOrders(ordersResult.orders as OrderWithDetails[])
    }

    setLoading(false)
  }

  async function handleStatusUpdate(orderId: string, status: OrderStatus) {
    if (!session?.user?.id) return

    const result = await updateOrderStatus(
      orderId,
      status,
      session.user.id,
      "ADMIN"
    )

    if (result.success) {
      loadData()
    }
  }

  const filteredOrders = (() => {
    if (filter === "all") return orders
    if (filter === "today") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return orders.filter((o) => new Date(o.createdAt) >= today)
    }
    return orders.filter((o) => o.status === filter)
  })()

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Complete system oversight and management</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/admin/products"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
          >
            <div className="text-2xl mb-2">📦</div>
            <div className="text-sm font-medium">Products</div>
          </Link>

          <Link
            href="/admin/inventory"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium">Inventory</div>
          </Link>

          <Link
            href="/admin/agents"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="text-sm font-medium">Agents</div>
          </Link>

          <Link
            href="/admin/expenses"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
          >
            <div className="text-2xl mb-2">💰</div>
            <div className="text-sm font-medium">Expenses</div>
          </Link>

          <Link
            href="/admin/sales-reps"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
          >
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm font-medium">Sales Reps</div>
          </Link>

          <Link
            href="/admin/reports"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
          >
            <div className="text-2xl mb-2">📈</div>
            <div className="text-sm font-medium">Reports</div>
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Total Orders</div>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.ordersToday} today
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-blue-600">
                ₦{stats.totalRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Delivered orders only
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Net Profit</div>
              <div className="text-2xl font-bold text-green-600">
                ₦{stats.totalProfit.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                After expenses
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Delivery Rate</div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.deliveryRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.deliveredOrders} / {stats.totalOrders} orders
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-md ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setFilter("today")}
              className={`px-4 py-2 rounded-md ${
                filter === "today"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilter(OrderStatus.NEW)}
              className={`px-4 py-2 rounded-md ${
                filter === OrderStatus.NEW
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              New
            </button>
            <button
              onClick={() => setFilter(OrderStatus.CONFIRMED)}
              className={`px-4 py-2 rounded-md ${
                filter === OrderStatus.CONFIRMED
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setFilter(OrderStatus.DISPATCHED)}
              className={`px-4 py-2 rounded-md ${
                filter === OrderStatus.DISPATCHED
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Dispatched
            </button>
            <button
              onClick={() => setFilter(OrderStatus.DELIVERED)}
              className={`px-4 py-2 rounded-md ${
                filter === OrderStatus.DELIVERED
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Delivered
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales Rep
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-medium text-gray-900">
                          #{order.orderNumber.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-gray-900">{order.customerName}</div>
                        <div className="text-gray-500">{order.customerPhone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {order.items.map((item) => (
                          <div key={item.id}>
                            {item.product.name} x {item.quantity}
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₦{order.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.assignedTo?.name || "Unassigned"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusUpdate(
                              order.id,
                              e.target.value as OrderStatus
                            )
                          }
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === OrderStatus.NEW
                              ? "bg-yellow-100 text-yellow-800"
                              : order.status === OrderStatus.CONFIRMED
                              ? "bg-blue-100 text-blue-800"
                              : order.status === OrderStatus.DISPATCHED
                              ? "bg-purple-100 text-purple-800"
                              : order.status === OrderStatus.DELIVERED
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

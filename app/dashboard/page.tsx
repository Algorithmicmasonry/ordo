"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import {
  getSalesRepOrders,
  updateOrderStatus,
  assignAgentToOrder,
  addOrderNote,
} from "@/app/actions/orders"
import { getActiveAgents } from "@/app/actions/agents"
import { getSalesRepDashboardStats } from "@/app/actions/stats"
import { OrderStatus } from "@prisma/client"
import type { OrderWithDetails, SalesRepStats } from "@/lib/types"

type Agent = {
  id: string
  name: string
  location: string
}

export default function SalesRepDashboard() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [stats, setStats] = useState<SalesRepStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | OrderStatus>("all")

  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(
    null
  )
  const [noteText, setNoteText] = useState("")
  const [isFollowUp, setIsFollowUp] = useState(false)
  const [followUpDate, setFollowUpDate] = useState("")

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login")
    } else if (session?.user) {
      loadData()
    }
  }, [session, isPending, router])

  async function loadData() {
    if (!session?.user?.id) return

    setLoading(true)

    const [ordersResult, agentsResult, statsResult] = await Promise.all([
      getSalesRepOrders(session.user.id),
      getActiveAgents(),
      getSalesRepDashboardStats(session.user.id),
    ])

    if (ordersResult.success && ordersResult.orders) {
      setOrders(ordersResult.orders as OrderWithDetails[])
    }

    if (agentsResult.success && agentsResult.agents) {
      setAgents(agentsResult.agents)
    }

    if (statsResult.success && statsResult.stats) {
      setStats(statsResult.stats)
    }

    setLoading(false)
  }

  async function handleStatusUpdate(orderId: string, status: OrderStatus) {
    if (!session?.user?.id) return

    const result = await updateOrderStatus(
      orderId,
      status,
      session.user.id,
      "SALES_REP"
    )

    if (result.success) {
      loadData()
    }
  }

  async function handleAssignAgent(orderId: string, agentId: string) {
    if (!session?.user?.id) return

    const result = await assignAgentToOrder(
      orderId,
      agentId,
      session.user.id,
      "SALES_REP"
    )

    if (result.success) {
      loadData()
    }
  }

  async function handleAddNote() {
    if (!session?.user?.id || !selectedOrder || !noteText.trim()) return

    const result = await addOrderNote(
      selectedOrder.id,
      noteText,
      isFollowUp,
      followUpDate ? new Date(followUpDate) : null,
      session.user.id,
      "SALES_REP"
    )

    if (result.success) {
      setNoteText("")
      setIsFollowUp(false)
      setFollowUpDate("")
      setSelectedOrder(null)
      loadData()
    }
  }

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter)

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session?.user?.name}</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Total Orders</div>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Delivered</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.deliveredOrders}
              </div>
              <div className="text-xs text-gray-500">
                {stats.deliveredPercentage.toFixed(1)}%
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Cancelled</div>
              <div className="text-2xl font-bold text-red-600">
                {stats.cancelledOrders}
              </div>
              <div className="text-xs text-gray-500">
                {stats.cancelledPercentage.toFixed(1)}%
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-blue-600">
                ₦{stats.totalRevenue.toLocaleString()}
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
              All
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

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {order.customerName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Order #{order.orderNumber}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <div className="flex gap-2 mt-1">
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {order.customerPhone}
                      </a>
                      {order.customerWhatsapp && (
                        <a
                          href={`https://wa.me/${order.customerWhatsapp.replace(
                            /\D/g,
                            ""
                          )}?text=Hello ${
                            order.customerName
                          }, this is regarding your order ${
                            order.orderNumber
                          }`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Delivery</p>
                    <p className="text-sm text-gray-900">
                      {order.city}, {order.state}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Products</p>
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm mb-1"
                    >
                      <span>
                        {item.product.name} x {item.quantity}
                      </span>
                      <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold text-sm mt-2 pt-2 border-t">
                    <span>Total</span>
                    <span>₦{order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Update Status
                    </label>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusUpdate(
                          order.id,
                          e.target.value as OrderStatus
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value={OrderStatus.NEW}>New</option>
                      <option value={OrderStatus.CONFIRMED}>Confirmed</option>
                      <option value={OrderStatus.DISPATCHED}>Dispatched</option>
                      <option value={OrderStatus.DELIVERED}>Delivered</option>
                      <option value={OrderStatus.CANCELLED}>Cancelled</option>
                      <option value={OrderStatus.POSTPONED}>Postponed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign Agent
                    </label>
                    <select
                      value={order.agentId || ""}
                      onChange={(e) =>
                        handleAssignAgent(order.id, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select agent</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} - {agent.location}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Add Note
                  </button>

                  {order.notes.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Notes:
                      </p>
                      {order.notes.map((note) => (
                        <div key={note.id} className="text-sm text-gray-600 mb-2">
                          <p>{note.note}</p>
                          {note.isFollowUp && note.followUpDate && (
                            <p className="text-xs text-blue-600 mt-1">
                              Follow-up:{" "}
                              {new Date(note.followUpDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Note Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Add Note for Order #{selectedOrder.orderNumber}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFollowUp"
                  checked={isFollowUp}
                  onChange={(e) => setIsFollowUp(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="isFollowUp" className="text-sm text-gray-700">
                  Schedule follow-up
                </label>
              </div>

              {isFollowUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleAddNote}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Note
                </button>
                <button
                  onClick={() => {
                    setSelectedOrder(null)
                    setNoteText("")
                    setIsFollowUp(false)
                    setFollowUpDate("")
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

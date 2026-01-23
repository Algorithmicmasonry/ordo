"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  getAllAgents,
  createAgent,
  updateAgent,
  assignStockToAgent,
  updateAgentStockIssues,
} from "@/app/actions/agents"
import { getAllProducts } from "@/app/actions/products"

type Agent = {
  id: string
  name: string
  phone: string
  location: string
  address: string | null
  isActive: boolean
  stock: Array<{
    id: string
    quantity: number
    defective: number
    missing: number
    product: {
      id: string
      name: string
    }
  }>
}

type Product = {
  id: string
  name: string
}

export default function AgentsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const [agents, setAgents] = useState<Agent[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
    address: "",
  })

  const [stockFormData, setStockFormData] = useState({
    productId: "",
    quantity: "",
  })

  useEffect(() => {
    if (!isPending && (!session || (session.user as any).role !== "ADMIN")) {
      router.push("/login")
    } else if (session?.user) {
      loadData()
    }
  }, [session, isPending, router])

  async function loadData() {
    setLoading(true)
    const [agentsResult, productsResult] = await Promise.all([
      getAllAgents(),
      getAllProducts(),
    ])

    if (agentsResult.success && agentsResult.agents) {
      setAgents(agentsResult.agents as Agent[])
    }

    if (productsResult.success && productsResult.products) {
      setProducts(productsResult.products)
    }

    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (editingAgent) {
      const result = await updateAgent(editingAgent.id, formData)

      if (result.success) {
        setShowModal(false)
        setEditingAgent(null)
        resetForm()
        loadData()
      }
    } else {
      const result = await createAgent(formData)

      if (result.success) {
        setShowModal(false)
        resetForm()
        loadData()
      }
    }
  }

  async function handleAssignStock(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedAgent) return

    const result = await assignStockToAgent(
      selectedAgent.id,
      stockFormData.productId,
      parseInt(stockFormData.quantity)
    )

    if (result.success) {
      setShowStockModal(false)
      setSelectedAgent(null)
      setStockFormData({ productId: "", quantity: "" })
      loadData()
    }
  }

  async function handleToggleActive(agent: Agent) {
    const result = await updateAgent(agent.id, {
      isActive: !agent.isActive,
    })

    if (result.success) {
      loadData()
    }
  }

  async function handleUpdateStockIssues(
    agentId: string,
    productId: string,
    type: "defective" | "missing"
  ) {
    const value = prompt(`Enter ${type} quantity:`)
    if (!value) return

    const data =
      type === "defective"
        ? { defective: parseInt(value) }
        : { missing: parseInt(value) }

    const result = await updateAgentStockIssues(agentId, productId, data.defective, data.missing)

    if (result.success) {
      loadData()
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      phone: "",
      location: "",
      address: "",
    })
  }

  function openEditModal(agent: Agent) {
    setEditingAgent(agent)
    setFormData({
      name: agent.name,
      phone: agent.phone,
      location: agent.location,
      address: agent.address || "",
    })
    setShowModal(true)
  }

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link
              href="/admin"
              className="text-blue-600 hover:underline text-sm mb-2 inline-block"
            >
              ← Back to Admin Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
          </div>

          <button
            onClick={() => {
              setEditingAgent(null)
              resetForm()
              setShowModal(true)
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Add Agent
          </button>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-500">No agents found</p>
            </div>
          ) : (
            agents.map((agent) => (
              <div key={agent.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-gray-600">{agent.location}</p>
                  </div>

                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      agent.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {agent.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{agent.phone}</p>
                  </div>

                  {agent.address && (
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm text-gray-900">{agent.address}</p>
                    </div>
                  )}
                </div>

                {/* Stock Inventory */}
                {agent.stock.length > 0 && (
                  <div className="border-t pt-4 mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Stock Inventory
                    </p>
                    {agent.stock.map((stock) => (
                      <div
                        key={stock.id}
                        className="flex justify-between text-xs mb-2"
                      >
                        <span className="text-gray-600">
                          {stock.product.name}
                        </span>
                        <div className="text-right">
                          <div className="text-gray-900 font-medium">
                            {stock.quantity} units
                          </div>
                          {(stock.defective > 0 || stock.missing > 0) && (
                            <div className="text-red-600 text-xs">
                              {stock.defective > 0 &&
                                `Defective: ${stock.defective}`}
                              {stock.defective > 0 && stock.missing > 0 && ", "}
                              {stock.missing > 0 && `Missing: ${stock.missing}`}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedAgent(agent)
                      setShowStockModal(true)
                    }}
                    className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                  >
                    Assign Stock
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(agent)}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleToggleActive(agent)}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                    >
                      {agent.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Agent Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {editingAgent ? "Edit Agent" : "Add New Agent"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingAgent ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingAgent(null)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Stock Modal */}
      {showStockModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Assign Stock to {selectedAgent.name}
            </h3>

            <form onSubmit={handleAssignStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product *
                </label>
                <select
                  required
                  value={stockFormData.productId}
                  onChange={(e) =>
                    setStockFormData({
                      ...stockFormData,
                      productId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={stockFormData.quantity}
                  onChange={(e) =>
                    setStockFormData({
                      ...stockFormData,
                      quantity: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Assign Stock
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowStockModal(false)
                    setSelectedAgent(null)
                    setStockFormData({ productId: "", quantity: "" })
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

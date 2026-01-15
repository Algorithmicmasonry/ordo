import { Order, OrderStatus, OrderSource, User, UserRole, Product, Agent } from '@prisma/client'

// Extended types with relations
export type OrderWithDetails = Order & {
  assignedTo: User | null
  agent: Agent | null
  items: Array<{
    id: string
    quantity: number
    price: number
    cost: number
    product: Product
  }>
  notes: Array<{
    id: string
    note: string
    isFollowUp: boolean
    followUpDate: Date | null
    createdAt: Date
  }>
}

export type SalesRepStats = {
  totalOrders: number
  deliveredOrders: number
  cancelledOrders: number
  postponedOrders: number
  deliveredPercentage: number
  cancelledPercentage: number
  totalRevenue: number
}

export type AdminStats = {
  totalOrders: number
  ordersToday: number
  totalRevenue: number
  totalProfit: number
  deliveredOrders: number
  cancelledOrders: number
  pendingOrders: number
  deliveryRate: number
}

// Order form submission type
export type OrderFormData = {
  customerName: string
  customerPhone: string
  customerWhatsapp?: string
  deliveryAddress: string
  state: string
  city: string
  source: OrderSource
  items: Array<{
    productId: string
    quantity: number
  }>
}

// Expense types
export type ExpenseType = 'ad_spend' | 'delivery' | 'shipping' | 'clearing' | 'other'

export { OrderStatus, OrderSource, UserRole }

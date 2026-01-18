import {
  Order,
  OrderStatus,
  OrderSource,
  User,
  UserRole,
  Product,
  Agent,
  OrderItem,
  OrderNote,
} from "@prisma/client";

// Extended types with relations
export type OrderWithDetails = Order & {
  assignedTo: User | null;
  agent: Agent | null;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    cost: number;
    product: Product;
  }>;
  notes: Array<{
    id: string;
    note: string;
    isFollowUp: boolean;
    followUpDate: Date | null;
    createdAt: Date;
  }>;
};

export type SalesRepStats = {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  postponedOrders: number;
  deliveredPercentage: number;
  cancelledPercentage: number;
  totalRevenue: number;
};

export type AdminStats = {
  totalOrders: number;
  ordersToday: number;
  totalRevenue: number;
  totalProfit: number;
  deliveredOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  deliveryRate: number;
};

// Order form submission type
export type OrderFormData = {
  customerName: string;
  customerPhone: string;
  customerWhatsapp?: string;
  deliveryAddress: string;
  state: string;
  city: string;
  source: OrderSource;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
};

// Expense types
export type ExpenseType =
  | "ad_spend"
  | "delivery"
  | "shipping"
  | "clearing"
  | "other";

// Dashboard types
export type TimePeriod = "today" | "week" | "month" | "year";

export interface DashboardStats {
  revenue: number;
  revenueChange: number;
  profit: number;
  profitChange: number;
  ordersCount: number;
  ordersChange: number;
  fulfillmentRate: number;
  cancelledRate: number;
}

export interface RevenueTrendData {
  label: string;
  current: number;
  previous: number;
}

export interface TopProduct {
  id: string;
  name: string;
  description: string | null;
  revenue: number;
  ordersCount: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  createdAt: Date;
  totalAmount: number;
  status: OrderStatus;
}

export { OrderStatus, OrderSource, UserRole };

export type OrderWithRelations = Order & {
  assignedTo: Pick<User, "id" | "name" | "email"> | null;
  agent: Pick<Agent, "id" | "name" | "location"> | null;
  items: (OrderItem & {
    product: Pick<Product, "id" | "name" | "price">;
  })[];
  notes: OrderNote[];
};

// ... other shared types and constants

# Admin Dashboard Data Fetching Implementation Plan

## Overview
Transform the admin dashboard from mock data to real database queries while maintaining performance and user experience.

## Current State Analysis


### Existing Infrastructure ✅
- **Server Actions**: `app/actions/stats.ts` with basic queries
- **Calculation Utils**: `lib/calculations.ts` for revenue/profit
- **Component Structure**: Properly separated Server/Client components
- **Database**: Prisma with complete schema

### Components Status
- **Server Components**: StatsCards, TopProducts, RecentOrders, DashboardShell
- **Client Components**: RevenueChart, DashboardHeader, Sidebar

## Architecture Decision: URL Search Params for Filtering

### Why URL Search Params?
1. **Server-Side Rendering**: Keep the page as a Server Component
2. **Shareable URLs**: Users can bookmark filtered views
3. **Browser History**: Back/forward buttons work naturally
4. **No Complex State**: Simpler than client-side state management
5. **SEO Friendly**: Search engines can index different time periods

### Implementation Pattern
```typescript
// app/dashboard/admin/page.tsx
export default async function AdminDashboardPage({ searchParams }) {
  const period = searchParams?.period || 'today' // 'today' | 'week' | 'month'

  // Fetch data based on period
  const data = await getDashboardData(period)

  // Pass data to components
  return <StatsCards data={data.stats} />
}
```

## Data Fetching Strategy

### Option 1: Centralized Data Fetching (RECOMMENDED) ⭐
**Fetch all data in the main page component, pass down as props**

**Pros:**
- Single source of truth
- Easy to parallelize queries with Promise.all()
- Better performance (one batch vs multiple queries)
- Simpler data flow (top-down)
- Easier to add loading states/error handling

**Cons:**
- Page component gets larger
- All data fetched even if not needed

**Implementation:**
```typescript
// app/dashboard/admin/page.tsx
const [stats, revenueData, topProducts, recentOrders] = await Promise.all([
  getAdminStats(period),
  getRevenueTrend(period),
  getTopProducts(period),
  getRecentOrders(5)
])
```

### Option 2: Colocated Data Fetching
**Each component fetches its own data**

**Pros:**
- Component independence
- Lazy loading possible

**Cons:**
- Multiple sequential queries (slower)
- Harder to coordinate loading states
- More database load

## Implementation Plan

### Phase 1: Time Period Utilities & Types

**Create**: `lib/date-utils.ts`
```typescript
export type TimePeriod = 'today' | 'week' | 'month'

export function getDateRange(period: TimePeriod) {
  const now = new Date()
  const startDate = new Date()

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0)
      break
    case 'week':
      startDate.setDate(now.getDate() - 7)
      startDate.setHours(0, 0, 0, 0)
      break
    case 'month':
      startDate.setDate(now.getDate() - 30)
      startDate.setHours(0, 0, 0, 0)
      break
  }

  return { startDate, endDate: now }
}

export function getPreviousPeriodRange(period: TimePeriod) {
  // For comparison data (previous week/month)
}
```

### Phase 2: Enhanced Server Actions

**Update**: `app/actions/stats.ts`

Add these new functions:

1. **getDashboardStats(period: TimePeriod)**
   - Total Revenue (for selected period)
   - Net Profit (revenue - costs - expenses)
   - Orders count (for selected period)
   - Fulfillment rate (delivered / total)
   - Comparison with previous period (% change)

2. **getRevenueTrend(period: TimePeriod)**
   - Daily breakdown for 'today' (hourly data)
   - Daily breakdown for 'week' (7 days)
   - Daily breakdown for 'month' (30 days)
   - Previous period data for comparison
   - Returns: `{ current: [...], previous: [...] }`

3. **getTopProducts(period: TimePeriod, limit: number = 3)**
   - Join: Order -> OrderItem -> Product
   - Filter: Delivered orders in date range
   - Aggregate: SUM(price * quantity) per product
   - Order by revenue DESC
   - Return: `{ name, description, revenue, ordersCount }`

4. **getRecentOrders(limit: number = 5)**
   - Order by createdAt DESC
   - Include: customer info, total amount, status
   - Format orderNumber for display
   - Map status to UI status (delivered/processing/shipped)

### Phase 3: Client Filter Component

**Create**: `app/dashboard/admin/_components/period-filter.tsx`
```typescript
'use client'

export function PeriodFilter({ currentPeriod }: { currentPeriod: string }) {
  const router = useRouter()
  const pathname = usePathname()

  const setPeriod = (period: string) => {
    const params = new URLSearchParams()
    params.set('period', period)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setPeriod('today')}
        className={currentPeriod === 'today' ? 'active' : ''}
      >
        Today
      </button>
      // ... other buttons
    </div>
  )
}
```

### Phase 4: Update Dashboard Components

**1. StatsCards Component**
```typescript
interface StatsCardsProps {
  stats: {
    revenue: number
    revenueChange: number // %
    profit: number
    profitChange: number // %
    ordersCount: number
    ordersChange: number // %
    fulfillmentRate: number
    cancelledRate: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  // Replace hardcoded data with props
}
```

**2. RevenueChart Component**
```typescript
interface RevenueChartProps {
  data: {
    current: Array<{ date: string, revenue: number }>
    previous: Array<{ date: string, revenue: number }>
  }
  className?: string
}

export function RevenueChart({ data, className }: RevenueChartProps) {
  // Use real data instead of chartData constant
}
```

**3. TopProducts Component**
```typescript
interface TopProductsProps {
  products: Array<{
    id: string
    name: string
    description: string | null
    revenue: number
    ordersCount: number
  }>
}

export function TopProducts({ products }: TopProductsProps) {
  // Map real product data
}
```

**4. RecentOrders Component**
```typescript
interface RecentOrdersProps {
  orders: Array<{
    id: string
    orderNumber: string
    customerName: string
    createdAt: Date
    totalAmount: number
    status: OrderStatus
  }>
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  // Format dates and amounts
  // Map OrderStatus to UI status styles
}
```

### Phase 5: Update Main Page

**Update**: `app/dashboard/admin/page.tsx`

```typescript
export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { period?: string }
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const period = (searchParams?.period || 'today') as TimePeriod

  // Parallel data fetching
  const [statsResult, revenueResult, productsResult, ordersResult] =
    await Promise.all([
      getDashboardStats(period),
      getRevenueTrend(period),
      getTopProducts(period, 3),
      getRecentOrders(5)
    ])

  // Handle errors
  if (!statsResult.success || !revenueResult.success) {
    // Show error state
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Administrator Dashboard"
        text="Monitor your business performance in real-time"
      />

      <div className="flex items-center justify-between mb-4">
        <PeriodFilter currentPeriod={period} />
        <Button>
          <Download className="size-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="space-y-8">
        <StatsCards stats={statsResult.data} />

        <div className="grid gap-6 lg:grid-cols-3">
          <RevenueChart data={revenueResult.data} className="lg:col-span-2" />
          <TopProducts products={productsResult.data} />
        </div>

        <RecentOrders orders={ordersResult.data} />
      </div>
    </DashboardShell>
  )
}
```

## Database Query Optimization

### Indexing Recommendations
```sql
-- Optimize order queries by date
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_delivered_at ON orders(delivered_at);
CREATE INDEX idx_orders_status ON orders(status);

-- Optimize order items for revenue calculations
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

### Query Performance Tips
1. Use Prisma's `select` to fetch only needed fields
2. Use `Promise.all()` for parallel queries
3. Consider caching with `unstable_cache()` for expensive queries
4. Add `revalidate` to page for ISR if needed

## Error Handling Strategy

### Graceful Degradation
```typescript
// If stats fail, show previous cached data or fallback UI
const statsResult = await getDashboardStats(period)
if (!statsResult.success) {
  return <ErrorState message="Failed to load statistics" />
}
```

### Loading States
```typescript
// Use React Suspense for streaming
<Suspense fallback={<StatsCardsSkeleton />}>
  <StatsCards stats={stats} />
</Suspense>
```

## Testing Strategy

### Test Cases
1. **Period Switching**: Verify data updates when period changes
2. **Empty States**: Handle when no data exists for period
3. **Large Datasets**: Test with thousands of orders
4. **Date Boundaries**: Test edge cases (midnight, month transitions)
5. **Comparison Data**: Verify % calculations are correct

## Implementation Order

1. ✅ Create date utilities (`lib/date-utils.ts`)
2. ✅ Add enhanced server actions (`app/actions/stats.ts`)
3. ✅ Create PeriodFilter component
4. ✅ Update StatsCards to accept props
5. ✅ Update RevenueChart to accept props
6. ✅ Update TopProducts to accept props
7. ✅ Update RecentOrders to accept props
8. ✅ Update main page with data fetching
9. ✅ Test all components with real data
10. ✅ Add error handling and loading states

## Performance Benchmarks

### Target Metrics
- Page load time: < 1 second
- Time to Interactive: < 2 seconds
- Total query time: < 500ms
- Database queries: 4 (parallelized)

### Monitoring
```typescript
// Add timing logs in development
console.time('Dashboard Data Fetch')
const data = await getDashboardStats(period)
console.timeEnd('Dashboard Data Fetch')
```

## Future Enhancements

1. **Real-time Updates**: WebSocket for live order updates
2. **Export Functionality**: Generate PDF/CSV reports
3. **Date Range Picker**: Custom date range selection
4. **Comparison Mode**: Side-by-side period comparison
5. **Drill-down**: Click stats to see detailed views
6. **Caching**: Redis for frequently accessed data
7. **Pagination**: For recent orders table
8. **Search**: Filter orders/products on dashboard

## Type Definitions

**Create**: `lib/types.ts` (or add to existing)
```typescript
export type TimePeriod = 'today' | 'week' | 'month'

export interface DashboardStats {
  revenue: number
  revenueChange: number
  profit: number
  profitChange: number
  ordersCount: number
  ordersChange: number
  fulfillmentRate: number
  cancelledRate: number
}

export interface RevenueTrendData {
  date: string
  revenue: number
}

export interface TopProduct {
  id: string
  name: string
  description: string | null
  revenue: number
  ordersCount: number
}

export interface RecentOrder {
  id: string
  orderNumber: string
  customerName: string
  createdAt: Date
  totalAmount: number
  status: OrderStatus
}
```

## Summary

**Recommended Approach**: Centralized data fetching with URL search params

**Key Benefits**:
- Server-side rendering maintained
- Single batch of parallelized queries
- Simple component props interface
- Shareable filtered URLs
- Browser-native navigation

**Implementation Time Estimate**: 4-6 hours
- Phase 1: 30 mins
- Phase 2: 2 hours (most complex)
- Phase 3: 30 mins
- Phase 4: 1.5 hours
- Phase 5: 1 hour
- Testing: 30 mins

**Next Steps**: Start with Phase 1 (date utilities) and Phase 2 (server actions), as they provide the foundation for all other components.

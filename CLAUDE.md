# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ordo is an e-commerce CRM and order management system built with Next.js 16, focusing on managing orders, inventory, sales representatives, agents, expenses, and profit tracking.

## Commands

### Development
```bash
pnpm dev          # Start development server on http://localhost:3000
pnpm build        # Build production bundle
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Database (Prisma)
```bash
pnpm db:generate  # Generate Prisma Client (run after schema changes)
pnpm db:migrate   # Create and apply migrations
pnpm db:push      # Push schema to database (development only)
pnpm db:seed      # Seed database with initial data
pnpm db:studio    # Open Prisma Studio GUI
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router (React 19)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with email/password
- **UI**: ShadcnUI + Tailwind CSS 4
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation

### Database Schema Overview

The application uses Prisma with PostgreSQL. Key models:

- **User**: Role-based (ADMIN, SALES_REP, INVENTORY_MANAGER) with Better Auth integration
- **Product**: Inventory tracking with soft deletes, opening/current stock, and cost/price separation
- **Agent**: External delivery agents (no login) managed by admins and sales reps
- **AgentStock**: Tracks product inventory assigned to specific agents
- **Order**: Customer orders with status tracking (NEW → CONFIRMED → DISPATCHED → DELIVERED/CANCELLED/POSTPONED)
- **OrderItem**: Line items with price/cost captured at order time
- **OrderNote**: Communication tracking with follow-up date support
- **Expense**: Product-specific and general expenses (ad spend, delivery, shipping, clearing)
- **SystemSetting**: Key-value store for system state (e.g., round-robin index)

### Application Structure

**App Router Layout:**
- `/app/page.tsx` - Landing page
- `/app/login` - Authentication
- `/app/order-form` - Embedded public order form
- `/app/dashboard` - Protected dashboard root (redirects based on role)
  - `/dashboard/admin` - Admin dashboard with full analytics
  - `/dashboard/sales-rep` - Sales rep dashboard (own orders only)
  - `/dashboard/inventory` - Inventory management views
- `/app/admin/products` - Product management
- `/app/admin/agents` - Agent management

**Dashboard Routing:**
The `/app/dashboard/page.tsx` acts as a role-based router:
- Checks session and redirects to appropriate dashboard based on user role
- ADMIN → `/dashboard/admin`
- SALES_REP → `/dashboard/sales-rep`
- INVENTORY_MANAGER → `/dashboard/inventory`
- All dashboard routes are protected via `app/dashboard/layout.tsx`

**Server Actions Pattern:**
All data mutations use Next.js Server Actions in `app/actions/`:
- `orders.ts` - Order CRUD, status updates, agent assignment
- `products.ts` - Product management, inventory updates
- `agents.ts` - Agent and agent stock management
- `expenses.ts` - Expense tracking
- `stats.ts` - Dashboard statistics and analytics

**Core Libraries:**
- `lib/auth.ts` - Better Auth configuration with role/isActive fields
- `lib/auth-client.ts` - Client-side auth hooks
- `lib/db.ts` - Prisma client singleton
- `lib/round-robin.ts` - Sales rep round-robin order assignment
- `lib/calculations.ts` - Revenue, profit, and performance calculations
- `lib/types.ts` - Shared TypeScript types
- `lib/utils.ts` - cn() utility for Tailwind class merging

**UI Components:**
- `components/ui/` - Radix UI primitives (shadcn/ui style)
- `components/theme-provider.tsx` - Dark mode support via next-themes
- `components/mode-toggle.tsx` - Dark/light mode toggle button

**Admin Dashboard Structure:**
The admin dashboard (`app/dashboard/admin/`) follows a modular component architecture:

- `page.tsx` - Main dashboard page with role check (ADMIN only)
- `_components/` - Reusable dashboard components (exported via index.ts):
  - `dashboard-shell.tsx` - Layout wrapper with sidebar and main content area
  - `sidebar.tsx` - Navigation sidebar with route links (client component)
    - Routes: Dashboard, Orders, Inventory, Sales Reps, Expenses, Finance & Accounting, User Management, Agents
    - Active route highlighting using `usePathname()`
    - User profile display at bottom
  - `dashboard-header.tsx` - Page header with search, notifications, help, and theme toggle (client component)
  - `stats-cards.tsx` - Four KPI cards (Total Revenue, Net Profit, Orders Today, Fulfillment %)
  - `revenue-chart.tsx` - Recharts area chart showing current vs previous week (client component)
  - `top-products.tsx` - Top 3 selling products with revenue
  - `recent-orders.tsx` - Table of recent transactions with status badges

**Dashboard Component Patterns:**
- Components in `_components/` are prefixed with underscore (Next.js convention for non-routable folders)
- Mix of Server and Client Components:
  - Server: `dashboard-shell.tsx`, `stats-cards.tsx`, `top-products.tsx`, `recent-orders.tsx`
  - Client: `sidebar.tsx`, `dashboard-header.tsx`, `revenue-chart.tsx` (need interactivity/hooks)
- All components currently use placeholder/mock data - ready to be connected to real data via server actions
- Components are re-exported from `index.ts` for cleaner imports

### Key Architectural Patterns

**1. Round-Robin Order Assignment**
When orders are created via the public form, they're automatically assigned to the next sales rep in rotation using `getNextSalesRep()` from `lib/round-robin.ts`. The current index is stored in the `SystemSetting` table.

**2. Inventory Management**
- Products have both `openingStock` and `currentStock` fields
- Inventory is deducted when orders are marked as DELIVERED via `updateInventoryOnDelivery()`
- Agent stock is tracked separately in the `AgentStock` table with defective/missing counts
- Products use soft deletes (`isDeleted` flag, `deletedAt` timestamp)

**3. Financial Calculations**
- Revenue: Only from DELIVERED orders (sum of item price × quantity)
- Profit: Revenue - (Cost + Expenses)
- Cost is captured at order time in `OrderItem.cost` to handle price changes
- Expenses can be product-specific or general

**4. Role-Based Access Control**
- Authentication via Better Auth with custom fields (role, isActive)
- Protected routes use `auth.api.getSession()` in layouts
- Server actions enforce authorization:
  - Sales reps can only access their own orders (`assignedToId`)
  - Admins have full access
- Dashboard layouts are in `app/dashboard/layout.tsx` with session checking

**5. Data Revalidation**
Server actions use `revalidatePath()` to update cached data after mutations. Common paths:
- `/dashboard` - Revalidate after order updates
- `/admin` - Revalidate after admin actions

### Environment Setup

Required `.env` variables:
```
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."  # For session encryption
```

### Type Safety

- Path aliases: `@/*` maps to project root (configured in tsconfig.json)
- Prisma generates types automatically - run `pnpm db:generate` after schema changes
- Better Auth types are inferred: `Session` type exported from `lib/auth.ts`
- Form schemas use Zod validation

### Component Patterns

**Dashboard Components:**
Dashboard components follow Next.js 13+ best practices:
- Separate Server Components (data fetching) from Client Components (interactivity)
- Use `"use client"` directive only when needed (hooks, event handlers, browser APIs)
- Components in `_components/` folders are co-located with their pages
- Export components via barrel file (`index.ts`) for cleaner imports
- Example import: `import { DashboardShell, StatsCards } from "./_components"`

**Admin Dashboard Layout:**
```
DashboardShell (layout wrapper)
├── Sidebar (client - navigation with active state)
└── Main Content Area
    ├── DashboardHeader (client - search, notifications, theme toggle)
    ├── Filters (time period selection - to be made interactive)
    ├── StatsCards (server - KPI metrics)
    ├── RevenueChart (client - Recharts visualization)
    ├── TopProducts (server - product performance)
    └── RecentOrders (server - order table)
```

**Current Implementation Status:**
- UI structure is complete with placeholder data
- All dashboard components are in place but need to be connected to real data
- Server actions exist for data operations but need integration with dashboard components
- Time period filters are UI-only (need state management and data fetching integration)

**Server Actions:**
- Always marked with `"use server"` directive
- Return structured responses: `{ success: boolean, data?, error? }`
- Include proper authorization checks based on userRole
- Use Prisma transactions for multi-step operations
- Call `revalidatePath()` after mutations to update cached data

**Styling:**
- Tailwind CSS 4 with PostCSS
- Use `cn()` utility from `lib/utils.ts` for conditional classes
- Components follow shadcn/ui conventions
- Consistent use of `text-primary`, `text-foreground`, `text-muted-foreground` for theming
- Icon library: `lucide-react`
- Component Library : ShadcnUI

#Always reference the database schema before making changes to the codebase

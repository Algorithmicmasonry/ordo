# Ordo CRM

A modern e-commerce CRM and order management system built with Next.js 16, designed for managing orders, inventory, sales teams, delivery agents, and financial tracking.

## Features

- **Order Management**: Complete order lifecycle from creation to delivery with status tracking
- **Smart Assignment**: Automatic round-robin distribution of orders to sales representatives
- **Inventory Control**: Real-time stock tracking with agent-specific inventory management
- **Role-Based Access**: Three-tier access control (Admin, Sales Rep, Inventory Manager)
- **Financial Analytics**: Revenue tracking, profit calculations, and expense management
- **Performance Dashboards**: Real-time analytics with period comparisons and trend visualization
- **Agent Management**: Track external delivery agents and their assigned inventory
- **Order Communication**: Built-in note system with follow-up date tracking

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **UI Library**: [React 19](https://react.dev/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- **Charts**: [Recharts](https://recharts.org/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## Prerequisites

- Node.js 20.x or higher
- pnpm 8.x or higher
- PostgreSQL database

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd ordo
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ordo"
BETTER_AUTH_SECRET="your-secret-key-here"
```

Generate a secure secret for `BETTER_AUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 4. Set up the database

```bash
# Generate Prisma Client
pnpm db:generate

# Run migrations
pnpm db:migrate

# (Optional) Seed the database with initial data
pnpm db:seed
```

### 5. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

### Development
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Database
- `pnpm db:generate` - Generate Prisma Client
- `pnpm db:migrate` - Create and apply migrations
- `pnpm db:push` - Push schema changes (development)
- `pnpm db:seed` - Seed database with initial data
- `pnpm db:studio` - Open Prisma Studio GUI

## Project Structure

```
ordo/
├── app/
│   ├── actions/           # Server actions for data mutations
│   ├── api/              # API routes
│   ├── dashboard/        # Role-based dashboards
│   │   ├── admin/       # Admin dashboard & pages
│   │   ├── sales-rep/   # Sales rep dashboard
│   │   └── inventory/   # Inventory manager dashboard
│   ├── login/           # Authentication page
│   └── order-form/      # Public order submission form
├── components/
│   └── ui/              # Reusable UI components (shadcn/ui)
├── lib/
│   ├── auth.ts          # Authentication configuration
│   ├── db.ts            # Prisma client
│   ├── calculations.ts  # Revenue/profit calculations
│   ├── round-robin.ts   # Order assignment logic
│   ├── date-utils.ts    # Date range utilities
│   ├── types.ts         # TypeScript type definitions
│   └── utils.ts         # Utility functions
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeding script
└── public/              # Static assets
```

## Key Concepts

### User Roles

1. **Admin**: Full system access, analytics, user management
2. **Sales Rep**: Manage assigned orders, view personal performance
3. **Inventory Manager**: Stock management, inventory tracking

### Order Workflow

```
NEW → CONFIRMED → DISPATCHED → DELIVERED
                            ↓
                      CANCELLED/POSTPONED
```

### Round-Robin Assignment

Orders submitted via the public form are automatically assigned to sales representatives in a rotating fashion, ensuring fair distribution of workload.

### Inventory Management

- **Global Stock**: Central inventory tracking
- **Agent Stock**: Product quantities assigned to delivery agents
- **Soft Deletes**: Products can be archived without losing historical data
- **Automatic Deduction**: Stock updates when orders are marked as delivered

### Financial Tracking

- **Revenue**: Calculated from delivered orders only
- **Profit**: Revenue - (Product Cost + Expenses)
- **Expenses**: Track ad spend, delivery costs, shipping, and other expenses
- **Period Comparison**: View trends across different time periods

## Database Schema

Key models include:
- **User**: System users with role-based access
- **Product**: Inventory items with cost/price tracking
- **Order**: Customer orders with status management
- **OrderItem**: Individual line items with snapshot pricing
- **Agent**: External delivery agents
- **AgentStock**: Inventory assigned to agents
- **Expense**: Business expenses (product-specific or general)
- **OrderNote**: Communication tracking with follow-ups

See `prisma/schema.prisma` for the complete schema.

## Development Guidelines

- Always run `pnpm db:generate` after modifying the Prisma schema
- Server actions should return `{ success: boolean, data?, error? }`
- Use `revalidatePath()` after mutations to update cached data
- Follow the component organization pattern with `_components` folders
- Separate Server Components (data fetching) from Client Components (interactivity)

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  ChartPie,
  HatGlasses,
  LayoutDashboard,
  PackageOpen,
  Rocket,
  Settings,
  ShoppingBag,
  Users,
  UsersRound,
  WalletCards
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard/admin",
  },
  {
    label: "Orders",
    icon: ShoppingBag,
    href: "/dashboard/admin/orders",
  },
  {
    label: "Inventory",
    icon: PackageOpen,
    href: "/dashboard/admin/inventory",
  },
  {
    label : "Sales Reps",
    icon: UsersRound,
    href: "/dashboard/admin/sales-reps",
  },
  {
    label: "Expenses",
    icon: WalletCards,
    href: "/dashboard/admin/expenses",
  },
  {
    label: "Finance & Accounting ",
    icon: ChartPie,
    href: "/dashboard/admin/reports",
  },
  {
    label: "User Managment",
    icon: Users,
    href: "/dashboard/admin/users",
  }, 
  {
    label: "Agents",
    icon:  HatGlasses,
    href: "/dashboard/admin/agents",
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white">
          <Rocket className="size-5" />
        </div>
        <div>
          <h1 className="text-base font-bold leading-none">Ordo CRM</h1>
          <p className="text-xs text-muted-foreground mt-1">Management System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === route.href
                ? "bg-primary/10 text-primary"
                : "text-foreground/80 hover:bg-primary hover:text-primary-foreground"
            )}
          >
            <route.icon className="size-5" />
            <span>{route.label}</span>
          </Link>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-2">
          <Avatar className="size-8">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>AH</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">Alex Henderson</p>
            <p className="text-[10px] text-muted-foreground truncate">System Admin</p>
          </div>
          <Settings className="size-4 text-muted-foreground cursor-pointer hover:text-foreground" />
        </div>
      </div>
    </aside>
  );
}
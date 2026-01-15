"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ChartPie,
  HatGlasses,
  LayoutDashboard,
  PackageOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Rocket,
  Settings,
  ShoppingBag,
  Users,
  UsersRound,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
    label: "Sales Reps",
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
    icon: HatGlasses,
    href: "/dashboard/admin/agents",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border bg-card flex flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "p-6 flex items-center",
          isCollapsed ? "justify-center flex-col gap-3" : "gap-3"
        )}
      >
        <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white">
          <Rocket className="size-5" />
        </div>

        {!isCollapsed && (
          <div>
            <h1 className="text-base font-bold leading-none">Ordo CRM</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Management System
            </p>
          </div>
        )}

        <div
          className={cn("px-2 pb-2", isCollapsed && "flex justify-center px-2")}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="size-6 text-primary" />
            ) : (
              <PanelLeftClose className="size-6 text-primary" />
            )}
          </Button>
        </div>
      </div>

      {/* Toggle Button */}

      {/* Navigation */}
      <TooltipProvider delayDuration={0}>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {routes.map((route) => {
            const isActive = pathname === route.href;
            const linkContent = (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/80 hover:bg-primary hover:text-primary-foreground",
                  isCollapsed && "justify-center"
                )}
              >
                <route.icon className="size-5 shrink-0" />
                {!isCollapsed && <span>{route.label}</span>}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={route.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{route.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>
      </TooltipProvider>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div
          className={cn(
            "flex items-center gap-3 p-2",
            isCollapsed && "flex-col gap-2"
          )}
        >
          <Avatar className="size-8 shrink-0">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>AH</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">Alex Henderson</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  System Admin
                </p>
              </div>
              <Settings className="size-4 text-muted-foreground cursor-pointer hover:text-foreground" />
            </>
          )}
          {isCollapsed && (
            <Settings className="size-4 text-muted-foreground cursor-pointer hover:text-foreground" />
          )}
        </div>
      </div>
    </aside>
  );
}

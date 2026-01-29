"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, getInitials, formatRole } from "@/lib/utils";
import {
  Package,
  Users,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getCurrentUser } from "@/app/actions/user";
import type { UserRole } from "@prisma/client";

const routes = [
  {
    label: "Inventory",
    icon: Package,
    href: "/dashboard/inventory",
  },
  {
    label: "Agent Stock",
    icon: Users,
    href: "/dashboard/inventory/agents",
  },
  {
    label: "Reports",
    icon: BarChart3,
    href: "/dashboard/inventory/reports",
  },
];

interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image: string | null;
}

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border bg-card flex flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "p-6 flex items-center",
          isCollapsed ? "justify-center flex-col gap-3" : "gap-3",
        )}
      >
        <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white">
          <Rocket className="size-5" />
        </div>

        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold leading-none">Ordo CRM</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Inventory Manager
            </p>
          </div>
        )}

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
                  isCollapsed && "justify-center",
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
        {isLoading ? (
          <div className="flex items-center gap-3 p-2 animate-pulse">
            <div className="size-8 rounded-full bg-muted" />
            {!isCollapsed && (
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-24" />
                <div className="h-2 bg-muted rounded w-16" />
              </div>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "flex items-center gap-3 p-2",
              isCollapsed && "flex-col gap-2",
            )}
          >
            <Avatar className="size-8 shrink-0">
              <AvatarImage src={user?.image || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {user?.name ? getInitials(user.name) : "??"}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && user && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {formatRole(user.role)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

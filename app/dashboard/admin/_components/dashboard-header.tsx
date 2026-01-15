"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Bell, HelpCircle } from "lucide-react";

interface DashboardHeaderProps {
  heading: string;
  text?: string;
}

export function DashboardHeader({ heading, text }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">{heading}</h2>
          {text && <p className="text-muted-foreground">{text}</p>}
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search data..." className="pl-10" />
          </div>

          <Button variant="ghost" size="icon">
            <Bell className="size-5" />
          </Button>

          <Button variant="ghost" size="icon">
            <HelpCircle className="size-5" />
          </Button>

          <ModeToggle/>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 items-center justify-center rounded-lg bg-muted p-1 min-w-75">
            <button className="flex h-full grow items-center justify-center rounded-lg px-4 bg-background shadow-sm text-primary text-sm font-semibold">
              Today
            </button>
            <button className="flex h-full grow items-center justify-center rounded-lg px-4 text-muted-foreground text-sm font-medium hover:text-foreground">
              This Week
            </button>
            <button className="flex h-full grow items-center justify-center rounded-lg px-4 text-muted-foreground text-sm font-medium hover:text-foreground">
              This Month
            </button>
          </div>
        </div>

        <Button>
          <Download className="size-4 mr-2" />
          Export Report
        </Button>
      </div>
    </div>
  );
}

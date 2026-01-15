"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Bell, HelpCircle } from "lucide-react";

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
          {text && <p className="text-foreground/90">{text}</p>}
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          {/* <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/80" />
            <Input placeholder="Search data..." className="pl-10" />
          </div> */}

          <Button variant="ghost" size="icon">
            <Bell className="size-5" />
          </Button>

          <Button variant="ghost" size="icon">
            <HelpCircle className="size-5" />
          </Button>

          <ModeToggle/>
        </div>
      </div>

   
    </div>
  );
}

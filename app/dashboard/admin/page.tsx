import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "./_components";
import { DashboardHeader } from "./_components";
import { StatsCards } from "./_components";
import { RevenueChart } from "./_components";
import { TopProducts } from "./_components";
import { RecentOrders } from "./_components";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Administrator Dashboard"
        text="Monitor your business performance in real-time"
      />
      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 items-center justify-center rounded-lg bg-card p-1 min-w-75 gap-2">
            <button className="flex h-full grow items-center justify-center rounded-lg px-4 bg-foreground shadow-sm text-primary text-sm font-semibold cursor-pointer">
              Today
            </button>
            <button className="flex h-full grow items-center justify-center rounded-lg px-4 text-foreground text-sm font-medium hover:bg-background dark:hover:bg-foreground/80 dark:hover:text-primary hover:shadow-sm cursor-pointer">
              This Week
            </button>
            <button className="flex h-full grow items-center justify-center rounded-lg px-4 text-foreground text-sm font-medium hover:bg-background dark:hover:bg-foreground/80 dark:hover:text-primary hover:shadow-sm cursor-pointer">
              This Month
            </button>
          </div>
        </div>

        <Button>
          <Download className="size-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="space-y-8">
        <StatsCards />

        <div className="grid gap-6 lg:grid-cols-3">
          <RevenueChart className="lg:col-span-2" />
          <TopProducts />
        </div>

        <RecentOrders />
      </div>
    </DashboardShell>
  );
}

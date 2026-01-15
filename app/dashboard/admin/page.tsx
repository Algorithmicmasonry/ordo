import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "./_components";
import { DashboardHeader } from "./_components";
import { StatsCards } from "./_components";
import { RevenueChart } from "./_components";
import { TopProducts } from "./_components";
import { RecentOrders } from "./_components";

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
        heading="Business Overview"
        text="Monitor your business performance in real-time"
      />

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

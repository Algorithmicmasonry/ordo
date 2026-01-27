import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardHeader } from "../_components";
import { AgentsStats, AgentsTable } from "./_components";
import { getAgentStats, getAgentsWithMetrics, getUniqueZones } from "./actions";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default async function AdminAgentsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch data in parallel
  const [statsResponse, agentsResponse, zonesResponse] = await Promise.all([
    getAgentStats(),
    getAgentsWithMetrics(),
    getUniqueZones(),
  ]);

  // Handle errors
  if (!statsResponse.success || !agentsResponse.success) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          heading="Agent Logistics & Performance Directory"
          text="Manage and monitor external delivery agents and their performance metrics across regions"
        />
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {statsResponse.error || agentsResponse.error || "Failed to load agent data"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Agent Logistics & Performance Directory"
        text="Manage and monitor external delivery agents and their performance metrics across regions"
      />

      {/* Export Button */}
      <div className="flex items-center justify-end">
        <Button>
          <Download className="size-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      {statsResponse.data && (
        <AgentsStats
          totalAgents={statsResponse.data.totalAgents}
          activeAgents={statsResponse.data.activeAgents}
          totalStockValue={statsResponse.data.totalStockValue}
          totalDefectiveValue={statsResponse.data.totalDefectiveValue}
          totalMissingValue={statsResponse.data.totalMissingValue}
          pendingDeliveries={statsResponse.data.pendingDeliveries}
        />
      )}

      {/* Agents Table */}
      {agentsResponse.data && (
        <AgentsTable
          agents={agentsResponse.data}
          zones={zonesResponse.data || []}
        />
      )}
    </div>
  );
}

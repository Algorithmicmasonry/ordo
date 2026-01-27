"use client";

import { useState } from "react";
import { Agent, AgentStock, Product } from "@prisma/client";
import { AgentProfileHeader } from "./agent-profile-header";
import { AgentStatsCards } from "./agent-stats-cards";
import { AgentPerformanceChart } from "./agent-performance-chart";
import { AgentStockTable } from "./agent-stock-table";
import { AgentOrdersTable } from "./agent-orders-table";
import { AgentFinancialSummary } from "./agent-financial-summary";
import { SettlementDialog } from "../../_components/settlement-dialog";
import { ReconcileStockModal } from "../../_components/reconcile-stock-modal";
import { AssignStockModal } from "../../_components/assign-stock-modal";
import { EditAgentModal } from "../../_components/edit-agent-modal";
import { recordSettlement } from "../actions";
import { reconcileAgentStock } from "@/app/actions/agents";

type TimePeriod = "week" | "month" | "year";

interface OrderStats {
  total: number;
  delivered: number;
  cancelled: number;
  inTransit: number;
  successRate: number;
  revenue: number;
}

interface ChartDataPoint {
  date: string;
  delivered: number;
  failed: number;
}

interface Settlement {
  id: string;
  stockValue: number;
  cashCollected: number;
  cashReturned: number;
  adjustments: number;
  balanceDue: number;
  notes: string | null;
  settledAt: Date;
}

interface AgentWithRelations extends Agent {
  stock: (AgentStock & { product: Product })[];
  orders: any[];
  settlements: Settlement[];
}

interface AgentDetailsClientProps {
  agent: AgentWithRelations;
  currentStats: OrderStats;
  previousStats: OrderStats;
  stockValue: number;
  outstandingBalance: number;
  pendingDeliveries: number;
  recentSettlements: Settlement[];
  chartData: ChartDataPoint[];
  recentOrders: any[];
  period: TimePeriod;
}

export function AgentDetailsClient({
  agent,
  currentStats,
  previousStats,
  stockValue,
  outstandingBalance,
  pendingDeliveries,
  recentSettlements,
  chartData,
  recentOrders,
  period,
}: AgentDetailsClientProps) {
  const [showSettlementDialog, setShowSettlementDialog] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [showAssignStockModal, setShowAssignStockModal] = useState(false);
  const [showEditAgentModal, setShowEditAgentModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<
    (AgentStock & { product: Product; agent: { name: string } }) | null
  >(null);

  const handleReconcileClick = (stock: AgentStock & { product: Product }) => {
    setSelectedStock({
      ...stock,
      agent: { name: agent.name },
    });
    setShowReconcileModal(true);
  };

  return (
    <div className="space-y-6">
      <AgentProfileHeader
        agent={agent}
        period={period}
        onAssignStock={() => setShowAssignStockModal(true)}
        onEdit={() => setShowEditAgentModal(true)}
      />

      <AgentStatsCards
        currentStats={currentStats}
        previousStats={previousStats}
        stockValue={stockValue}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <AgentPerformanceChart data={chartData} period={period} />
        <div className="lg:col-span-2">
          <AgentStockTable
            stock={agent.stock}
            onReconcile={handleReconcileClick}
          />
        </div>
      </div>

      <AgentFinancialSummary
        stockValue={stockValue}
        outstandingBalance={outstandingBalance}
        recentSettlements={recentSettlements}
        onRecordSettlement={() => setShowSettlementDialog(true)}
      />

      <AgentOrdersTable orders={recentOrders} />

      {/* Settlement Dialog */}
      <SettlementDialog
        open={showSettlementDialog}
        onOpenChange={setShowSettlementDialog}
        agent={agent}
        stockValue={stockValue}
        pendingDeliveries={pendingDeliveries}
        lastSettlement={recentSettlements[0] || null}
        onSubmit={recordSettlement}
      />

      {/* Reconcile Stock Modal */}
      <ReconcileStockModal
        open={showReconcileModal}
        onOpenChange={setShowReconcileModal}
        agentStock={selectedStock}
        onReconcile={reconcileAgentStock}
      />

      {/* Assign Stock Modal */}
      <AssignStockModal
        open={showAssignStockModal}
        onOpenChange={setShowAssignStockModal}
        agent={agent}
      />

      {/* Edit Agent Modal */}
      <EditAgentModal
        open={showEditAgentModal}
        onOpenChange={setShowEditAgentModal}
        agent={agent}
      />
    </div>
  );
}

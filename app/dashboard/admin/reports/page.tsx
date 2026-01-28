import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";
import type { TimePeriod } from "@/lib/types";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardHeader } from "../_components";
import { FinancialOverview, SalesRepFinance, AgentCostAnalysis, ProfitLossStatement, ProductProfitability } from "./_components";
import { getFinancialOverview, getSalesRepFinance, getAgentCostAnalysis, getProfitLossStatement, getProductProfitability } from "./actions";

interface PageProps {
  searchParams: Promise<{ period?: string; startDate?: string; endDate?: string }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  // Authentication check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get params from search params
  const query = await searchParams;
  const period = (query.period || "month") as TimePeriod;
  const startDate = query.startDate ? new Date(query.startDate) : undefined;
  const endDate = query.endDate ? new Date(query.endDate) : undefined;

  // Fetch financial overview data
  const financialData = await getFinancialOverview(period, startDate, endDate);

  // Fetch sales rep finance data
  const salesRepData = await getSalesRepFinance(period, startDate, endDate);

  // Fetch agent cost analysis data
  const agentCostData = await getAgentCostAnalysis(period, startDate, endDate);

  // Fetch profit and loss statement data
  const profitLossData = await getProfitLossStatement(period, startDate, endDate);

  // Fetch product profitability data
  const productProfitData = await getProductProfitability(period, startDate, endDate);

  if (!financialData.success || !financialData.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">
            Failed to Load Reports
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {financialData.error || "Unable to fetch financial data"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <DashboardHeader
        heading="Financial Reports"
        text="Comprehensive financial analytics and performance tracking"
      />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Financial Overview</TabsTrigger>
          <TabsTrigger value="sales-rep">Sales Rep Finance</TabsTrigger>
          <TabsTrigger value="agent-costs">Agent Costs</TabsTrigger>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="product">Product Profitability</TabsTrigger>
        </TabsList>

        {/* Financial Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <FinancialOverview data={financialData.data} period={period} />
        </TabsContent>

        {/* Sales Rep Financial Performance Tab */}
        <TabsContent value="sales-rep" className="mt-6">
          {salesRepData.success && salesRepData.data ? (
            <SalesRepFinance data={salesRepData.data} period={period} />
          ) : (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-muted-foreground">
                  Failed to Load Sales Rep Data
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {salesRepData.error || "Unable to fetch sales rep finance data"}
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Agent Cost Analysis Tab */}
        <TabsContent value="agent-costs" className="mt-6">
          {agentCostData.success && agentCostData.data ? (
            <AgentCostAnalysis data={agentCostData.data} period={period} />
          ) : (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-muted-foreground">
                  Failed to Load Agent Cost Data
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {agentCostData.error || "Unable to fetch agent cost analysis data"}
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Profit & Loss Tab */}
        <TabsContent value="profit-loss" className="mt-6">
          {profitLossData.success && profitLossData.data ? (
            <ProfitLossStatement data={profitLossData.data} period={period} />
          ) : (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-muted-foreground">
                  Failed to Load P&L Statement
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {profitLossData.error || "Unable to fetch profit and loss data"}
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Product Profitability Tab */}
        <TabsContent value="product" className="mt-6">
          {productProfitData.success && productProfitData.data ? (
            <ProductProfitability data={productProfitData.data} period={period} />
          ) : (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-muted-foreground">
                  Failed to Load Product Profitability
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {productProfitData.error || "Unable to fetch product profitability data"}
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

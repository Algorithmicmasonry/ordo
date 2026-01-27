import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DashboardHeader } from "../_components";
import { FinancialOverview } from "./_components";
import { getFinancialOverview } from "./actions";
import type { TimePeriod } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  // Authentication check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get period from search params
  const query = await searchParams;
  const period = (query.period || "month") as TimePeriod;

  // Fetch financial overview data
  const financialData = await getFinancialOverview(period);

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
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-muted-foreground">
                Sales Rep Financial Performance
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                This tab will show sales representative financial metrics
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Agent Cost Analysis Tab */}
        <TabsContent value="agent-costs" className="mt-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-muted-foreground">
                Agent Cost Analysis
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                This tab will show agent cost breakdown and analysis
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Profit & Loss Tab */}
        <TabsContent value="profit-loss" className="mt-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-muted-foreground">
                Profit & Loss Statement
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                This tab will show detailed profit and loss statements
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Product Profitability Tab */}
        <TabsContent value="product" className="mt-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-muted-foreground">
                Product Profitability
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                This tab will show product-level profitability metrics
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

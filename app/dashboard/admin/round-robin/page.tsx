import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RoundRobinClient } from "./_components";
import { getCurrentRoundRobinIndex } from "@/lib/round-robin";

export const metadata = {
  title: "Round-Robin Management | Ordo CRM",
  description: "Configure the lead distribution sequence for your sales team",
};

async function getRoundRobinData() {
  // Get current round-robin index
  const currentIndex = await getCurrentRoundRobinIndex();

  // Fetch all sales reps with their orders count
  const salesReps = await db.user.findMany({
    where: {
      role: "SALES_REP",
    },
    include: {
      orders: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Separate active and excluded reps
  const activeSalesReps = salesReps.filter((rep) => rep.isActive);
  const excludedSalesReps = salesReps.filter((rep) => !rep.isActive);

  // Calculate next rep in line
  const nextRepIndex = currentIndex % activeSalesReps.length;
  const nextRep = activeSalesReps[nextRepIndex] || null;

  // Calculate stats for each rep
  const repsWithStats = salesReps.map((rep) => ({
    ...rep,
    totalOrders: rep.orders.length,
    deliveredOrders: rep.orders.filter((o) => o.status === "DELIVERED").length,
    // Determine online status (for demo purposes - in production, use real-time data)
    isOnline: rep.isActive,
  }));

  return {
    salesReps: repsWithStats,
    activeSalesReps: repsWithStats.filter((r) => r.isActive),
    excludedSalesReps: repsWithStats.filter((r) => !r.isActive),
    currentIndex,
    nextRep: nextRep
      ? repsWithStats.find((r) => r.id === nextRep.id) || null
      : null,
    totalActive: activeSalesReps.length,
    totalExcluded: excludedSalesReps.length,
    totalInactive: 0, // Could be expanded to track leave/vacation status
  };
}

export default async function RoundRobinPage() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((m) => m.headers()),
  });

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const data = await getRoundRobinData();

  return <RoundRobinClient {...data} />;
}

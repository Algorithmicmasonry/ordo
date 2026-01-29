import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface CustomersHeaderProps {
  totalCustomers: number;
}

export function CustomersHeader({ totalCustomers }: CustomersHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-4xl font-black leading-tight tracking-tight">
          My Customers
        </h1>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-base">
            Manage and contact your assigned customer accounts
          </p>
          <Badge variant="secondary" className="text-xs italic">
            Read-only View
          </Badge>
        </div>
      </div>
      <Badge
        variant="outline"
        className="bg-card border px-4 py-2 text-sm font-medium w-fit"
      >
        <Users className="size-4 mr-2" />
        Total Assigned: {totalCustomers}
      </Badge>
    </div>
  );
}

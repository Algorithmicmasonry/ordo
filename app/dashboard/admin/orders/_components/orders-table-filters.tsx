"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrdersTableFiltersProps {
  locations: { value: string; label: string }[];
  isPending: boolean;
  onFilterChange: (key: string, value: string) => void;
}

export function OrdersTableFilters({
  locations,
  isPending,
  onFilterChange,
}: OrdersTableFiltersProps) {
  const searchParams = useSearchParams();

  return (
    <div className="flex gap-3 flex-wrap relative">
      {/* Loading Overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-lg flex items-center justify-center z-10">
          <div className="flex items-center gap-2 bg-background/95 px-4 py-2 rounded-lg shadow-lg border">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span className="text-sm font-medium">Applying filters...</span>
          </div>
        </div>
      )}

      <Select
        defaultValue={searchParams.get("status") || "all"}
        onValueChange={(value) => onFilterChange("status", value)}
        disabled={isPending}
      >
        <SelectTrigger
          className={cn("w-[150px]", isPending && "pointer-events-none")}
        >
          <SelectValue placeholder="All Orders" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Orders</SelectItem>
          <SelectItem value="NEW">New</SelectItem>
          <SelectItem value="CONFIRMED">Confirmed</SelectItem>
          <SelectItem value="DISPATCHED">Dispatched</SelectItem>
          <SelectItem value="DELIVERED">Delivered</SelectItem>
          <SelectItem value="CANCELLED">Cancelled</SelectItem>
          <SelectItem value="POSTPONED">Postponed</SelectItem>
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("source") || "all"}
        onValueChange={(value) => onFilterChange("source", value)}
        disabled={isPending}
      >
        <SelectTrigger
          className={cn("w-[180px]", isPending && "pointer-events-none")}
        >
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          <SelectItem value="TIKTOK">TikTok</SelectItem>
          <SelectItem value="FACEBOOK">Facebook</SelectItem>
          <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
          <SelectItem value="WEBSITE">Website</SelectItem>
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("location") || "all"}
        onValueChange={(value) => onFilterChange("location", value)}
        disabled={isPending}
      >
        <SelectTrigger
          className={cn("w-[180px]", isPending && "pointer-events-none")}
        >
          <SelectValue placeholder="Agent Location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Locations</SelectItem>
          {locations.map((location) => (
            <SelectItem key={location.value} value={location.value}>
              {location.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

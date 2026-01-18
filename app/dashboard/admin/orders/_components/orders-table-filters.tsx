"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrdersTableFiltersProps {
  locations: { value: string; label: string }[];
}

export function OrdersTableFilters({ locations }: OrdersTableFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    params.delete("page"); // Reset to page 1 when filtering
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex gap-3 flex-wrap">
      <Select
        defaultValue={searchParams.get("status") || "all"}
        onValueChange={(value) => handleFilterChange("status", value)}
      >
        <SelectTrigger className="w-37.5">
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
        onValueChange={(value) => handleFilterChange("source", value)}
      >
        <SelectTrigger className="w-45">
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
        onValueChange={(value) => handleFilterChange("location", value)}
      >
        <SelectTrigger className="w-45">
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

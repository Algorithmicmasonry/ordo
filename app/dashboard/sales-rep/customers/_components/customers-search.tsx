"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

interface CustomersSearchProps {
  currentSearch: string;
  currentCity: string;
  cities: string[];
}

export function CustomersSearch({
  currentSearch,
  currentCity,
  cities,
}: CustomersSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(currentSearch);

  const updateParams = (updates: Record<string, string | null>) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      // Reset to page 1 when filters change
      params.delete("page");

      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchValue });
  };

  const handleCityFilter = (city: string) => {
    updateParams({ city: currentCity === city ? null : city });
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or phone number..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10"
                disabled={isPending}
              />
            </div>
            <Button type="submit" disabled={isPending}>
              Search
            </Button>
          </form>
        </div>

        {/* City Filter Chips */}
        {cities.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center pt-2 border-t">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">
              Quick Filters:
            </span>
            <button
              onClick={() => updateParams({ city: null })}
              disabled={isPending}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                !currentCity
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              All Locations
            </button>
            {cities.slice(0, 5).map((city) => (
              <button
                key={city}
                onClick={() => handleCityFilter(city)}
                disabled={isPending}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  currentCity === city
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

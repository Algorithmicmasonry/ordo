"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAvailableCurrencies } from "@/lib/currency";
import type { Currency } from "@prisma/client";
import { ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function CurrencyFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCurrency = searchParams.get("currency") as Currency | null;

  const handleCurrencyChange = (currency: Currency | "all") => {
    const params = new URLSearchParams(searchParams.toString());
    if (currency === "all") {
      params.delete("currency");
    } else {
      params.set("currency", currency);
    }
    router.push(`?${params.toString()}`);
  };

  const currencies = getAvailableCurrencies();
  const selectedCurrency = currentCurrency
    ? currencies.find((c) => c.code === currentCurrency)
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Currency: {selectedCurrency ? selectedCurrency.name : "All"}
          <ChevronDown className="ml-2 size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => handleCurrencyChange("all")}>
          All Currencies
        </DropdownMenuItem>
        {currencies.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => handleCurrencyChange(currency.code as Currency)}
          >
            {currency.symbol} - {currency.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

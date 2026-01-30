"use client";

import type { ProductPackage, Currency } from "@prisma/client";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/currency";

interface PackageSelectorProps {
  packages: ProductPackage[];
  selectedPackages: string[];
  onToggle: (packageId: string) => void;
  note?: string | null; // Optional note from product settings
  currency?: Currency; // Currency to display prices in
}

export function PackageSelector({
  packages,
  selectedPackages,
  onToggle,
  note,
  currency = "NGN",
}: PackageSelectorProps) {
  // Filter packages by selected currency
  const filteredPackages = packages.filter((pkg) => pkg.currency === currency);
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium mb-2">
        Select Your Package:{" "}
        {note && <span className="text-muted-foreground">({note})</span>} *
      </label>
      {filteredPackages.map((pkg) => (
        <label
          key={pkg.id}
          className={cn(
            "flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors",
            selectedPackages.includes(pkg.id)
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/50",
          )}
        >
          <input
            type="checkbox"
            checked={selectedPackages.includes(pkg.id)}
            onChange={() => onToggle(pkg.id)}
            className="mt-1 h-4 w-4"
          />
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold">{pkg.name}:</p>
                {pkg.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {pkg.description}
                  </p>
                )}
              </div>
              <p className="font-bold text-lg whitespace-nowrap ml-4">
                = {currencySymbol}
                {pkg.price.toLocaleString()}
              </p>
            </div>
          </div>
        </label>
      ))}
    </div>
  );
}

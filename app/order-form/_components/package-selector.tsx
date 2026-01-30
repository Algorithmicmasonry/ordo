"use client";

import type { ProductPackage } from "@prisma/client";
import { cn } from "@/lib/utils";

interface PackageSelectorProps {
  packages: ProductPackage[];
  selectedPackages: string[];
  onToggle: (packageId: string) => void;
}

export function PackageSelector({
  packages,
  selectedPackages,
  onToggle,
}: PackageSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium mb-2">
        Select Your Package: (NOTE: ONE BOX CONTAINS 10PCS INSIDE) *
      </label>
      {packages.map((pkg) => (
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
                = ₦{pkg.price.toLocaleString()}
              </p>
            </div>
          </div>
        </label>
      ))}
    </div>
  );
}

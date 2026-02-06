"use client";

import type { ProductPackage, Currency } from "@prisma/client";
import { getCurrencySymbol } from "@/lib/currency";

interface PackageSelectorProps {
  packages: ProductPackage[];
  selectedPackageId: string;
  onSelect: (packageId: string) => void;
  currency?: Currency;
}

export function PackageSelector({
  packages,
  selectedPackageId,
  onSelect,
  currency = "NGN",
}: PackageSelectorProps) {
  // Filter packages by selected currency
  const filteredPackages = packages.filter((pkg) => pkg.currency === currency);
  const currencySymbol = getCurrencySymbol(currency);

  if (filteredPackages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 pt-2">
      <h3 className="text-base font-bold text-gray-900 uppercase tracking-wide">
        SELECT YOUR PACKAGE *
      </h3>

      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr,auto] bg-gray-50 border-b border-gray-300">
          <div className="px-4 py-3 text-sm font-bold text-gray-900">
            Product
          </div>
          <div className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
            Price
          </div>
        </div>

        {/* Table Rows */}
        {filteredPackages.map((pkg, index) => (
          <label
            key={pkg.id}
            className={`grid grid-cols-[auto,1fr,auto] gap-3 px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              index !== filteredPackages.length - 1 ? "border-b border-gray-200" : ""
            }`}
          >
            <input
              type="radio"
              name="package"
              checked={selectedPackageId === pkg.id}
              onChange={() => onSelect(pkg.id)}
              className="mt-0.5 w-4 h-4 text-purple-600 focus:ring-purple-500"
            />
            <div className="text-sm font-semibold text-gray-900">
              {pkg.name}
            </div>
            <div className="text-sm font-bold text-gray-900 whitespace-nowrap">
              {currencySymbol}
              {pkg.price.toLocaleString()}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

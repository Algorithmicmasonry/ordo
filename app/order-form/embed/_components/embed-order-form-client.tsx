"use client";

import React from "react";
import { useState, useEffect, useMemo } from "react";
import { createOrderV2 } from "@/app/actions/orders";
import { PackageSelector } from "@/app/order-form/_components/package-selector";
import { PayOnDeliveryBadge } from "@/app/order-form/_components/pay-on-delivery-badge";
import { NIGERIA_STATES } from "@/lib/nigeria-states";
import { GHANA_REGIONS } from "@/lib/ghana-regions";
import type { ProductWithPackages, Currency } from "@/lib/types";
import type { UTMParams } from "@/lib/utm-parser";
import { parseUTMParams, extractReferrerDomain } from "@/lib/utm-parser";

interface EmbedOrderFormClientProps {
  product: ProductWithPackages;
  currency: Currency;
}

export function EmbedOrderFormClient({
  product,
  currency,
}: EmbedOrderFormClientProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [utmParams, setUtmParams] = useState<UTMParams | undefined>();
  const [referrer, setReferrer] = useState<string | undefined>();

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerWhatsapp: "",
    deliveryAddress: "",
    state: "",
    city: "",
  });

  // Get appropriate states/regions based on currency
  const stateOptions = useMemo(() => {
    return currency === "GHS" ? GHANA_REGIONS : NIGERIA_STATES;
  }, [currency]);

  const stateLabel = currency === "GHS" ? "Region" : "State";

  // Capture UTM params and referrer on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = parseUTMParams(window.location.href);
      const ref = extractReferrerDomain();

      if (params.source || ref) {
        Promise.resolve().then(() => {
          if (params.source) setUtmParams(params);
          if (ref) setReferrer(ref);
        });
      }
    }
  }, []);

  function handlePackageSelect(packageId: string) {
    setSelectedPackageId(packageId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!selectedPackageId) {
      setError("Please select a package");
      setLoading(false);
      return;
    }

    const result = await createOrderV2({
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerWhatsapp: formData.customerWhatsapp || undefined,
      deliveryAddress: formData.deliveryAddress,
      state: formData.state,
      city: formData.city,
      productId: product.id,
      selectedPackages: [selectedPackageId],
      currency,
      utmParams,
      referrer,
    });

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setFormData({
        customerName: "",
        customerPhone: "",
        customerWhatsapp: "",
        deliveryAddress: "",
        state: "",
        city: "",
      });
      setSelectedPackageId("");

      setTimeout(() => setSuccess(false), 5000);
    } else {
      setError(result.error || "Failed to submit order");
    }
  }

  return (
    <div className="w-full p-4 md:p-8 bg-white">
      <div className="max-w-md mx-auto">
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-sm font-medium">
              Order submitted successfully! We&apos;ll contact you shortly.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <input
            type="text"
            placeholder="Your Name *"
            required
            value={formData.customerName}
            onChange={(e) =>
              setFormData({ ...formData, customerName: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-600"
          />

          {/* Phone Number */}
          <div className="flex gap-2">
            <select className="px-3 py-2.5 border border-gray-400 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>+234</option>
            </select>
            <input
              type="tel"
              placeholder="Your Phone Number *"
              required
              value={formData.customerPhone}
              onChange={(e) =>
                setFormData({ ...formData, customerPhone: e.target.value })
              }
              className="flex-1 px-4 py-2.5 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-600"
            />
          </div>

          {/* WhatsApp Number */}
          <div className="flex gap-2">
            <select className="px-3 py-2.5 border border-gray-400 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>+234</option>
            </select>
            <input
              type="tel"
              placeholder="Your WhatsApp Number *"
              required
              value={formData.customerWhatsapp}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  customerWhatsapp: e.target.value,
                })
              }
              className="flex-1 px-4 py-2.5 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-600"
            />
          </div>

          {/* Address */}
          <input
            type="text"
            placeholder="Your Address *"
            required
            value={formData.deliveryAddress}
            onChange={(e) =>
              setFormData({
                ...formData,
                deliveryAddress: e.target.value,
              })
            }
            className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-600"
          />

          {/* City */}

          <input
            type="text"
            placeholder="Your City *"
            required
            value={formData.city}
            onChange={(e) =>
              setFormData({
                ...formData,
                city: e.target.value,
              })
            }
            className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-600"
          />

          {/* Delivery State */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Your Delivery State *
            </label>
          </div>
          <select
            required
            value={formData.state}
            onChange={(e) =>
              setFormData({ ...formData, state: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          >
            <option value="">Select {stateLabel.toLowerCase()}</option>
            {stateOptions.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>

          {/* Package Selector - NOW USING THE COMPONENT */}
          <div className="mt-6">
            <PackageSelector
              packages={product.packages}
              selectedPackageId={selectedPackageId}
              onSelect={handlePackageSelect}
              currency={currency}
              packageSelectorNote={product.packageSelectorNote ?? ""}
            />
          </div>

          {/* Payment Method */}
          <div className="flex items-center gap-3 mt-6 px-2">
            <input
              type="radio"
              id="pod"
              name="payment"
              defaultChecked
              className="w-4 h-4 text-green-600 cursor-pointer"
            />
            <label
              htmlFor="pod"
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <span>💳</span>
                <span>Pay On Delivery</span>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white py-2.5 px-4 rounded-lg text-base font-bold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer mt-6"
          >
            {loading ? "SUBMITTING..." : "ORDER NOW"}
          </button>
        </form>
      </div>
    </div>
  );
}

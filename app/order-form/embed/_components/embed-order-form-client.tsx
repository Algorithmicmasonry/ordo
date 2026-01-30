"use client";

import { useState, useEffect } from "react";
import { createOrderV2 } from "@/app/actions/orders";
import { PackageSelector } from "@/app/order-form/_components/package-selector";
import { PayOnDeliveryBadge } from "@/app/order-form/_components/pay-on-delivery-badge";
import { NIGERIA_STATES } from "@/lib/nigeria-states";
import type { ProductWithPackages } from "@/lib/types";
import type { UTMParams } from "@/lib/utm-parser";
import {
  parseUTMParams,
  extractReferrerDomain,
} from "@/lib/utm-parser";

interface EmbedOrderFormClientProps {
  product: ProductWithPackages;
}

export function EmbedOrderFormClient({ product }: EmbedOrderFormClientProps) {
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
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

  // Capture UTM params and referrer on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Parse UTM parameters
      const params = parseUTMParams(window.location.href);
      if (params.source) setUtmParams(params);

      // Extract referrer
      const ref = extractReferrerDomain();
      if (ref) setReferrer(ref);
    }
  }, []);

  function handlePackageToggle(packageId: string) {
    setSelectedPackages((prev) =>
      prev.includes(packageId)
        ? prev.filter((id) => id !== packageId)
        : [...prev, packageId],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (selectedPackages.length === 0) {
      setError("Please select at least one package");
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
      selectedPackages,
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
      setSelectedPackages([]);

      setTimeout(() => setSuccess(false), 5000);
    } else {
      setError(result.error || "Failed to submit order");
    }
  }

  return (
    <div className="w-full p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Order {product.name}
          </h1>
          {product.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {product.description}
            </p>
          )}
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-green-800 dark:text-green-200 text-sm font-medium">
              Order submitted successfully! We'll contact you shortly.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pay on Delivery Badge */}
          <PayOnDeliveryBadge />

          {/* Package Selection */}
          <div>
            <PackageSelector
              packages={product.packages}
              selectedPackages={selectedPackages}
              onToggle={handlePackageToggle}
            />
          </div>

          {/* Customer Information */}
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Customer Information
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.customerPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, customerPhone: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  WhatsApp Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.customerWhatsapp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customerWhatsapp: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Delivery Information
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Delivery Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.deliveryAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryAddress: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State *
                  </label>
                  <select
                    required
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select state</option>
                    {NIGERIA_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Submitting..." : "Submit Order"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          By submitting this form, you agree to be contacted by our sales team.
        </p>
      </div>
    </div>
  );
}

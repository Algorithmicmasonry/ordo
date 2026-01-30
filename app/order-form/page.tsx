"use client";

import { useState, useEffect } from "react";
import { createOrderV2 } from "@/app/actions/orders";
import { getActiveProducts, getProductWithPackages } from "@/app/actions/products";
import { PackageSelector } from "./_components/package-selector";
import { PayOnDeliveryBadge } from "./_components/pay-on-delivery-badge";
import { NIGERIA_STATES } from "@/lib/nigeria-states";
import type { ProductPackage, Currency } from "@prisma/client";
import type { UTMParams } from "@/lib/utm-parser";
import { parseUTMParams, extractReferrerDomain } from "@/lib/utm-parser";
import { getAvailableCurrencies } from "@/lib/currency";

type Product = {
  id: string;
  name: string;
  price: number;
  currentStock: number;
};

export default function OrderFormPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<ProductPackage[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null); // Store full product with packages
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("NGN");
  const [loadingPackages, setLoadingPackages] = useState(false);
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

  useEffect(() => {
    loadProducts();

    // Capture UTM params and referrer on mount
    if (typeof window !== "undefined") {
      const params = parseUTMParams(window.location.href);
      if (params.source) setUtmParams(params);

      const ref = extractReferrerDomain();
      if (ref) setReferrer(ref);
    }
  }, []);

  async function loadProducts() {
    const result = await getActiveProducts();
    if (result.success && result.products) {
      setProducts(result.products);
    }
  }

  async function handleProductChange(productId: string) {
    setSelectedProductId(productId);
    setSelectedPackages([]);
    setPackages([]);
    setSelectedProduct(null);
    setError("");

    if (!productId) return;

    setLoadingPackages(true);
    const result = await getProductWithPackages(productId);
    setLoadingPackages(false);

    if (result.success && result.data) {
      setSelectedProduct(result.data); // Store full product object
      setPackages(result.data.packages);
    } else {
      setError(
        result.error ||
          "This product has no available packages. Please select another product.",
      );
    }
  }

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

    if (!selectedProductId) {
      setError("Please select a product");
      setLoading(false);
      return;
    }

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
      productId: selectedProductId,
      selectedPackages,
      currency: selectedCurrency,
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
      setSelectedProductId("");
      setSelectedPackages([]);
      setPackages([]);

      setTimeout(() => setSuccess(false), 5000);
    } else {
      setError(result.error || "Failed to submit order");
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Place Your Order
          </h1>

          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-green-800 dark:text-green-200 font-medium">
                Order submitted successfully! We'll contact you shortly.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pay on Delivery Badge */}
            <PayOnDeliveryBadge />

            {/* Currency Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Currency *
              </label>
              <select
                required
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {getAvailableCurrencies().map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} - {curr.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Product *
              </label>
              <select
                required
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">Choose a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Package Selection */}
            {loadingPackages && (
              <div className="text-center py-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Loading packages...
                </p>
              </div>
            )}

            {packages.length > 0 && !loadingPackages && (
              <PackageSelector
                packages={packages}
                selectedPackages={selectedPackages}
                onToggle={handlePackageToggle}
                note={selectedProduct?.packageSelectorNote}
                currency={selectedCurrency}
              />
            )}

            {/* Customer Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Customer Information
              </h2>

              <div className="space-y-4">
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Delivery Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.deliveryAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryAddress: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedProductId || selectedPackages.length === 0}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Submitting..." : "Submit Order"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          By submitting this form, you agree to be contacted by our sales team.
        </p>
      </div>
    </div>
  );
}

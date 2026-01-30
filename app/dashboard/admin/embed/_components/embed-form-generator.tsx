"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, Package, PackageX } from "lucide-react";
import Link from "next/link";
import { getAvailableCurrencies } from "@/lib/currency";
import type { Currency } from "@prisma/client";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  packageCount: number;
}

interface EmbedFormGeneratorProps {
  products: Product[];
}

export function EmbedFormGenerator({ products }: EmbedFormGeneratorProps) {
  const [generatedUrls, setGeneratedUrls] = useState<Record<string, string>>(
    {},
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<
    Record<string, Currency>
  >({});

  const generateEmbedUrl = (productId: string) => {
    const baseUrl = window.location.origin;
    const currency = selectedCurrency[productId] || "NGN";
    const embedUrl = `${baseUrl}/order-form/embed?product=${productId}&currency=${currency}`;
    setGeneratedUrls((prev) => ({ ...prev, [productId]: embedUrl }));
    return embedUrl;
  };

  const copyToClipboard = async (productId: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(productId);
      toast.success("Embed URL copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  const productsWithPackages = products.filter((p) => p.packageCount > 0);
  const productsWithoutPackages = products.filter((p) => p.packageCount === 0);

  return (
    <div className="space-y-6">
      {/* Products with packages */}
      {productsWithPackages.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">
              Products Ready for Embed ({productsWithPackages.length})
            </h2>
            <p className="text-sm text-muted-foreground">
              These products have packages and can generate embed forms
            </p>
          </div>

          <div className="grid gap-4">
            {productsWithPackages.map((product) => {
              const embedUrl = generatedUrls[product.id];
              const isCopied = copiedId === product.id;

              return (
                <Card key={product.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <Package className="size-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <CardTitle>{product.name}</CardTitle>
                            <CardDescription>
                              {product.description || "No description"}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <Package className="size-3" />
                          {product.packageCount} package
                          {product.packageCount !== 1 ? "s" : ""}
                        </Badge>
                        <Link
                          href={`/dashboard/admin/inventory/${product.id}/packages`}
                        >
                          <Button size="sm" variant="outline">
                            Manage Packages
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {!embedUrl ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Select Currency
                          </label>
                          <Select
                            value={selectedCurrency[product.id] || "NGN"}
                            onValueChange={(value) =>
                              setSelectedCurrency((prev) => ({
                                ...prev,
                                [product.id]: value as Currency,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableCurrencies().map((curr) => (
                                <SelectItem key={curr.code} value={curr.code}>
                                  {curr.symbol} - {curr.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={() => generateEmbedUrl(product.id)}
                          className="w-full"
                        >
                          Generate Embed URL
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={embedUrl}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            variant={isCopied ? "default" : "outline"}
                            size="icon"
                            onClick={() => copyToClipboard(product.id, embedUrl)}
                          >
                            {isCopied ? (
                              <Check className="size-4" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                          </Button>
                          <Link href={embedUrl} target="_blank">
                            <Button variant="outline" size="icon">
                              <ExternalLink className="size-4" />
                            </Button>
                          </Link>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Share this URL to allow customers to order this
                          product
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Products without packages */}
      {productsWithoutPackages.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">
              Products Without Packages ({productsWithoutPackages.length})
            </h2>
            <p className="text-sm text-muted-foreground">
              Create packages for these products to enable embed forms
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {productsWithoutPackages.map((product) => (
              <Card key={product.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded bg-muted flex items-center justify-center">
                          <PackageX className="size-5 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {product.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {product.description || "No description"}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground italic">
                      No packages set yet for this product
                    </p>
                    <Link
                      href={`/dashboard/admin/inventory/${product.id}/packages`}
                    >
                      <Button size="sm" variant="outline">
                        Create Packages
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {products.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <PackageX className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create products in the inventory section first
            </p>
            <Link href="/dashboard/admin/inventory">
              <Button>Go to Inventory</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Agent, AgentStock, Product } from "@prisma/client";
import {
  AlertTriangle,
  ChevronDown,
  Download,
  Filter,
  Package,
  Plus,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { DashboardHeader } from "../../_components";

type ProductWithStock = Product & {
  agentStock: (AgentStock & {
    agent: Pick<Agent, "id" | "name" | "location">;
  })[];
  _count: {
    orders: number;
  };
};

interface InventoryPageProps {
  products: ProductWithStock[];
  stats: {
    totalValue: number;
    totalUnits: number;
    activeAgents: number;
    distributionRate: number;
  };
  lowStockProducts: ProductWithStock[];
}

export default function AdminInventoryClient({
  products,
  stats,
  lowStockProducts,
}: InventoryPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithStock | null>(null);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <DashboardHeader
        heading="Inventory Dashboard"
        text="Centralized management for global balance and localized agent
        distribution."
      />

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search SKU or Product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="size-4 mr-2" />
            Add Product
          </Button>
          <Button variant="outline">
            <RefreshCw className="size-4 mr-2" />
            Update Stock
          </Button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {lowStockProducts.slice(0, 4).map((product) => (
                <Card key={product.id} className="border-destructive/30">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {product.name}
                      </p>
                      <p className="text-lg font-bold text-destructive">
                        {product.currentStock} units left
                      </p>
                    </div>
                    <Button size="sm" variant="destructive">
                      Restock
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-sm font-medium">
              Total Inventory Value
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-bold">
                ₦{stats.totalValue.toLocaleString()}
              </p>
              <span className="text-green-500 text-sm font-bold flex items-center">
                <TrendingUp className="size-3 mr-1" />
                +2.5%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-sm font-medium">
              Total Units in Stock
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-bold">
                {stats.totalUnits.toLocaleString()}
              </p>
              <span className="text-destructive text-sm font-bold flex items-center">
                <TrendingDown className="size-3 mr-1" />
                -1.2%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-sm font-medium">
              Active Agents
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-bold">{stats.activeAgents}</p>
              <span className="text-muted-foreground text-sm font-bold">
                0%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-sm font-medium">
              Distribution Rate
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-bold">{stats.distributionRate}%</p>
              <span className="text-green-500 text-sm font-bold flex items-center">
                <TrendingUp className="size-3 mr-1" />
                +5.1%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5 text-primary" />
              Global Inventory
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Filter className="size-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Details</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                  <TableHead className="text-right">Global Balance</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded bg-muted flex items-center justify-center">
                            <Package className="size-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-bold">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {product.sku || "N/A"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ₦{product.cost.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ₦{product.price.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`text-lg font-bold ${
                            product.currentStock <= product.reorderPoint
                              ? "text-destructive"
                              : ""
                          }`}
                        >
                          {product.currentStock}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedProduct(product)}
                            >
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>
                                Product Details - {product.name}
                              </DialogTitle>
                            </DialogHeader>
                            <ProductDetailsModal product={product} />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredProducts.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Button variant="ghost" className="text-primary">
                View All Products <ChevronDown className="ml-1 size-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProductDetailsModal({ product }: { product: ProductWithStock }) {
  return (
    <div className="space-y-6">
      {/* Product Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Product Name</p>
          <p className="font-semibold">{product.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">SKU</p>
          <p className="font-mono font-semibold">{product.sku || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Unit Cost</p>
          <p className="font-semibold">₦{product.cost.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Selling Price</p>
          <p className="font-semibold">₦{product.price.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Current Stock</p>
          <p className="font-semibold">{product.currentStock}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Reorder Point</p>
          <p className="font-semibold">{product.reorderPoint}</p>
        </div>
      </div>

      {/* Agent Distribution */}
      <div>
        <h3 className="font-semibold mb-3">Agent Distribution</h3>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Defective</TableHead>
                <TableHead className="text-right">Missing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.agentStock.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-4 text-muted-foreground"
                  >
                    No agent stock records
                  </TableCell>
                </TableRow>
              ) : (
                product.agentStock.map((stock) => (
                  <TableRow key={stock.id}>
                    <TableCell className="font-medium">
                      {stock.agent.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {stock.agent.location}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {stock.quantity}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {stock.defective}
                    </TableCell>
                    <TableCell className="text-right text-orange-500">
                      {stock.missing}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

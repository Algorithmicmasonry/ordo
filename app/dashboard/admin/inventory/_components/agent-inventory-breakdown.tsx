"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Agent, AgentStock, Product } from "@prisma/client";
import { AlertCircle, HatGlasses, MapPin } from "lucide-react";
import { useState } from "react";

type AgentWithStock = Agent & {
  stock: (AgentStock & {
    product: Pick<Product, "id" | "name" | "price" | "cost">;
  })[];
};

interface AgentInventoryBreakdownProps {
  agents: AgentWithStock[];
}

export function AgentInventoryBreakdown({
  agents,
}: AgentInventoryBreakdownProps) {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <HatGlasses className="size-5 text-primary" />
          Agent Inventory Breakdown
        </h2>
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as "list" | "map")}
        >
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === "list" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            <div className="text-center">
              <MapPin className="size-12 mx-auto mb-2 opacity-50" />
              <p>Map view coming soon</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function AgentCard({ agent }: { agent: AgentWithStock }) {
  const totalStock = agent.stock.reduce((sum, item) => sum + item.quantity, 0);
  const totalDefective = agent.stock.reduce(
    (sum, item) => sum + item.defective,
    0,
  );
  const totalMissing = agent.stock.reduce((sum, item) => sum + item.missing, 0);
  const maxCapacity = 1000; // You can make this dynamic
  const capacityPercentage = Math.min((totalStock / maxCapacity) * 100, 100);

  // Get low stock items
  const lowStockItems = agent.stock.filter((item) => item.quantity < 10);

  return (
    <Card>
      <CardContent className="p-0">
        {/* Agent Header */}
        <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 border-2 border-primary">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {agent.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-bold">{agent.name}</h4>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="size-3" />
                {agent.location}
              </p>
            </div>
          </div>
          <Badge
            variant={agent.isActive ? "default" : "secondary"}
            className={agent.isActive ? "bg-green-500" : ""}
          >
            {agent.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Stock Capacity */}
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Stock Capacity</span>
            <span className="font-bold">
              {totalStock} / {maxCapacity} units (
              {capacityPercentage.toFixed(0)}%)
            </span>
          </div>
          <Progress value={capacityPercentage} className="h-2" />

          {/* Stock Breakdown */}
          <div className="mt-4 pt-4 border-t space-y-2">
            {agent.stock.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No stock assigned
              </p>
            ) : (
              agent.stock.slice(0, 3).map((stock) => (
                <div key={stock.id} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {stock.product.name}
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      stock.quantity < 10
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {stock.quantity} units
                    {stock.quantity < 10 && " (Low)"}
                  </span>
                </div>
              ))
            )}
            {agent.stock.length > 3 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{agent.stock.length - 3} more products
              </p>
            )}
          </div>

          {/* Issues Alert */}
          {(totalDefective > 0 || totalMissing > 0) && (
            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 text-destructive mt-0.5" />
                <div className="flex-1 text-xs">
                  <p className="font-semibold text-destructive">
                    Issues Detected
                  </p>
                  <div className="mt-1 space-y-1 text-muted-foreground">
                    {totalDefective > 0 && (
                      <p>• {totalDefective} defective units</p>
                    )}
                    {totalMissing > 0 && <p>• {totalMissing} missing units</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-3 border-t flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex-1" size="sm">
                Assign Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign Stock to {agent.name}</DialogTitle>
              </DialogHeader>
              <AssignStockForm agent={agent} />
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1" size="sm">
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agent Details - {agent.name}</DialogTitle>
              </DialogHeader>
              <AgentDetailsModal agent={agent} />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

function AgentDetailsModal({ agent }: { agent: AgentWithStock }) {
  const totalStock = agent.stock.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = agent.stock.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Agent Information */}
      <div>
        <h3 className="font-semibold mb-3">Agent Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-semibold">{agent.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-semibold">{agent.phone}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Location</p>
            <p className="font-semibold">{agent.location}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={agent.isActive ? "default" : "secondary"}>
              {agent.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        {agent.address && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="font-semibold">{agent.address}</p>
          </div>
        )}
      </div>

      {/* Stock Summary */}
      <div>
        <h3 className="font-semibold mb-3">Stock Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Units</p>
              <p className="text-2xl font-bold">{totalStock}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">
                ₦{totalValue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Products</p>
              <p className="text-2xl font-bold">{agent.stock.length}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Stock List */}
      <div>
        <h3 className="font-semibold mb-3">Stock Details</h3>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Defective</TableHead>
                <TableHead className="text-right">Missing</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agent.stock.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No stock assigned
                  </TableCell>
                </TableRow>
              ) : (
                agent.stock.map((stock) => (
                  <TableRow key={stock.id}>
                    <TableCell className="font-medium">
                      {stock.product.name}
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
                    <TableCell className="text-right font-semibold">
                      ₦{(stock.quantity * stock.product.price).toLocaleString()}
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

function AssignStockForm({ agent }: { agent: AgentWithStock }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Assign stock form will be implemented here. This will allow you to:
      </p>
      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
        <li>Select products to assign</li>
        <li>Specify quantities for each product</li>
        <li>Update agent stock levels</li>
        <li>Track stock movement history</li>
      </ul>
    </div>
  );
}

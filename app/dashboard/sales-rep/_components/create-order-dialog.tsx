"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Loader2, Trash2, Plus } from "lucide-react";
import { createManualOrder, getAvailableProducts } from "../actions";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { OrderSource, Currency } from "@prisma/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAvailableCurrencies, getCurrencySymbol } from "@/lib/currency";
import { NIGERIA_STATES } from "@/lib/nigeria-states";
import { GHANA_REGIONS } from "@/lib/ghana-regions";

interface Product {
  id: string;
  name: string;
  price: number;
  currentStock: number;
  currency: Currency; // Optional until Prisma client regenerates
}
// Check how revenue generated is calculated with ghana cedis as well in orders route

interface OrderItem {
  productId: string;
  quantity: number;
}

export function CreateOrderDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerWhatsapp: "",
    deliveryAddress: "",
    state: "",
    city: "",
    source: "WHATSAPP" as OrderSource,
  });

  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { productId: "", quantity: 1 },
  ]);

  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    const result = await getAvailableProducts();
    if (result.success && result.data) {
      setProducts(result.data);
    }
    setLoadingProducts(false);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { productId: "", quantity: 1 }]);
  };

  const removeOrderItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const updateOrderItem = (
    index: number,
    field: keyof OrderItem,
    value: string | number,
  ) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        return total + product.price * item.quantity;
      }
      return total;
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!formData.customerPhone.trim()) {
      toast.error("Customer phone is required");
      return;
    }
    if (!formData.deliveryAddress.trim()) {
      toast.error("Delivery address is required");
      return;
    }
    if (!formData.city.trim() || !formData.state.trim()) {
      toast.error("City and state are required");
      return;
    }

    const validItems = orderItems.filter(
      (item) => item.productId && item.quantity > 0,
    );
    if (validItems.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    startTransition(async () => {
      const result = await createManualOrder({
        ...formData,
        items: validItems,
      });

      if (result.success && result.data) {
        toast.success("Order created successfully!");
        setOpen(false);

        // Reset form
        setFormData({
          customerName: "",
          customerPhone: "",
          customerWhatsapp: "",
          deliveryAddress: "",
          state: "",
          city: "",
          source: "WHATSAPP",
        });
        setOrderItems([{ productId: "", quantity: 1 }]);

        router.refresh();

        // Navigate to order details
        router.push(`/dashboard/sales-rep/orders/${result.data.id}`);
      } else {
        toast.error(result.error || "Failed to create order");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="size-4" />
          Create Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Manually create an order for a customer. The order will be assigned
            to you.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Customer Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    placeholder="John Doe"
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone Number *</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customerPhone: e.target.value,
                      })
                    }
                    placeholder="+234 XXX XXX XXXX"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerWhatsapp">
                  WhatsApp Number (Optional)
                </Label>
                <Input
                  id="customerWhatsapp"
                  type="tel"
                  value={formData.customerWhatsapp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customerWhatsapp: e.target.value,
                    })
                  }
                  placeholder="+234 XXX XXX XXXX"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Delivery Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Delivery Information</h3>

              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                <Textarea
                  id="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryAddress: e.target.value,
                    })
                  }
                  placeholder="123 Main Street, Apartment 4B"
                  rows={3}
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Lagos"
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    placeholder="Lagos State"
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Order Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOrderItem}
                  disabled={isPending || loadingProducts}
                >
                  <Plus className="size-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  {orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-3 items-end p-3 border rounded-lg"
                    >
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`product-${index}`}>Product *</Label>
                        <Select
                          value={item.productId}
                          onValueChange={(value) =>
                            updateOrderItem(index, "productId", value)
                          }
                          disabled={isPending}
                        >
                          <SelectTrigger id={`product-${index}`}>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - {getCurrencySymbol(product.currency)}
                                {product.price.toLocaleString()} (Stock:{" "}
                                {product.currentStock})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-24 space-y-2">
                        <Label htmlFor={`quantity-${index}`}>Qty *</Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateOrderItem(
                              index,
                              "quantity",
                              parseInt(e.target.value) || 1,
                            )
                          }
                          disabled={isPending}
                        />
                      </div>

                      {orderItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOrderItem(index)}
                          disabled={isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Source */}
            <div className="space-y-2">
              <Label htmlFor="source">Order Source *</Label>
              <Select
                value={formData.source}
                onValueChange={(value) =>
                  setFormData({ ...formData, source: value as OrderSource })
                }
                disabled={isPending}
              >
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="FACEBOOK">Facebook</SelectItem>
                  <SelectItem value="TIKTOK">TikTok</SelectItem>
                  <SelectItem value="WEBSITE">Website</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Total */}
            {orderItems.some((item) => item.productId) && (
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-primary">
                  {(() => {
                    const firstProduct = products.find((p) => p.id === orderItems.find(i => i.productId)?.productId);
                    return firstProduct ? getCurrencySymbol(firstProduct.currency) : '₦';
                  })()}{calculateTotal().toLocaleString()}
                </span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || loadingProducts}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Order"
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

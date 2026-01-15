import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const products = [
  {
    name: "Wireless Pro Headphones",
    category: "Electronic & Gadgets",
    revenue: "$12.5k",
    image: "/placeholder-product.jpg", // Add your images
  },
  {
    name: "Active Smart Watch v4",
    category: "Wearables",
    revenue: "$8.2k",
    image: "/placeholder-product.jpg",
  },
  {
    name: "Ergo-Optical Mouse",
    category: "Accessories",
    revenue: "$4.9k",
    image: "/placeholder-product.jpg",
  },
];

export function TopProducts() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Top Selling Products</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.name} className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-muted" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.category}
                </p>
              </div>
              <p className="text-sm font-bold">{product.revenue}</p>
            </div>
          ))}
        </div>
        <Button variant="secondary" className="w-full mt-6">
          View Inventory Details
        </Button>
      </CardContent>
    </Card>
  );
}

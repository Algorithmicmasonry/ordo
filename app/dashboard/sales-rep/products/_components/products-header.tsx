import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

interface ProductsHeaderProps {
  totalProducts: number;
}

export function ProductsHeader({ totalProducts }: ProductsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-4xl font-black leading-tight tracking-tight">
          Product Catalog
        </h1>
        <p className="text-muted-foreground text-base">
          View and reference inventory details for customer support and order creation
        </p>
      </div>
      <Badge
        variant="outline"
        className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm font-bold w-fit"
      >
        <Package className="size-4 mr-2" />
        {totalProducts.toLocaleString()} Active Products
      </Badge>
    </div>
  );
}

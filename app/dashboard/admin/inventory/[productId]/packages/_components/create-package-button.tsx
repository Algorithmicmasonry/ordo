"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PackageForm } from "./package-form";

interface CreatePackageButtonProps {
  productId: string;
}

export function CreatePackageButton({ productId }: CreatePackageButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          Create Package
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Package</DialogTitle>
          <DialogDescription>
            Create a new package option for customers to select during checkout.
          </DialogDescription>
        </DialogHeader>
        <PackageForm productId={productId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

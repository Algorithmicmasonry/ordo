"use client";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import type { Order, OrderItem, Product, Agent } from "@prisma/client";
import { format } from "date-fns";

interface SendToAgentButtonProps {
  order: Order & {
    items: (OrderItem & { product: Product })[];
    agent?: Agent | null;
  };
}

export function SendToAgentButton({ order }: SendToAgentButtonProps) {
  const handleSendToAgent = () => {
    if (!order.agent) return;

    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Ordo Store";

    // Calculate total
    const totalAmount = order.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    // Format items list (keep it concise)
    const itemsList = order.items
      .map((item) => `${item.quantity}x ${item.product.name}`)
      .join(", ");

    // Create a shorter, more concise WhatsApp message
    const message = `🚚 *DELIVERY ASSIGNMENT*

*Order:* ${order.orderNumber}

*Customer:* ${order.customerName}
*Phone:* ${order.customerPhone}

*Address:* ${order.deliveryAddress}, ${order.city}, ${order.state}

*Items:* ${itemsList}

*Total:* ₦${totalAmount.toLocaleString()}

Please proceed with delivery. Thank you!`;

    // Clean phone number - remove all non-digits
    const cleanPhone = order.agent.phone.replace(/\D/g, "");

    // Ensure phone number doesn't start with +
    const phoneNumber = cleanPhone.startsWith("234")
      ? cleanPhone
      : `234${cleanPhone.replace(/^0+/, "")}`;

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    // Debug: log the URL length
    console.log("WhatsApp URL length:", whatsappUrl.length);
    console.log("Phone number:", phoneNumber);

    window.open(whatsappUrl, "_blank");
  };

  if (!order.agent) {
    return null;
  }

  return (
    <Button
      variant="outline"
      onClick={handleSendToAgent}
      className="bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-700 dark:text-green-400"
    >
      <MessageCircle className="size-4 mr-2" />
      Send to Agent
    </Button>
  );
}

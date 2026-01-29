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
      0
    );

    // Format items list
    const itemsList = order.items
      .map((item) => `• ${item.quantity}x ${item.product.name} - ₦${(item.quantity * item.price).toLocaleString()}`)
      .join("\n");

    // Format delivery slot
    const deliverySlot = order.deliverySlot
      ? `\n📅 *Delivery Slot:* ${order.deliverySlot.charAt(0).toUpperCase() + order.deliverySlot.slice(1)}`
      : "";

    // Create WhatsApp message
    const message = `🚚 *DELIVERY ASSIGNMENT - ${storeName}*

📦 *Order #${order.orderNumber}*
${order.dispatchedAt ? `🕐 Dispatched: ${format(new Date(order.dispatchedAt), "MMM dd, yyyy h:mm a")}` : ""}

👤 *CUSTOMER DETAILS:*
Name: ${order.customerName}
Phone: ${order.customerPhone}
${order.customerWhatsapp ? `WhatsApp: ${order.customerWhatsapp}` : ""}

📍 *DELIVERY ADDRESS:*
${order.deliveryAddress}
${order.city}, ${order.state}${deliverySlot}

📋 *ORDER ITEMS:*
${itemsList}

💰 *TOTAL AMOUNT: ₦${totalAmount.toLocaleString()}*

${order.status === "DISPATCHED" ? "✅ Please proceed with delivery and update status upon completion." : "⏳ Please prepare for dispatch."}

Thank you!`;

    const whatsappUrl = `https://wa.me/${order.agent.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
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

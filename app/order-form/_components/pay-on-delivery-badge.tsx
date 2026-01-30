import { CheckCircle } from "lucide-react";

export function PayOnDeliveryBadge() {
  return (
    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 border-2 border-green-500 rounded-lg">
      <div className="flex items-center justify-center size-12 bg-green-500 rounded-full flex-shrink-0">
        <CheckCircle className="size-6 text-white" />
      </div>
      <div>
        <p className="font-bold text-green-900 dark:text-green-100">
          Pay on Delivery
        </p>
        <p className="text-sm text-green-700 dark:text-green-300">
          Payment accepted upon delivery
        </p>
      </div>
    </div>
  );
}

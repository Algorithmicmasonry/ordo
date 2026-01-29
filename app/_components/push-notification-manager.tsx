"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff } from "lucide-react";
import { subscribeUser, unsubscribeUser } from "@/app/actions/push-notifications";
import toast from "react-hot-toast";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });

      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  }

  async function subscribeToPush() {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      setSubscription(sub);
      const serializedSub = JSON.parse(JSON.stringify(sub));
      const result = await subscribeUser(serializedSub);

      if (result.success) {
        toast.success("Notifications enabled!");
      } else {
        toast.error(result.error || "Failed to enable notifications");
      }
    } catch (error) {
      console.error("Failed to subscribe:", error);
      toast.error("Failed to enable notifications");
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    setIsLoading(true);
    try {
      if (subscription) {
        await subscription.unsubscribe();
        await unsubscribeUser(subscription.endpoint);
        setSubscription(null);
        toast.success("Notifications disabled");
      }
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      toast.error("Failed to disable notifications");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isSupported) {
    return null; // Don't show if not supported
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {subscription ? <Bell className="size-4" /> : <BellOff className="size-4" />}
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {subscription ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You will receive notifications for order updates
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={unsubscribeFromPush}
              disabled={isLoading}
            >
              Disable Notifications
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Enable notifications to stay updated on orders
            </p>
            <Button
              size="sm"
              onClick={subscribeToPush}
              disabled={isLoading}
            >
              Enable Notifications
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

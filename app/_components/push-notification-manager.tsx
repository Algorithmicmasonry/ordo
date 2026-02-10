"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff } from "lucide-react";
import {
  subscribeUser,
  unsubscribeUser,
} from "@/app/actions/push-notifications";
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

async function forceServiceWorkerUpdate() {
  try {
    console.log("🔄 Forcing service worker update...");

    // Unregister all service workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log("Unregistered:", registration.scope);
    }

    console.log("⏳ Waiting 1 second...");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Re-register
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });

    console.log("✅ Service worker re-registered:", registration);

    // Wait for it to be ready
    await navigator.serviceWorker.ready;
    console.log("✅ Service worker ready");

    toast.success("Service worker updated! Please enable notifications again.");
  } catch (error) {
    console.error("❌ Failed to update service worker:", error);
    toast.error("Failed to update service worker");
  }
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log("🔔 Push Notification Manager - Initial Check");
    console.log("Service Worker support:", "serviceWorker" in navigator);
    console.log("Push Manager support:", "PushManager" in window);
    console.log("Notification permission:", Notification.permission);
    console.log("VAPID Public Key:", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);

    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      console.log("📝 Registering service worker...");
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });

      console.log("✅ Service worker registered:", registration);
      console.log("SW scope:", registration.scope);
      console.log("SW active:", registration.active);
      console.log("SW installing:", registration.installing);
      console.log("SW waiting:", registration.waiting);

      const sub = await registration.pushManager.getSubscription();
      console.log("Current subscription:", sub);

      if (sub) {
        console.log("Subscription endpoint:", sub.endpoint);
        console.log("Subscription expiration:", sub.expirationTime);
        console.log("Subscription keys:", {
          p256dh: sub.toJSON().keys?.p256dh,
          auth: sub.toJSON().keys?.auth,
        });
      } else {
        console.log("⚠️ No active subscription found");
      }

      setSubscription(sub);
    } catch (error) {
      console.error("❌ Service worker registration failed:", error);
    }
  }

  async function subscribeToPush() {
    setIsLoading(true);
    console.log("🔔 Starting push subscription...");

    try {
      // Request permission first
      const permission = await Notification.requestPermission();
      console.log("Notification permission result:", permission);

      if (permission !== "granted") {
        toast.error("Notification permission denied");
        setIsLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      console.log("Service worker ready:", registration);

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });

      console.log("✅ New subscription created:", sub);
      console.log("Subscription endpoint:", sub.endpoint);
      console.log("Subscription JSON:", sub.toJSON());

      setSubscription(sub);
      const serializedSub = JSON.parse(JSON.stringify(sub));
      console.log("Serialized subscription:", serializedSub);

      const result = await subscribeUser(serializedSub);
      console.log("Server subscription result:", result);

      if (result.success) {
        toast.success("Notifications enabled!");
      } else {
        console.error("Server subscription failed:", result.error);
        toast.error(result.error || "Failed to enable notifications");
      }
    } catch (error) {
      console.error("❌ Failed to subscribe:", error);
      toast.error("Failed to enable notifications");
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    setIsLoading(true);
    console.log("🔕 Unsubscribing from push...");

    try {
      if (subscription) {
        console.log("Unsubscribing endpoint:", subscription.endpoint);
        await subscription.unsubscribe();
        console.log("✅ Unsubscribed from browser");

        await unsubscribeUser(subscription.endpoint);
        console.log("✅ Removed from server");

        setSubscription(null);
        toast.success("Notifications disabled");
      }
    } catch (error) {
      console.error("❌ Failed to unsubscribe:", error);
      toast.error("Failed to disable notifications");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isSupported) {
    console.log("⚠️ Push notifications not supported");
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {subscription ? (
            <Bell className="size-4" />
          ) : (
            <BellOff className="size-4" />
          )}
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
            <Button size="sm" onClick={subscribeToPush} disabled={isLoading}>
              Enable Notifications
            </Button>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={forceServiceWorkerUpdate}>
          Update Service Worker
        </Button>
      </CardContent>
    </Card>
  );
}

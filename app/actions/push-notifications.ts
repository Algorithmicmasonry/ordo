"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import webpush from "web-push";

// Initialize VAPID
webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

/**
 * Subscribe user to push notifications
 */
export async function subscribeUser(subscription: PushSubscriptionJSON) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Store subscription in database
    await db.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: session.user.id,
          endpoint: subscription.endpoint!,
        },
      },
      update: {
        p256dh: subscription.keys!.p256dh,
        auth: subscription.keys!.auth,
        isActive: true,
        lastUsedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        endpoint: subscription.endpoint!,
        p256dh: subscription.keys!.p256dh,
        auth: subscription.keys!.auth,
        userAgent: (await headers()).get("user-agent") || undefined,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error subscribing user:", error);
    return { success: false, error: "Failed to subscribe" };
  }
}

/**
 * Unsubscribe user from push notifications
 */
export async function unsubscribeUser(endpoint: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await db.pushSubscription.updateMany({
      where: {
        userId: session.user.id,
        endpoint,
      },
      data: {
        isActive: false,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error unsubscribing user:", error);
    return { success: false, error: "Failed to unsubscribe" };
  }
}

/**
 * Get user's active subscriptions
 */
export async function getUserSubscriptions() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const subscriptions = await db.pushSubscription.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    return { success: true, data: subscriptions };
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return { success: false, error: "Failed to fetch subscriptions" };
  }
}

/**
 * Send push notification to specific users
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    orderId?: string;
    tag?: string;
    requireInteraction?: boolean;
  }
) {
  try {
    // Get all active subscriptions for these users
    const subscriptions = await db.pushSubscription.findMany({
      where: {
        userId: { in: userIds },
        isActive: true,
      },
    });

    if (subscriptions.length === 0) {
      return { success: true, sent: 0 };
    }

    // Send to all subscriptions
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify(payload)
        );

        // Update last used timestamp
        await db.pushSubscription.update({
          where: { id: sub.id },
          data: { lastUsedAt: new Date() },
        });

        return true;
      } catch (error: any) {
        console.error(`Failed to send to subscription ${sub.id}:`, error);

        // If subscription is invalid (410 Gone), mark as inactive
        if (error.statusCode === 410) {
          await db.pushSubscription.update({
            where: { id: sub.id },
            data: { isActive: false },
          });
        }

        return false;
      }
    });

    const results = await Promise.allSettled(sendPromises);
    const successCount = results.filter((r) => r.status === "fulfilled" && r.value).length;

    return { success: true, sent: successCount, total: subscriptions.length };
  } catch (error) {
    console.error("Error sending push notifications:", error);
    return { success: false, error: "Failed to send notifications" };
  }
}

/**
 * Notify all admins (for order delivered event)
 */
export async function notifyAdmins(payload: {
  title: string;
  body: string;
  url?: string;
  orderId?: string;
}) {
  try {
    // Get all active admin users
    const admins = await db.user.findMany({
      where: {
        role: "ADMIN",
        isActive: true,
      },
      select: { id: true },
    });

    const adminIds = admins.map((admin) => admin.id);

    return await sendPushToUsers(adminIds, {
      ...payload,
      icon: "/icon.png",
      tag: "order-delivered",
      requireInteraction: true,
    });
  } catch (error) {
    console.error("Error notifying admins:", error);
    return { success: false, error: "Failed to notify admins" };
  }
}

/**
 * Notify specific sales rep (for order assignment)
 */
export async function notifySalesRep(
  salesRepId: string,
  payload: {
    title: string;
    body: string;
    url?: string;
    orderId?: string;
  }
) {
  try {
    return await sendPushToUsers([salesRepId], {
      ...payload,
      icon: "/icon.png",
      tag: "order-assigned",
    });
  } catch (error) {
    console.error("Error notifying sales rep:", error);
    return { success: false, error: "Failed to notify sales rep" };
  }
}

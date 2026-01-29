# PWA Testing Guide

## Implementation Status ✅

All PWA features have been successfully implemented and integrated:

1. ✅ Database schema updated with PushSubscription model
2. ✅ Database migration completed
3. ✅ App icons added to public folder
4. ✅ PWA components integrated into all dashboards
5. ✅ Application builds successfully

## Testing Instructions

### Prerequisites

**IMPORTANT**: PWA features (service workers and push notifications) require HTTPS. You have two options:

#### Option 1: Test Locally with HTTPS (Recommended)
```bash
# Install mkcert for local SSL certificates (one-time setup)
# On Windows with Chocolatey:
choco install mkcert

# Or download from: https://github.com/FiloSottile/mkcert/releases

# Install local CA
mkcert -install

# Create certificate for localhost
mkcert localhost 127.0.0.1 ::1

# Run Next.js with HTTPS
next dev --experimental-https
```

#### Option 2: Deploy to Production
Deploy to a hosting platform with HTTPS enabled (Vercel, Netlify, etc.)

### Testing Checklist

#### 1. Service Worker Registration
1. Start the dev server with HTTPS: `next dev --experimental-https` or `pnpm dev`
2. Open browser DevTools (F12)
3. Navigate to **Application** tab → **Service Workers**
4. You should see the service worker registered for your origin
5. Check that Status shows "activated and is running"

**Expected**: Service worker appears in the list with status "activated"

#### 2. Web App Manifest
1. In DevTools, go to **Application** tab → **Manifest**
2. Verify the following:
   - Name: "Ordo CRM"
   - Short name: "Ordo"
   - Start URL: "/dashboard"
   - Display: "standalone"
   - Icons: 192x192 and 512x512 should be visible
   - Theme color: "#000000"

**Expected**: All manifest properties display correctly with no errors

#### 3. PWA Install Prompt

**Desktop (Chrome/Edge):**
1. Navigate to `/dashboard/admin` or `/dashboard/sales-rep`
2. Look for the InstallPrompt card at the top of the page
3. Click "Install App" button
4. Browser will show install dialog
5. Click "Install"
6. App should open in standalone window

**Android (Chrome):**
1. Navigate to the dashboard
2. Browser will show "Add to Home Screen" prompt automatically
3. Or click three dots → "Install app"
4. Icon appears on home screen
5. Opening from home screen launches in standalone mode

**iOS (Safari 16.4+):**
1. Navigate to the dashboard
2. InstallPrompt shows iOS-specific instructions
3. Tap Share button → "Add to Home Screen"
4. App appears on home screen

**Expected**: App installs and opens without browser chrome (no URL bar, etc.)

#### 4. Push Notification Subscription

**Setup:**
1. Log in as an ADMIN user
2. Navigate to `/dashboard/admin`
3. Find the "Push Notifications" card

**Enable Notifications:**
1. Click "Enable Notifications" button
2. Browser prompts for notification permission
3. Click "Allow"
4. Card updates to show "Notifications enabled" with subscription status
5. Button changes to "Disable Notifications"

**Verify in Database:**
```sql
SELECT * FROM push_subscriptions WHERE "userId" = 'your-user-id';
```
You should see a record with endpoint, p256dh, auth, and isActive=true

**Expected**: Subscription created successfully, stored in database

#### 5. Order Delivered Notification (Admin)

**Test Flow:**
1. Ensure at least one admin has notifications enabled
2. Log in as a SALES_REP user
3. Navigate to an order in DISPATCHED status
4. Change status to DELIVERED
5. Click "Update Status"

**Admin Should Receive:**
- Push notification with title "Order Delivered 🎉"
- Body: "Order [NUMBER] has been delivered to [CUSTOMER]"
- Clicking notification opens the order details page
- Notification appears even if browser is in background

**Verify:**
- Check browser notification center
- Click notification → should navigate to `/dashboard/admin/orders/[id]`
- If browser is closed, notification still appears (OS level)

**Expected**: Admin receives notification immediately, can click to view order

#### 6. Order Assigned Notification (Sales Rep)

**Test Flow:**
1. Log in as a SALES_REP user and enable notifications
2. Log out and create a new order via the public order form at `/order-form`
3. Fill out the form and submit
4. Order is automatically assigned to next sales rep in rotation

**Sales Rep Should Receive:**
- Push notification with title "New Order Assigned 📦"
- Body: "Order [NUMBER] from [CUSTOMER] has been assigned to you"
- Clicking notification opens the order details page

**Expected**: Assigned sales rep receives notification immediately

#### 7. Multiple Device Support

1. Log in on desktop browser and enable notifications
2. Log in on mobile browser and enable notifications
3. Trigger a notification event
4. Both devices should receive the notification

**Expected**: Notifications sent to all active subscriptions for the user

#### 8. Unsubscribe

1. In the PushNotificationManager card, click "Disable Notifications"
2. Card updates to show "Enable Notifications" button
3. Trigger a notification event
4. User should NOT receive notification

**Verify in Database:**
```sql
SELECT "isActive" FROM push_subscriptions WHERE "userId" = 'your-user-id';
```
Should show isActive=false

**Expected**: No notifications received after unsubscribing

#### 9. Offline Functionality

1. Install the PWA
2. Open in standalone mode
3. Open DevTools → Network tab
4. Enable "Offline" mode
5. Try to navigate within the app

**Expected**: App should still load cached pages and show offline indicator

### Browser Compatibility Testing

Test on the following browsers:

#### Desktop
- ✅ Chrome 90+ (Full support)
- ✅ Edge 90+ (Full support)
- ✅ Firefox 90+ (Full support)
- ⚠️ Safari 16.4+ (Push notifications require iOS 16.4+)

#### Mobile
- ✅ Chrome Android (Full support)
- ✅ Firefox Android (Full support)
- ✅ Safari iOS 16.4+ (Full support)
- ❌ Safari iOS < 16.4 (No push notifications)

### Common Issues & Solutions

#### Issue: Service Worker Not Registering
**Solution**:
- Ensure you're using HTTPS (or localhost)
- Check DevTools console for errors
- Clear browser cache and reload

#### Issue: Notifications Not Received
**Solution**:
- Check notification permissions in browser settings
- Verify subscription exists in database
- Check server logs for push sending errors
- Ensure VAPID keys are correctly set in .env

#### Issue: Install Prompt Doesn't Show
**Solution**:
- PWA must meet all criteria (HTTPS, manifest, service worker, etc.)
- Chrome requires at least 30 seconds of engagement before showing prompt
- May be hidden if user previously dismissed it

#### Issue: 410 Gone Error When Sending Push
**Solution**:
- This means the subscription is no longer valid
- System automatically marks subscription as inactive
- User needs to re-enable notifications

### Development Tips

#### View Notifications in DevTools
1. Open DevTools → Application → Notifications
2. See all notifications sent to the app
3. Test notification display without actual push

#### Reset PWA State
To start fresh during testing:
```javascript
// Run in browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister())
})
```
Then reload the page.

#### Monitor Push Notifications
Add logging to see when notifications are sent:
```javascript
// In push-notifications.ts, the sendPushToUsers function logs results
// Check server console for: "Failed to send to subscription..."
```

### Production Checklist

Before deploying to production:

1. ✅ Database migration completed
2. ✅ App icons properly sized and optimized
3. ⚠️ Generate NEW VAPID keys for production (don't use dev keys)
4. ⚠️ Update .env on hosting platform
5. ✅ HTTPS enabled
6. ⚠️ Test on real devices (not just localhost)
7. ⚠️ Monitor notification delivery rates
8. ⚠️ Set up periodic cleanup of stale subscriptions

### Monitoring & Maintenance

#### Track Notification Success Rate
```sql
-- Active subscriptions
SELECT COUNT(*) as active_subscriptions
FROM push_subscriptions
WHERE "isActive" = true;

-- Recently used subscriptions (last 7 days)
SELECT COUNT(*) as recent_subscriptions
FROM push_subscriptions
WHERE "isActive" = true
AND "lastUsedAt" > NOW() - INTERVAL '7 days';

-- Inactive subscriptions (stale)
SELECT COUNT(*) as stale_subscriptions
FROM push_subscriptions
WHERE "isActive" = false;
```

#### Clean Up Stale Subscriptions
```sql
-- Delete subscriptions inactive for more than 30 days
DELETE FROM push_subscriptions
WHERE "isActive" = false
AND "updatedAt" < NOW() - INTERVAL '30 days';
```

## Next Steps

1. **Test thoroughly** using this guide
2. **Generate new VAPID keys** for production
3. **Deploy to production** with HTTPS
4. **Monitor** notification delivery and subscription rates
5. **Gather feedback** from users
6. **Iterate** based on usage patterns

## Support Resources

- [Web Push Notifications](https://web.dev/push-notifications-overview/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Best Practices](https://web.dev/pwa/)
- [VAPID Authentication](https://blog.mozilla.org/services/2016/08/23/sending-vapid-identified-webpush-notifications-via-mozillas-push-service/)

---

**Ready to test!** Start with the Service Worker Registration test and work through the checklist systematically.

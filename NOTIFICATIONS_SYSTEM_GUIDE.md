# In-App Notifications System - User Guide

## Overview

The in-app notifications system provides a persistent notification center that tracks all important events within the Ordo CRM. Unlike push notifications (which are temporary), in-app notifications remain until you read or delete them, creating a complete history of activities.

## Features

✅ **Notification Bell with Badge** - Shows unread count in real-time
✅ **Dropdown Preview** - Quick view of recent notifications
✅ **Full Notifications Page** - Complete notification history
✅ **Smart Filtering** - View all or unread only
✅ **Mark as Read** - Individually or bulk actions
✅ **Auto-refresh** - Updates every 30 seconds
✅ **Click to Navigate** - Jump directly to related content
✅ **Pagination** - Efficient handling of large notification lists
✅ **Type-based Icons** - Visual indicators for notification types
✅ **Relative Timestamps** - Human-readable time (e.g., "2 hours ago")

## Notification Types

### 1. ORDER_ASSIGNED (Blue)
**Who receives**: Sales Rep
**When**: A new order is assigned to them via round-robin
**Message**: "Order [NUMBER] from [CUSTOMER] has been assigned to you"
**Action**: Click to view order details

### 2. ORDER_DELIVERED (Green)
**Who receives**: All Admins
**When**: A sales rep marks an order as DELIVERED
**Message**: "Order [NUMBER] has been delivered to [CUSTOMER]"
**Action**: Click to view order details

### 3. ORDER_STATUS_CHANGED (Purple)
**Who receives**: Relevant users
**When**: Order status changes (CONFIRMED, DISPATCHED, etc.)
**Message**: "Order [NUMBER] status changed from [OLD] to [NEW]"
**Action**: Click to view order details

### 4. ORDER_NOTE_ADDED (Orange)
**Who receives**: Order assignee
**When**: Someone adds a note to an order
**Message**: "[USER] added a note to order [NUMBER]"
**Action**: Click to view order and note

### 5. LOW_STOCK_ALERT (Red)
**Who receives**: Inventory Managers
**When**: Product stock falls below reorder point
**Message**: "Low stock alert: [PRODUCT] has only [COUNT] items remaining"
**Action**: Click to view inventory

### 6. NEW_ORDER (Blue)
**Who receives**: Admins
**When**: A new order is created
**Message**: "New order [NUMBER] received from [CUSTOMER]"
**Action**: Click to view order details

### 7. GENERAL (Gray)
**Who receives**: Varies
**When**: System-wide announcements or updates
**Message**: Custom message
**Action**: Optional link

## User Interface

### Notification Bell (Dashboard Header)

Located in the top-right corner of the dashboard:

**Icon States**:
- **Bell with red badge**: You have unread notifications
- **Plain bell**: No unread notifications
- **Badge number**: Shows count (99+ if more than 99)

**Interaction**:
- Click to open notification dropdown
- Auto-refreshes count every 30 seconds
- Badge updates immediately when notifications are read

### Notification Dropdown

Quick preview of recent notifications:

**Layout**:
- Header showing unread count
- "Mark all read" button (if unread exist)
- List of last 10 notifications
- "View all notifications" link at bottom

**Features**:
- Unread notifications have blue background
- Blue dot indicator for unread items
- Click notification to mark as read and navigate
- Scrollable list

### Notifications Page (/dashboard/notifications)

Full notification center with complete history:

**Sections**:
1. **Header** - Title and description
2. **Filter Tabs** - Switch between "All" and "Unread"
3. **Action Buttons** - "Mark all read" and "Delete read"
4. **Notifications List** - All notifications with full details
5. **Pagination** - Navigate through pages (20 per page)

**Filtering**:
- **All** - Shows every notification
- **Unread** - Shows only unread notifications
- Filter persists in URL (can bookmark)

**Bulk Actions**:
- **Mark all read** - Marks all notifications as read instantly
- **Delete read** - Permanently deletes all read notifications (with confirmation)

## How to Use

### View Notifications

**Quick View**:
1. Click the bell icon in dashboard header
2. Dropdown shows recent notifications
3. Scroll to see more (up to 10)
4. Click "View all notifications" for full list

**Full View**:
1. Go to `/dashboard/notifications` directly
2. Or click "View all notifications" from dropdown
3. Use tabs to filter All/Unread
4. Scroll and paginate through all notifications

### Read a Notification

**Method 1 - Click to Read**:
1. Click any notification in dropdown or list
2. Automatically marked as read
3. Navigates to related content (if link provided)
4. Badge count decreases

**Method 2 - Mark as Read Button**:
1. In notifications page
2. Click "Mark all read" to read all at once
3. Badge clears to zero

### Delete Notifications

**Delete All Read**:
1. Go to `/dashboard/notifications`
2. Click "Delete read" button
3. Confirm in dialog
4. All read notifications permanently deleted

**Why Delete?**:
- Keep notifications list clean
- Focus on unread/important items
- Reduce database storage over time

## Notification Behavior

### Real-time Updates

- **30-second polling**: System checks for new notifications every 30 seconds
- **Instant on action**: Badge updates immediately when you read notifications
- **Page updates**: Notifications page refreshes when filtering or taking actions

### Read Status

- **Unread** (blue background, blue dot):
  - New notifications start unread
  - Badge counts these notifications
  - Shown in "Unread" filter

- **Read** (normal background, no dot):
  - Clicked notifications become read
  - "Mark as read" makes them read
  - Can still view in "All" filter

### Navigation

When you click a notification:
1. Marks as read automatically
2. Closes dropdown (if open)
3. Navigates to related page:
   - Orders → Order detail page
   - Products → Inventory page
   - General → Custom link or dashboard

## For Admins

Admins receive more notifications than other roles:

**Notifications Received**:
- ORDER_DELIVERED - When any order is delivered
- NEW_ORDER - When new orders are created (optional)
- LOW_STOCK_ALERT - When products need restocking
- GENERAL - System-wide announcements

**Best Practices**:
- Check notifications at start of day
- Use "Mark all read" after reviewing
- Delete old read notifications weekly
- Filter by "Unread" to focus on new items

## For Sales Reps

Sales reps get targeted notifications about their work:

**Notifications Received**:
- ORDER_ASSIGNED - New orders assigned to you
- ORDER_NOTE_ADDED - Notes on your orders
- ORDER_STATUS_CHANGED - Status updates on your orders

**Workflow**:
1. New order assigned → Receive notification
2. Click notification → View order details
3. Process order → Update status
4. Check bell regularly for new assignments

## For Inventory Managers

Inventory managers monitor stock levels:

**Notifications Received**:
- LOW_STOCK_ALERT - Products below reorder point
- ORDER_DELIVERED - Orders that reduced stock
- GENERAL - System announcements

**Usage**:
- Enable notifications for stock alerts
- Review daily to prevent stockouts
- Act on low stock notifications promptly

## Technical Details

### Database

**Table**: `notifications`

**Fields**:
- `id` - Unique identifier
- `userId` - Recipient user ID
- `type` - Notification type (enum)
- `title` - Short title (e.g., "Order Assigned")
- `message` - Full message text
- `link` - Optional URL to navigate to
- `orderId` - Optional order reference
- `isRead` - Read status (boolean)
- `createdAt` - Timestamp
- `updatedAt` - Last modified

**Indexes**:
- `userId + isRead` - Fast unread queries
- `userId + createdAt` - Efficient pagination

### Performance

**Optimizations**:
- Pagination (20 per page) prevents slow queries
- Indexes on common query patterns
- Polling (not WebSocket) reduces server load
- Lazy loading - only fetches when needed

**Scaling**:
- Notifications auto-archived after 90 days (optional)
- Bulk delete for cleanup
- Efficient count queries for badges

### API Endpoints

All accessed via Server Actions:

- `getUserNotifications()` - Get paginated list
- `getUnreadCount()` - Get badge count
- `getRecentNotifications()` - Get dropdown data
- `markAsRead(id)` - Mark single as read
- `markAllAsRead()` - Bulk mark as read
- `deleteNotification(id)` - Delete single
- `deleteAllRead()` - Bulk delete

## Integration Points

The notification system integrates with:

1. **Order Creation** (`app/actions/orders.ts`):
   - Creates ORDER_ASSIGNED notification
   - Sends to assigned sales rep

2. **Order Status Updates** (`app/dashboard/sales-rep/orders/[id]/actions.ts`):
   - Creates ORDER_DELIVERED notification
   - Sends to all admins

3. **Future Integrations** (coming soon):
   - Order notes → ORDER_NOTE_ADDED
   - Low stock → LOW_STOCK_ALERT
   - Status changes → ORDER_STATUS_CHANGED

## Troubleshooting

### Notifications Not Showing

**Issue**: Bell icon shows no notifications

**Solutions**:
1. Wait up to 30 seconds (polling interval)
2. Refresh the page manually
3. Check if you're logged in
4. Verify your role has access

### Badge Count Incorrect

**Issue**: Badge shows wrong number

**Solutions**:
1. Click "Mark all read" then refresh
2. Hard refresh page (Ctrl+F5)
3. Clear browser cache
4. Check database directly

### Can't Mark as Read

**Issue**: Notifications stay unread

**Solutions**:
1. Check network connection
2. Verify you own the notification
3. Try "Mark all read" instead
4. Check browser console for errors

### Notifications Deleted Accidentally

**Issue**: Important notification deleted

**Solutions**:
- Notifications can't be recovered once deleted
- Check order history directly
- Use "All" filter before deleting in future
- Only delete read notifications you don't need

## Best Practices

### For All Users

1. **Check regularly**: Look at bell icon 2-3 times per day
2. **Act on notifications**: Don't let them pile up
3. **Mark as read**: Keep unread count manageable
4. **Delete old ones**: Clean up weekly
5. **Use filters**: Focus on unread when busy

### For Admins

1. **Daily review**: Check all ORDER_DELIVERED notifications
2. **Stock alerts**: Act on LOW_STOCK_ALERT immediately
3. **Delegate**: Forward important notifications to team
4. **Archive**: Delete old notifications monthly
5. **Monitor**: Watch for patterns (frequent stock alerts, etc.)

### For Sales Reps

1. **Immediate action**: Check ORDER_ASSIGNED ASAP
2. **Follow up**: Don't miss ORDER_NOTE_ADDED
3. **Stay current**: Keep unread count at zero
4. **Mobile**: Enable push notifications too
5. **End of day**: Review all notifications before logging off

## Future Enhancements

Planned features for future releases:

- [ ] Notification preferences (choose which types to receive)
- [ ] Email digest (daily summary of notifications)
- [ ] Notification sounds (optional audio alerts)
- [ ] Rich notifications (embedded images, actions)
- [ ] Notification search (find specific notifications)
- [ ] Export notifications (download as CSV)
- [ ] Notification templates (custom notification types)
- [ ] Scheduled notifications (send at specific time)
- [ ] Notification analytics (most common types, read rates)

## Support

### Getting Help

- Check this guide first
- Review the Troubleshooting section
- Contact your admin for permission issues
- Report bugs to development team

### Providing Feedback

We want to improve the notification system:
- What notification types are missing?
- Is the polling interval too slow/fast?
- Should we add notification sounds?
- Any UI/UX improvements needed?

---

**Version**: 1.0
**Last Updated**: January 2026
**Author**: Ordo Development Team

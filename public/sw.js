self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()

    // Always show browser notification regardless of app state
    const options = {
      body: data.body,
      icon: data.icon || '/icon.png',
      badge: '/badge.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/dashboard',
        orderId: data.orderId,
      },
      actions: data.actions || [],
      tag: data.tag || 'ordo-notification',
      requireInteraction: data.requireInteraction || false,
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received.')
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        // If app is already open, focus it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus()
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Optional: Background sync for offline order submission
self.addEventListener('sync', function (event) {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders())
  }
})

async function syncOrders() {
  // Implement background sync logic if needed
  console.log('Syncing orders in background')
}

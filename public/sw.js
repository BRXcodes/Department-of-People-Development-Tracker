/* Service Worker for Push Notifications */

self.addEventListener('push', (event) => {
  let data = { title: 'Task Reminder', body: 'You have tasks to complete today.' }
  try {
    data = event.data.json()
  } catch (e) {
    // use defaults
  }

  const options = {
    body: data.body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: { url: self.location.origin },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})

export interface Notification {
  id: string
  userId: string
  orderId: string
  type: "order_ready" | "order_completed" | "order_cancelled"
  title: string
  message: string
  read: boolean
  createdAt: string
}

const NOTIFICATIONS_STORAGE_KEY = "cochinita-notifications"

export const notificationsStore = {
  getNotifications: (userId: string): Notification[] => {
    if (typeof window === "undefined") return []
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
      const all = stored ? JSON.parse(stored) : []
      return all.filter((n: Notification) => n.userId === userId)
    } catch {
      return []
    }
  },

  addNotification: (notification: Omit<Notification, "id" | "createdAt">) => {
    if (typeof window === "undefined") return
    try {
      const all = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
      const notifications = all ? JSON.parse(all) : []
      const newNotification: Notification = {
        ...notification,
        id: `NOTIF-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
      notifications.push(newNotification)
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications))

      // Show browser notification if available
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          tag: `order-${notification.orderId}`,
        })
      }
    } catch {
      console.error("Failed to save notification")
    }
  },

  markAsRead: (notificationId: string) => {
    if (typeof window === "undefined") return
    try {
      const all = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
      const notifications = all ? JSON.parse(all) : []
      const index = notifications.findIndex((n: Notification) => n.id === notificationId)
      if (index !== -1) {
        notifications[index].read = true
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications))
      }
    } catch {
      console.error("Failed to mark notification as read")
    }
  },

  deleteNotification: (notificationId: string) => {
    if (typeof window === "undefined") return
    try {
      const all = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
      const notifications = all ? JSON.parse(all) : []
      const filtered = notifications.filter((n: Notification) => n.id !== notificationId)
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(filtered))
    } catch {
      console.error("Failed to delete notification")
    }
  },

  getUnreadCount: (userId: string): number => {
    const notifications = notificationsStore.getNotifications(userId)
    return notifications.filter((n) => !n.read).length
  },
}

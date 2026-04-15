"use client"

import { useState, useEffect } from "react"
import { notificationsStore, type Notification } from "@/lib/notifications-store"

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!userId) return

    const loadNotifications = () => {
      const notifs = notificationsStore.getNotifications(userId)
      setNotifications(notifs)
    }

    loadNotifications()
    setIsLoaded(true)

    const interval = setInterval(() => {
      const updated = notificationsStore.getNotifications(userId)
      setNotifications(updated)
    }, 5000)

    return () => clearInterval(interval)
  }, [userId])

  const markAsRead = (notificationId: string) => {
    notificationsStore.markAsRead(notificationId)
    const updated = notificationsStore.getNotifications(userId || "")
    setNotifications(updated)
  }

  const deleteNotification = (notificationId: string) => {
    notificationsStore.deleteNotification(notificationId)
    const updated = notificationsStore.getNotifications(userId || "")
    setNotifications(updated)
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    isLoaded,
    unreadCount,
    markAsRead,
    deleteNotification,
  }
}

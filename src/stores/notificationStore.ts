import type { HubConnection } from '@microsoft/signalr'
import type { AppNotification, NotificationConnectionStatus, NotificationPayload } from '@/types/notifications'
import * as signalR from '@microsoft/signalr'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

export function deriveNotificationHubUrl(apiBaseUrl = API_BASE_URL): string {
  const trimmed = apiBaseUrl.replace(/\/+$/, '')
  if (trimmed.endsWith('/api'))
    return `${trimmed.slice(0, -4)}/notificationHub`

  return `${trimmed}/notificationHub`
}

function normalizeNotification(payload: NotificationPayload): AppNotification {
  const timestamp = payload.timestamp || new Date().toISOString()

  return {
    ...payload,
    timestamp,
    id: `${timestamp}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`,
    read: false,
    receivedAt: new Date().toISOString(),
  }
}

export const useNotificationStore = defineStore('notificationStore', () => {
  const connection = shallowRef<HubConnection | null>(null)
  const status = ref<NotificationConnectionStatus>('idle')
  const notifications = ref<AppNotification[]>([])
  const latestNotification = shallowRef<AppNotification | null>(null)

  const unreadCount = computed(() => notifications.value.filter(notification => !notification.read).length)
  const hubUrl = computed(() => deriveNotificationHubUrl())

  const MAX_NOTIFICATIONS = 100

  function recordNotification(payload: NotificationPayload): AppNotification {
    const notification = normalizeNotification(payload)
    notifications.value = [notification, ...notifications.value].slice(0, MAX_NOTIFICATIONS)
    latestNotification.value = notification
    return notification
  }

  function createConnection(): HubConnection {
    const nextConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl.value, { withCredentials: true })
      .withAutomaticReconnect()
      .build()

    nextConnection.on('ReceiveNotification', recordNotification)
    nextConnection.onreconnecting(() => {
      status.value = 'reconnecting'
    })
    nextConnection.onreconnected(() => {
      status.value = 'connected'
    })
    nextConnection.onclose(() => {
      // Only clear store state if this is still the active connection
      if (connection.value === nextConnection) {
        status.value = 'disconnected'
        connection.value = null
      }
    })

    return nextConnection
  }

  async function start(): Promise<void> {
    if (status.value === 'connecting' || status.value === 'connected' || status.value === 'reconnecting')
      return

    if (!connection.value)
      connection.value = createConnection()

    const startingConnection = connection.value
    status.value = 'connecting'
    try {
      await startingConnection.start()
      if (connection.value === startingConnection)
        status.value = 'connected'
      else
        await startingConnection.stop()
    }
    catch (error) {
      if (connection.value === startingConnection) {
        status.value = 'error'
        connection.value = null
        throw error
      }
    }
  }

  async function stop(): Promise<void> {
    const currentConnection = connection.value
    connection.value = null
    status.value = 'disconnected'

    if (currentConnection)
      await currentConnection.stop()
  }

  async function reset(): Promise<void> {
    await stop()
    notifications.value = []
    latestNotification.value = null
    status.value = 'idle'
  }

  function markAllRead(): void {
    notifications.value = notifications.value.map(notification => ({ ...notification, read: true }))
  }

  function markRead(notificationId: string): void {
    notifications.value = notifications.value.map((notification) => {
      if (notification.id !== notificationId)
        return notification

      return { ...notification, read: true }
    })
  }

  return {
    status,
    notifications,
    latestNotification,
    unreadCount,
    hubUrl,
    start,
    stop,
    reset,
    markAllRead,
    markRead,
  }
})

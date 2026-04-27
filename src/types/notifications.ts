export type NotificationType = 'Info' | 'Success' | 'Warning' | 'Error' | string

export type NotificationCategory = 'QrCode' | 'Session' | 'Attendance' | string

export type NotificationConnectionStatus
  = | 'idle'
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'disconnected'
    | 'error'

export interface NotificationPayload {
  title: string
  message: string
  type: NotificationType
  category: NotificationCategory
  metadata?: unknown
  timestamp?: string
}

export interface AppNotification extends NotificationPayload {
  id: string
  read: boolean
  receivedAt: string
}

import type { NotificationPayload } from '@/types/notifications'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deriveNotificationHubUrl, useNotificationStore } from '@/stores/notificationStore'

interface MockConnection {
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  on: ReturnType<typeof vi.fn>
  off: ReturnType<typeof vi.fn>
  onreconnecting: ReturnType<typeof vi.fn>
  onreconnected: ReturnType<typeof vi.fn>
  onclose: ReturnType<typeof vi.fn>
  handlers: Record<string, ((payload: NotificationPayload) => void)[]>
  reconnecting?: () => void
  reconnected?: () => void
  closed?: () => void
}

const signalRMock = vi.hoisted(() => {
  const connections: MockConnection[] = []
  const withUrl = vi.fn()
  const withAutomaticReconnect = vi.fn()
  const build = vi.fn()

  function createConnection(): MockConnection {
    return {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      handlers: {},
      on: vi.fn((eventName: string, handler: (payload: NotificationPayload) => void) => {
        const conn = connections.at(-1)!
        if (!conn.handlers[eventName])
          conn.handlers[eventName] = []
        conn.handlers[eventName]!.push(handler)
      }),
      off: vi.fn((eventName: string, handler: (payload: NotificationPayload) => void) => {
        const conn = connections.at(-1)!
        const list = conn.handlers[eventName]
        if (list) {
          const idx = list.indexOf(handler)
          if (idx !== -1)
            list.splice(idx, 1)
        }
      }),
      onreconnecting: vi.fn((handler: () => void) => {
        connections.at(-1)!.reconnecting = handler
      }),
      onreconnected: vi.fn((handler: () => void) => {
        connections.at(-1)!.reconnected = handler
      }),
      onclose: vi.fn((handler: () => void) => {
        connections.at(-1)!.closed = handler
      }),
    }
  }

  class HubConnectionBuilder {
    withUrl = withUrl.mockReturnThis()
    withAutomaticReconnect = withAutomaticReconnect.mockReturnThis()
    build = build.mockImplementation(() => {
      const connection = createConnection()
      connections.push(connection)
      return connection
    })
  }

  return { HubConnectionBuilder, connections, withUrl, withAutomaticReconnect, build }
})

vi.mock('@microsoft/signalr', () => signalRMock)

function createPayload(overrides: Partial<NotificationPayload> = {}): NotificationPayload {
  return {
    title: 'QR Code Generated',
    message: 'QR code generated successfully.',
    type: 'Success',
    category: 'QrCode',
    timestamp: '2026-04-27T01:02:03Z',
    metadata: { qrCodeId: 'qr-1', sessionId: 'session-1' },
    ...overrides,
  }
}

describe('notificationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signalRMock.connections.length = 0
    setActivePinia(createPinia())
  })

  it('derives the SignalR hub URL from the configured API base URL', () => {
    expect(deriveNotificationHubUrl('https://api.example.test/api')).toBe('https://api.example.test/notificationHub')
    expect(deriveNotificationHubUrl('https://api.example.test/api/')).toBe('https://api.example.test/notificationHub')
    expect(deriveNotificationHubUrl('https://api.example.test')).toBe('https://api.example.test/notificationHub')
  })

  it('starts with credentials and automatic reconnect enabled', async () => {
    const store = useNotificationStore()

    await store.start()

    expect(signalRMock.withUrl).toHaveBeenCalledWith('http://localhost:8080/notificationHub', { withCredentials: true })
    expect(signalRMock.withAutomaticReconnect).toHaveBeenCalledTimes(1)
    expect(signalRMock.connections[0]?.start).toHaveBeenCalledTimes(1)
    expect(signalRMock.connections[0]?.on).toHaveBeenCalledWith('ReceiveNotification', expect.any(Function))
    expect(store.status).toBe('connected')
  })

  it('does not create duplicate connections while startup is already connecting', async () => {
    let resolveStart: () => void = () => {}
    const startPromise = new Promise<void>((resolve) => {
      resolveStart = resolve
    })
    signalRMock.build.mockImplementationOnce(() => {
      const connection = {
        start: vi.fn().mockReturnValue(startPromise),
        stop: vi.fn().mockResolvedValue(undefined),
        handlers: {},
        on: vi.fn(),
        off: vi.fn(),
        onreconnecting: vi.fn(),
        onreconnected: vi.fn(),
        onclose: vi.fn(),
      } as MockConnection
      signalRMock.connections.push(connection)
      return connection
    })

    const store = useNotificationStore()
    const firstStart = store.start()
    const secondStart = store.start()

    expect(signalRMock.build).toHaveBeenCalledTimes(1)
    expect(signalRMock.connections[0]?.start).toHaveBeenCalledTimes(1)

    resolveStart()
    await firstStart
    await secondStart
  })

  it('updates reconnect and closed status callbacks', async () => {
    const store = useNotificationStore()

    await store.start()
    signalRMock.connections[0]!.reconnecting?.()
    expect(store.status).toBe('reconnecting')

    signalRMock.connections[0]!.reconnected?.()
    expect(store.status).toBe('connected')

    signalRMock.connections[0]!.closed?.()
    expect(store.status).toBe('disconnected')
  })

  it('stops the current connection', async () => {
    const store = useNotificationStore()
    await store.start()

    await store.stop()

    expect(signalRMock.connections[0]?.stop).toHaveBeenCalledTimes(1)
    expect(store.status).toBe('disconnected')
  })

  it('does not report connected when stopped during startup', async () => {
    let resolveStart: () => void = () => {}
    const startPromise = new Promise<void>((resolve) => {
      resolveStart = resolve
    })
    signalRMock.build.mockImplementationOnce(() => {
      const connection = {
        start: vi.fn().mockReturnValue(startPromise),
        stop: vi.fn().mockResolvedValue(undefined),
        handlers: {},
        on: vi.fn(),
        off: vi.fn(),
        onreconnecting: vi.fn(),
        onreconnected: vi.fn(),
        onclose: vi.fn(),
      } as MockConnection
      signalRMock.connections.push(connection)
      return connection
    })

    const store = useNotificationStore()
    const startup = store.start()
    await store.stop()

    resolveStart()
    await startup

    expect(signalRMock.connections[0]?.stop).toHaveBeenCalled()
    expect(store.status).toBe('disconnected')
  })

  it('records ReceiveNotification payloads, preserves metadata, increments unread count, and marks read', async () => {
    const store = useNotificationStore()
    await store.start()

    signalRMock.connections[0]!.handlers.ReceiveNotification![0](createPayload())

    expect(store.notifications).toHaveLength(1)
    expect(store.unreadCount).toBe(1)
    expect(store.notifications[0]).toMatchObject({
      title: 'QR Code Generated',
      message: 'QR code generated successfully.',
      type: 'Success',
      category: 'QrCode',
      timestamp: '2026-04-27T01:02:03Z',
      metadata: { qrCodeId: 'qr-1', sessionId: 'session-1' },
      read: false,
    })

    store.markRead(store.notifications[0]!.id)
    expect(store.unreadCount).toBe(0)

    signalRMock.connections[0]!.handlers.ReceiveNotification![0](createPayload({ title: 'Session Started' }))
    expect(store.unreadCount).toBe(1)

    store.markAllRead()
    expect(store.unreadCount).toBe(0)
  })

  it('reset stops the connection and clears volatile notification state', async () => {
    const store = useNotificationStore()
    await store.start()
    signalRMock.connections[0]!.handlers.ReceiveNotification![0](createPayload())

    await store.reset()

    expect(signalRMock.connections[0]?.stop).toHaveBeenCalledTimes(1)
    expect(store.notifications).toEqual([])
    expect(store.latestNotification).toBe(null)
    expect(store.status).toBe('idle')
  })

  it('caps notifications at MAX_NOTIFICATIONS (100)', async () => {
    const store = useNotificationStore()
    await store.start()

    // Add more than 100 notifications
    for (let i = 0; i < 150; i++) {
      signalRMock.connections[0]!.handlers.ReceiveNotification![0](createPayload({ title: `Notification ${i}` }))
    }

    // Should be capped at 100
    expect(store.notifications).toHaveLength(100)
    // Most recent notification should be first
    expect(store.notifications[0]?.title).toBe('Notification 149')
  })

  it('registerHandler before start defers binding until connection is created', async () => {
    const store = useNotificationStore()
    const handler = vi.fn()

    store.registerHandler('DeviceStatusUpdate', handler)
    expect(signalRMock.connections).toHaveLength(0)

    await store.start()
    expect(signalRMock.connections[0]!.on).toHaveBeenCalledWith('DeviceStatusUpdate', handler)
  })

  it('registerHandler after start binds immediately to active connection', async () => {
    const store = useNotificationStore()
    await store.start()

    const handler = vi.fn()
    store.registerHandler('CustomEvent', handler)

    expect(signalRMock.connections[0]!.on).toHaveBeenCalledWith('CustomEvent', handler)
  })

  it('unregisterHandler removes handler from connection and registry', async () => {
    const store = useNotificationStore()
    await store.start()

    const handler = vi.fn()
    store.registerHandler('DeviceStatusUpdate', handler)
    store.unregisterHandler('DeviceStatusUpdate', handler)

    expect(signalRMock.connections[0]!.off).toHaveBeenCalledWith('DeviceStatusUpdate', handler)
  })

  it('unregisterHandler cleans up empty event entries', async () => {
    const store = useNotificationStore()
    const handler = vi.fn()

    store.registerHandler('DeviceStatusUpdate', handler)
    store.unregisterHandler('DeviceStatusUpdate', handler)

    await store.start()
    const deviceCalls = signalRMock.connections[0]!.on.mock.calls.filter(
      (call: [string, unknown]) => call[0] === 'DeviceStatusUpdate',
    )
    expect(deviceCalls).toHaveLength(0)
  })

  it('binds multiple handlers for the same event', async () => {
    const store = useNotificationStore()
    const handlerA = vi.fn()
    const handlerB = vi.fn()

    store.registerHandler('DeviceStatusUpdate', handlerA)
    store.registerHandler('DeviceStatusUpdate', handlerB)
    await store.start()

    expect(signalRMock.connections[0]!.on).toHaveBeenCalledWith('DeviceStatusUpdate', handlerA)
    expect(signalRMock.connections[0]!.on).toHaveBeenCalledWith('DeviceStatusUpdate', handlerB)
  })

  it('registered handlers survive connection reset (stop/start)', async () => {
    const store = useNotificationStore()
    const handler = vi.fn()

    store.registerHandler('DeviceStatusUpdate', handler)
    await store.start()
    expect(signalRMock.connections[0]!.on).toHaveBeenCalledWith('DeviceStatusUpdate', handler)

    await store.stop()
    await store.start()

    expect(signalRMock.connections[1]!.on).toHaveBeenCalledWith('DeviceStatusUpdate', handler)
  })
})

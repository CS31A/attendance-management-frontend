import type { QrCodeResponseDto } from '@/api/qrCode'
import type { SessionResponseDto } from '@/api/sessions'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useQrCodeStore } from '@/stores/qrCodeStore'
import { useSessionStore } from '@/stores/sessionStore'
import SessionDetailView from '@/views/SessionDetailView.vue'

const route = { params: { sessionId: 'session-1' } }
const push = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push }),
}))

vi.mock('@/utils/date', () => ({
  formatShortWeekdayDateWithYear: vi.fn(() => 'Fri, Mar 15, 2024'),
  parseUtcDate: vi.fn((value: string | Date | null | undefined) => {
    if (!value)
      return null
    if (value instanceof Date)
      return value
    return new Date(value)
  }),
  formatDateTime: vi.fn((value: string | undefined) => value ? `formatted ${value}` : '-'),
}))

vi.mock('@/utils/qrcode', async () => {
  const actual = await vi.importActual<typeof import('@/utils/qrcode')>('@/utils/qrcode')
  return {
    ...actual,
    formatDateTime: vi.fn((value: string | undefined) => value ? `formatted ${value}` : '-'),
  }
})

function createSession(overrides: Partial<SessionResponseDto> = {}): SessionResponseDto {
  return {
    id: 'session-1',
    status: 'ended',
    sessionDate: '2024-03-15T00:00:00Z',
    subjectCode: 'CS101',
    subjectName: 'Data Structures',
    sectionName: 'A',
    scheduledRoomName: 'Room 101',
    scheduledStartTime: '08:00:00',
    scheduledEndTime: '09:00:00',
    description: 'Review session',
    ...overrides,
  }
}

function createQrCode(overrides: Partial<QrCodeResponseDto> = {}): QrCodeResponseDto {
  return {
    id: 'qr-1',
    isActive: true,
    generatedAt: '2024-03-15T07:55:00Z',
    expiresAt: '2099-03-15T08:30:00Z',
    usageCount: 4,
    maxUsage: 10,
    ...overrides,
  }
}

function mountView() {
  return mount(SessionDetailView, {
    global: {
      stubs: {
        SessionStatusBadge: true,
        QRDisplayModal: true,
        QRScanHistoryModal: true,
        AlertTriangle: true,
        ArrowLeft: true,
        Calendar: true,
        Check: true,
        Clock: true,
        Eye: true,
        History: true,
        MapPin: true,
        QrCode: true,
        RefreshCw: true,
      },
    },
  })
}

describe('session detail view', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('loads session details and QR codes with usage counts', async () => {
    const sessionStore = useSessionStore()
    const qrCodeStore = useQrCodeStore()
    const qrCodes = [createQrCode()]
    vi.spyOn(sessionStore, 'fetchSessionById').mockResolvedValue(createSession())
    vi.spyOn(qrCodeStore, 'fetchSessionQrCodes').mockImplementation(async () => {
      qrCodeStore.sessionQrCodes = qrCodes
      return qrCodes
    })

    const wrapper = mountView()
    await flushPromises()

    expect(sessionStore.fetchSessionById).toHaveBeenCalledWith('session-1')
    expect(qrCodeStore.fetchSessionQrCodes).toHaveBeenCalledWith('session-1')
    expect(wrapper.text()).toContain('CS101 - Data Structures')
    expect(wrapper.text()).toContain('Room 101')
    expect(wrapper.text()).toContain('Scheduled End')
    expect(wrapper.text()).toContain('9:00 AM')
    expect(wrapper.text()).toContain('4 / 10')
  })

  it('renders an empty QR state when no QR codes exist', async () => {
    const sessionStore = useSessionStore()
    const qrCodeStore = useQrCodeStore()
    vi.spyOn(sessionStore, 'fetchSessionById').mockResolvedValue(createSession())
    vi.spyOn(qrCodeStore, 'fetchSessionQrCodes').mockImplementation(async () => {
      qrCodeStore.sessionQrCodes = []
      return []
    })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('No QR Codes Generated')
  })

  it('renders session unavailable when the session load fails', async () => {
    const sessionStore = useSessionStore()
    const qrCodeStore = useQrCodeStore()
    vi.spyOn(sessionStore, 'fetchSessionById').mockRejectedValue(new Error('not found'))
    vi.spyOn(qrCodeStore, 'fetchSessionQrCodes').mockImplementation(async () => {
      qrCodeStore.sessionQrCodes = []
      return []
    })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Session Unavailable')
    expect(wrapper.text()).toContain('not found')
  })

  it('opens scan history for a QR code', async () => {
    const sessionStore = useSessionStore()
    const qrCodeStore = useQrCodeStore()
    const qrCodes = [createQrCode()]
    vi.spyOn(sessionStore, 'fetchSessionById').mockResolvedValue(createSession())
    vi.spyOn(qrCodeStore, 'fetchSessionQrCodes').mockImplementation(async () => {
      qrCodeStore.sessionQrCodes = qrCodes
      return qrCodes
    })

    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('button').find(button => button.text().includes('Scan History'))?.trigger('click')

    expect(wrapper.findComponent({ name: 'QRScanHistoryModal' }).exists()).toBe(true)
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const getMock = vi.fn()
const patchMock = vi.fn()

vi.mock('@/api/index', () => ({
  default: {
    get: getMock,
    patch: patchMock,
  },
}))

describe('schedules API', () => {
  beforeEach(() => {
    getMock.mockReset()
    patchMock.mockReset()
  })

  it('updates schedules with PATCH to match the backend route', async () => {
    const response = { data: { id: 5 } }
    patchMock.mockResolvedValue(response)

    const schedulesApi = await import('@/api/schedules')
    const result = await schedulesApi.updateSchedule(5, { dayOfWeek: 'Tuesday' })

    expect(patchMock).toHaveBeenCalledWith('/schedules/5', { dayOfWeek: 'Tuesday' })
    expect(result).toBe(response.data)
  })

  it('requests the schedule sessions dependency endpoint', async () => {
    getMock.mockResolvedValue({ data: true })

    const schedulesApi = await import('@/api/schedules')
    const result = await schedulesApi.hasSessionsInSchedule(9)

    expect(getMock).toHaveBeenCalledWith('/schedules/9/has-sessions')
    expect(result).toBe(true)
  })
})

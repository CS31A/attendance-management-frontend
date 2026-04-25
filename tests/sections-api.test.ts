import { beforeEach, describe, expect, it, vi } from 'vitest'

const getMock = vi.fn()

vi.mock('@/api/index', () => ({
  default: {
    get: getMock,
  },
}))

describe('sections API', () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it('requests the new boolean schedule dependency endpoint', async () => {
    const response = { data: true }
    getMock.mockResolvedValue(response)

    const sectionsApi = (await import('@/api/sections')).default
    const result = await sectionsApi.hasSchedulesInSection('42')

    expect(getMock).toHaveBeenCalledWith('/sections/42/has-schedules')
    expect(result).toBe(response)
  })
})

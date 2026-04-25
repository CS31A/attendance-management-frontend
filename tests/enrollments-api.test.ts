import { beforeEach, describe, expect, it, vi } from 'vitest'

const getMock = vi.fn()
const patchMock = vi.fn()

vi.mock('@/api/index', () => ({
  default: {
    get: getMock,
    patch: patchMock,
  },
}))

describe('enrollments API', () => {
  beforeEach(() => {
    getMock.mockReset()
    patchMock.mockReset()
  })

  it('uses canonical student route for guid identifiers', async () => {
    const response = { data: { studentId: '550e8400-e29b-41d4-a716-446655440000', enrollments: [] } }
    getMock.mockResolvedValue(response)

    const enrollmentsApi = await import('@/api/enrollments')
    await enrollmentsApi.default.getStudentEnrollments('550e8400-e29b-41d4-a716-446655440000')

    expect(getMock).toHaveBeenCalledWith('/StudentEnrollment/student/550e8400-e29b-41d4-a716-446655440000')
  })

  it('uses canonical section route for guid identifiers', async () => {
    const response = { data: [] }
    getMock.mockResolvedValue(response)

    const enrollmentsApi = await import('@/api/enrollments')
    await enrollmentsApi.default.getSectionStudents('550e8400-e29b-41d4-a716-446655440001')

    expect(getMock).toHaveBeenCalledWith('/StudentEnrollment/section/550e8400-e29b-41d4-a716-446655440001/students')
  })

  it('uses canonical drop route for guid identifiers', async () => {
    patchMock.mockResolvedValue({ data: {} })

    const enrollmentsApi = await import('@/api/enrollments')
    await enrollmentsApi.default.dropStudent('550e8400-e29b-41d4-a716-446655440002')

    expect(patchMock).toHaveBeenCalledWith('/StudentEnrollment/550e8400-e29b-41d4-a716-446655440002/drop')
  })

  it('uses canonical reenroll route for guid identifiers', async () => {
    patchMock.mockResolvedValue({ data: {} })

    const enrollmentsApi = await import('@/api/enrollments')
    await enrollmentsApi.default.reenrollStudent('550e8400-e29b-41d4-a716-446655440003')

    expect(patchMock).toHaveBeenCalledWith('/StudentEnrollment/550e8400-e29b-41d4-a716-446655440003/reenroll')
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const getMock = vi.fn()
const patchMock = vi.fn()
const postMock = vi.fn()

vi.mock('@/api/index', () => ({
  default: {
    get: getMock,
    patch: patchMock,
    post: postMock,
  },
}))

describe('schedules API', () => {
  beforeEach(() => {
    getMock.mockReset()
    patchMock.mockReset()
    postMock.mockReset()
  })

  it('creates schedules with UUID relation fields', async () => {
    const response = { data: { id: 'schedule-uuid' } }
    postMock.mockResolvedValue(response)

    const schedulesApi = await import('@/api/schedules')
    const payload = {
      dayOfWeek: 'Tuesday',
      timeIn: '10:00',
      timeOut: '11:00',
      subjectId: 'subject-uuid',
      classroomId: 'classroom-uuid',
      sectionId: 'section-uuid',
      instructorId: 'instructor-profile-uuid',
    }
    const result = await schedulesApi.createSchedule(payload)

    expect(postMock).toHaveBeenCalledWith('/schedules', payload)
    expect(result).toBe(response.data)
  })

  it('normalizes nested backend schedule relations into flat convenience fields', async () => {
    getMock.mockResolvedValue({
      data: [{
        id: 'schedule-uuid',
        timeIn: '08:00',
        timeOut: '09:00',
        subject: { id: 'subject-uuid', code: 'CS101', name: 'Data Structures' },
        classroom: { id: 'classroom-uuid', name: 'Room 101' },
        section: { id: 'section-uuid', name: 'BSCS 3A' },
        instructor: { id: 'instructor-uuid', firstname: 'Ada', lastname: 'Lovelace' },
      }],
    })

    const schedulesApi = await import('@/api/schedules')
    const result = await schedulesApi.getAllSchedules()

    expect(result[0]).toMatchObject({
      subjectId: 'subject-uuid',
      subjectCode: 'CS101',
      subjectName: 'Data Structures',
      classroomId: 'classroom-uuid',
      classroomName: 'Room 101',
      sectionId: 'section-uuid',
      sectionName: 'BSCS 3A',
      instructorId: 'instructor-uuid',
      instructorFirstName: 'Ada',
      instructorLastName: 'Lovelace',
    })
  })

  it('updates schedules with PATCH to match the backend route', async () => {
    const response = { data: { id: '5' } }
    patchMock.mockResolvedValue(response)

    const schedulesApi = await import('@/api/schedules')
    const result = await schedulesApi.updateSchedule('5', { dayOfWeek: 'Tuesday' })

    expect(patchMock).toHaveBeenCalledWith('/schedules/5', { dayOfWeek: 'Tuesday' })
    expect(result).toBe(response.data)
  })

  it('requests the schedule sessions dependency endpoint', async () => {
    const response = { data: true }
    getMock.mockResolvedValue(response)

    const schedulesApi = await import('@/api/schedules')
    const result = await schedulesApi.hasSessionsInSchedule('9')

    expect(getMock).toHaveBeenCalledWith('/schedules/9/has-sessions')
    expect(result).toBe(response)
  })
})

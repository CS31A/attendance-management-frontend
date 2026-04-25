import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import StudentDetailView from '@/views/StudentDetailView.vue'

const route = reactive({
  params: {
    studentId: '550e8400-e29b-41d4-a716-446655440001',
  },
})

const push = vi.fn()
const fetchStudentAttendanceReport = vi.fn()
const fetchStudentEnrollments = vi.fn()
const fetchUsers = vi.fn()

const userStore = {
  getUsers: [
    {
      role: 'Student',
      profileId: '550e8400-e29b-41d4-a716-446655440001',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      createdAt: '2026-04-20T00:00:00Z',
      sectionId: '770e8400-e29b-41d4-a716-446655440007',
      isRegular: true,
    },
    {
      role: 'Student',
      profileId: '550e8400-e29b-41d4-a716-446655440002',
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
      createdAt: '2026-04-21T00:00:00Z',
      sectionId: '770e8400-e29b-41d4-a716-446655440008',
      isRegular: false,
    },
  ],
  fetchUsers,
}

const mountedWrappers: Array<ReturnType<typeof mount>> = []

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push }),
}))

vi.mock('@/api/reports', () => ({
  fetchStudentAttendanceReport: (...args: unknown[]) => fetchStudentAttendanceReport(...args),
}))

vi.mock('@/stores/enrollmentStore', () => ({
  useEnrollmentStore: () => ({
    fetchStudentEnrollments,
  }),
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => userStore,
}))

function mountView() {
  const wrapper = mount(StudentDetailView, {
    global: {
      stubs: {
        BaseButton: {
          template: '<button @click="$emit(\'click\')"><slot /></button>',
        },
        SkeletonLoader: true,
        AlertTriangle: true,
        ArrowLeft: true,
        Calendar: true,
        Clock: true,
        GraduationCap: true,
        Mail: true,
        User: true,
      },
    },
  })

  mountedWrappers.push(wrapper)
  return wrapper
}

function createReport(studentId: string, studentName: string) {
  return {
    studentId,
    studentName,
    studentNumber: `2026-${studentId}`,
    totalSessions: 4,
    presentCount: 3,
    lateCount: 0,
    absentCount: 1,
    excusedCount: 0,
    attendancePercentage: 75,
    attendanceRecords: [],
  }
}

describe('student detail view', () => {
  beforeEach(() => {
    route.params.studentId = '550e8400-e29b-41d4-a716-446655440001'
    push.mockReset()
    fetchUsers.mockReset()
    fetchStudentEnrollments.mockReset()
    fetchStudentAttendanceReport.mockReset()

    fetchStudentEnrollments.mockImplementation(async (studentId: string) => [
      {
        enrollmentId: studentId,
        sectionName: `Section ${studentId}`,
        subjectName: `Subject ${studentId}`,
        enrollmentType: 'Regular',
      },
    ])

    fetchStudentAttendanceReport.mockImplementation(async (studentId: string) =>
      createReport(studentId, studentId === '550e8400-e29b-41d4-a716-446655440001' ? 'Ada Lovelace' : 'Grace Hopper'),
    )
  })

  afterEach(() => {
    while (mountedWrappers.length > 0) {
      mountedWrappers.pop()?.unmount()
    }
  })

  it('reloads detail data when the studentId route param changes', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(fetchStudentEnrollments).toHaveBeenNthCalledWith(1, '550e8400-e29b-41d4-a716-446655440001')
    expect(fetchStudentAttendanceReport).toHaveBeenNthCalledWith(1, '550e8400-e29b-41d4-a716-446655440001')
    expect(wrapper.text()).toContain('Ada Lovelace')

    route.params.studentId = '550e8400-e29b-41d4-a716-446655440002'
    await flushPromises()

    expect(fetchStudentEnrollments).toHaveBeenNthCalledWith(2, '550e8400-e29b-41d4-a716-446655440002')
    expect(fetchStudentAttendanceReport).toHaveBeenNthCalledWith(2, '550e8400-e29b-41d4-a716-446655440002')
    expect(wrapper.text()).toContain('Grace Hopper')
  })

  it('shows an invalid link error for blank route ids', async () => {
    route.params.studentId = '   '

    const wrapper = mountView()
    await flushPromises()

    expect(fetchStudentEnrollments).not.toHaveBeenCalled()
    expect(fetchStudentAttendanceReport).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Invalid student details link.')
  })
})

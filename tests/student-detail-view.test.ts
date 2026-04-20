import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import StudentDetailView from '@/views/StudentDetailView.vue'

const route = reactive({
  params: {
    studentId: '1',
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
      profileId: 1,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      createdAt: '2026-04-20T00:00:00Z',
      sectionId: 7,
      isRegular: true,
    },
    {
      role: 'Student',
      profileId: 2,
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
      createdAt: '2026-04-21T00:00:00Z',
      sectionId: 8,
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

function createReport(studentId: number, studentName: string) {
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
    route.params.studentId = '1'
    push.mockReset()
    fetchUsers.mockReset()
    fetchStudentEnrollments.mockReset()
    fetchStudentAttendanceReport.mockReset()

    fetchStudentEnrollments.mockImplementation(async (studentId: number) => [
      {
        enrollmentId: studentId,
        sectionName: `Section ${studentId}`,
        subjectName: `Subject ${studentId}`,
        enrollmentType: 'Regular',
      },
    ])

    fetchStudentAttendanceReport.mockImplementation(async (studentId: number) =>
      createReport(studentId, studentId === 1 ? 'Ada Lovelace' : 'Grace Hopper'),
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

    expect(fetchStudentEnrollments).toHaveBeenNthCalledWith(1, 1)
    expect(fetchStudentAttendanceReport).toHaveBeenNthCalledWith(1, 1)
    expect(wrapper.text()).toContain('Ada Lovelace')

    route.params.studentId = '2'
    await flushPromises()

    expect(fetchStudentEnrollments).toHaveBeenNthCalledWith(2, 2)
    expect(fetchStudentAttendanceReport).toHaveBeenNthCalledWith(2, 2)
    expect(wrapper.text()).toContain('Grace Hopper')
  })

  it('shows an invalid link error for non-positive or non-integer route ids', async () => {
    route.params.studentId = '42.5'

    const wrapper = mountView()
    await flushPromises()

    expect(fetchStudentEnrollments).not.toHaveBeenCalled()
    expect(fetchStudentAttendanceReport).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Invalid student details link.')
  })
})

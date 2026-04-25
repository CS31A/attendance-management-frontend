import type { InstructorStudentDetail } from '@/types/instructor'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import * as instructorsApi from '@/api/instructors'
import InstructorStudentDetailView from '@/views/instructor/InstructorStudentDetailView.vue'

vi.mock('@/api/instructors', () => ({
  getMyStudentDetail: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(() => ({
    toast: { show: false, message: '', type: 'info', duration: 3000 },
    showToast: vi.fn(),
    closeToast: vi.fn(),
  })),
}))

vi.mock('@/utils/httpError', () => ({
  getErrorMessage: vi.fn((_error, defaultMessage) => defaultMessage),
}))

const mockPush = vi.fn()
const mockRoute = reactive({ params: { studentId: '50' as string | undefined }, query: {} as Record<string, string> })
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => mockRoute),
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}))

const mockStudentDetail: InstructorStudentDetail = {
  studentId: '00000000-0000-0000-0000-000000000050',
  firstname: 'Alice',
  lastname: 'Smith',
  sectionId: '00000000-0000-0000-0000-000000000010',
  sectionName: 'BSCS 3A',
  courseId: '00000000-0000-0000-0000-000000000005',
  courseName: 'Bachelor of Science in Computer Science',
  isRegular: true,
  enrollmentType: 'Regular',
  enrollments: [
    {
      subjectId: '00000000-0000-0000-0000-000000000020',
      subjectName: 'Data Structures',
      subjectCode: 'CS301',
      sectionId: '00000000-0000-0000-0000-000000000010',
      sectionName: 'BSCS 3A',
      enrollmentType: 'Regular',
    },
    {
      subjectId: '21',
      subjectName: 'Algorithms',
      subjectCode: 'CS302',
      sectionId: '10',
      sectionName: 'BSCS 3A',
      enrollmentType: 'Regular',
    },
  ],
  attendanceSummary: {
    totalSessions: 20,
    presentCount: 18,
    absentCount: 1,
    lateCount: 1,
    attendanceRate: 95.0,
  },
}

const mountedWrappers: ReturnType<typeof mount>[] = []

function mountComponent() {
  const wrapper = mount(InstructorStudentDetailView, {
    global: {
      plugins: [createPinia()],
      stubs: {
        SkeletonLoader: true,
        Toast: true,
        AlertTriangle: true,
        User: true,
        RefreshCw: true,
        ArrowLeft: true,
      },
    },
  })

  mountedWrappers.push(wrapper)
  return wrapper
}

describe('instructorStudentDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.params.studentId = '50'
    mockRoute.query = {}
    setActivePinia(createPinia())
  })

  afterEach(() => {
    while (mountedWrappers.length > 0) {
      mountedWrappers.pop()?.unmount()
    }
  })

  describe('loading state', () => {
    it('displays loading skeleton during data fetch', async () => {
      const loadingPromise = new Promise(() => {})
      vi.mocked(instructorsApi.getMyStudentDetail).mockReturnValue(loadingPromise as never)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.loading-skeleton').exists()).toBe(true)
      expect(wrapper.find('.identity-card').exists()).toBe(false)
    })

    it('hides loading skeleton when data is loaded', async () => {
      vi.mocked(instructorsApi.getMyStudentDetail).mockResolvedValue(mockStudentDetail)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.loading-skeleton').exists()).toBe(false)
      expect(wrapper.find('.identity-card').exists()).toBe(true)
    })
  })

  describe('error state', () => {
    it('displays error message when error occurs', async () => {
      vi.mocked(instructorsApi.getMyStudentDetail).mockRejectedValue(new Error('Network error'))

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.error-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('Failed to Load Student')
    })

    it('displays retry button in error state', async () => {
      vi.mocked(instructorsApi.getMyStudentDetail).mockRejectedValue(new Error('Network error'))

      const wrapper = mountComponent()
      await flushPromises()

      const retryButton = wrapper.find('.btn-retry')
      expect(retryButton.exists()).toBe(true)
      expect(retryButton.text()).toContain('Retry')
    })

    it.each(['', undefined])(
      'shows invalid link state and skips API call for studentId %s',
      async (studentId) => {
        mockRoute.params.studentId = studentId as string | undefined
        vi.mocked(instructorsApi.getMyStudentDetail).mockResolvedValue(mockStudentDetail)

        const wrapper = mountComponent()
        await flushPromises()

        expect(instructorsApi.getMyStudentDetail).not.toHaveBeenCalled()
        expect(wrapper.text()).toContain('Invalid student details link.')
      },
    )
  })

  describe('student rendering', () => {
    it('renders student name and details', async () => {
      vi.mocked(instructorsApi.getMyStudentDetail).mockResolvedValue(mockStudentDetail)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Alice Smith')
      expect(wrapper.text()).toContain('ID: 00000000-0000-0000-0000-000000000050')
      expect(wrapper.text()).toContain('BSCS 3A')
      expect(wrapper.text()).toContain('Bachelor of Science in Computer Science')
    })

    it('renders enrollment table', async () => {
      vi.mocked(instructorsApi.getMyStudentDetail).mockResolvedValue(mockStudentDetail)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Enrollments')
      expect(wrapper.text()).toContain('Data Structures')
      expect(wrapper.text()).toContain('CS301')
      expect(wrapper.text()).toContain('Algorithms')
      expect(wrapper.text()).toContain('CS302')
    })

    it('renders attendance summary', async () => {
      vi.mocked(instructorsApi.getMyStudentDetail).mockResolvedValue(mockStudentDetail)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Attendance Summary')
      expect(wrapper.text()).toContain('Total Sessions')
      expect(wrapper.text()).toContain('20')
      expect(wrapper.text()).toContain('Present')
      expect(wrapper.text()).toContain('18')
      expect(wrapper.text()).toContain('Absent')
      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('Late')
      expect(wrapper.text()).toContain('1')
    })

    it('formats attendance rate correctly', async () => {
      vi.mocked(instructorsApi.getMyStudentDetail).mockResolvedValue(mockStudentDetail)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Attendance Rate')
      expect(wrapper.text()).toContain('95.0%')
    })

    it('renders enrollment rows with duplicate subject IDs across sections', async () => {
      vi.mocked(instructorsApi.getMyStudentDetail).mockResolvedValue({
        ...mockStudentDetail,
        enrollments: [
          {
            subjectId: '20',
            subjectName: 'Data Structures',
            subjectCode: 'CS301',
            sectionId: '10',
            sectionName: 'BSCS 3A',
            enrollmentType: 'Regular',
          },
          {
            subjectId: '20',
            subjectName: 'Data Structures',
            subjectCode: 'CS301',
            sectionId: '11',
            sectionName: 'BSCS 3B',
            enrollmentType: 'Irregular',
          },
        ],
      })

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.findAll('tbody tr')).toHaveLength(2)
      expect(wrapper.text()).toContain('BSCS 3A')
      expect(wrapper.text()).toContain('BSCS 3B')
    })

    it('reloads data when route param changes', async () => {
      vi.mocked(instructorsApi.getMyStudentDetail)
        .mockResolvedValueOnce(mockStudentDetail)
        .mockResolvedValueOnce({
          ...mockStudentDetail,
          studentId: '00000000-0000-0000-0000-000000000051',
          firstname: 'Bob',
          lastname: 'Johnson',
        })

      const wrapper = mountComponent()
      await flushPromises()

      expect(instructorsApi.getMyStudentDetail).toHaveBeenNthCalledWith(1, '50')
      expect(wrapper.text()).toContain('Alice Smith')

      mockRoute.params.studentId = '51'
      await flushPromises()
      await flushPromises()

      expect(instructorsApi.getMyStudentDetail).toHaveBeenNthCalledWith(2, '51')
      expect(wrapper.text()).toContain('Bob Johnson')
    })
  })

  describe('navigation', () => {
    it('navigates back to My Classes when no fromSectionId', async () => {
      vi.mocked(instructorsApi.getMyStudentDetail).mockResolvedValue(mockStudentDetail)

      const wrapper = mountComponent()
      await flushPromises()

      const backButton = wrapper.find('.back-button')
      await backButton.trigger('click')

      expect(mockPush).toHaveBeenCalledWith('/instructor/classes')
    })

    it('navigates back to section detail when fromSectionId is present', async () => {
      mockRoute.query = { fromSectionId: '10' }
      vi.mocked(instructorsApi.getMyStudentDetail).mockResolvedValue(mockStudentDetail)

      const wrapper = mountComponent()
      await flushPromises()

      const backButton = wrapper.find('.back-button')
      await backButton.trigger('click')

      expect(mockPush).toHaveBeenCalledWith('/instructor/classes/sections/10')
    })
  })
})

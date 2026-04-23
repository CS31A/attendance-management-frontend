import type { InstructorStudentDetail } from '@/types/instructor'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
const mockRoute = { params: { studentId: '50' }, query: {} }
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => mockRoute),
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}))

const mockStudentDetail: InstructorStudentDetail = {
  studentId: 50,
  studentUuid: '00000000-0000-0000-0000-000000000050',
  firstname: 'Alice',
  lastname: 'Smith',
  sectionId: 10,
  sectionName: 'BSCS 3A',
  courseId: 5,
  courseName: 'Bachelor of Science in Computer Science',
  isRegular: true,
  enrollmentType: 'Regular',
  enrollments: [
    {
      subjectId: 20,
      subjectName: 'Data Structures',
      subjectCode: 'CS301',
      sectionId: 10,
      sectionName: 'BSCS 3A',
      enrollmentType: 'Regular',
    },
    {
      subjectId: 21,
      subjectName: 'Algorithms',
      subjectCode: 'CS302',
      sectionId: 10,
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

function mountComponent() {
  return mount(InstructorStudentDetailView, {
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
}

describe('instructorStudentDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.query = {}
    setActivePinia(createPinia())
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
  })

  describe('student rendering', () => {
    it('renders student name and details', async () => {
      vi.mocked(instructorsApi.getMyStudentDetail).mockResolvedValue(mockStudentDetail)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Alice Smith')
      expect(wrapper.text()).toContain('ID: 50')
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

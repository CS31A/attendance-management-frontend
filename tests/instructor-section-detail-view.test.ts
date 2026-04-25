import type { InstructorSectionDetail } from '@/types/instructor'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import * as instructorsApi from '@/api/instructors'
import InstructorSectionDetailView from '@/views/instructor/InstructorSectionDetailView.vue'

vi.mock('@/api/instructors', () => ({
  getMySectionDetail: vi.fn(),
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
const mockRoute = reactive({ params: { sectionId: '10' as string | undefined } })
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => mockRoute),
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}))

const mockSectionDetail: InstructorSectionDetail = {
  sectionId: '00000000-0000-0000-0000-000000000010',
  sectionName: 'BSCS 3A',
  courseId: '00000000-0000-0000-0000-000000000005',
  courseName: 'Bachelor of Science in Computer Science',
  handledClassCount: 1,
  homeSectionStudentCount: 2,
  handledClasses: [
    {
      subjectId: '00000000-0000-0000-0000-000000000020',
      subjectName: 'Data Structures',
      subjectCode: 'CS301',
      scheduleId: '00000000-0000-0000-0000-000000000100',
      dayOfWeek: 'Monday',
      timeIn: '08:00:00',
      timeOut: '10:00:00',
      classroomId: '00000000-0000-0000-0000-000000000001',
      classroomName: 'Room 101',
      studentCount: 3,
      students: [
        {
          studentId: '00000000-0000-0000-0000-000000000050',
          firstname: 'Alice',
          lastname: 'Smith',
          isRegular: true,
          enrollmentType: 'Regular',
          hasFingerprint: false,
        },
        {
          studentId: '00000000-0000-0000-0000-000000000051',
          firstname: 'Bob',
          lastname: 'Johnson',
          isRegular: false,
          enrollmentType: 'Irregular',
          hasFingerprint: false,
        },
        {
          studentId: '00000000-0000-0000-0000-000000000052',
          firstname: 'Cara',
          lastname: 'Davis',
          isRegular: false,
          enrollmentType: 'Retake',
          hasFingerprint: false,
        },
      ],
    },
  ],
  homeSectionStudents: [
    {
      studentId: '00000000-0000-0000-0000-000000000050',
      firstname: 'Alice',
      lastname: 'Smith',
      isRegular: true,
      enrollmentType: 'Regular',
      hasFingerprint: false,
    },
    {
      studentId: '00000000-0000-0000-0000-000000000053',
      firstname: 'David',
      lastname: 'Lee',
      isRegular: true,
      enrollmentType: 'Regular',
      hasFingerprint: false,
    },
  ],
}

const mountedWrappers: ReturnType<typeof mount>[] = []

function mountComponent() {
  const wrapper = mount(InstructorSectionDetailView, {
    global: {
      plugins: [createPinia()],
      stubs: {
        SkeletonLoader: true,
        Toast: true,
        AlertTriangle: true,
        BookOpen: true,
        RefreshCw: true,
        Users: true,
        ArrowLeft: true,
        ChevronDown: true,
        ChevronUp: true,
      },
    },
  })

  mountedWrappers.push(wrapper)
  return wrapper
}

describe('instructorSectionDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.params.sectionId = '10'
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
      vi.mocked(instructorsApi.getMySectionDetail).mockReturnValue(loadingPromise as never)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.loading-skeleton').exists()).toBe(true)
      expect(wrapper.find('.section-detail-view .handled-classes-area').exists()).toBe(false)
    })

    it('hides loading skeleton when data is loaded', async () => {
      vi.mocked(instructorsApi.getMySectionDetail).mockResolvedValue(mockSectionDetail)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.loading-skeleton').exists()).toBe(false)
      expect(wrapper.find('.handled-classes-area').exists()).toBe(true)
    })
  })

  describe('error state', () => {
    it('displays error message when error occurs', async () => {
      vi.mocked(instructorsApi.getMySectionDetail).mockRejectedValue(new Error('Network error'))

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.error-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('Failed to Load Section')
    })

    it('displays retry button in error state', async () => {
      vi.mocked(instructorsApi.getMySectionDetail).mockRejectedValue(new Error('Network error'))

      const wrapper = mountComponent()
      await flushPromises()

      const retryButton = wrapper.find('.btn-retry')
      expect(retryButton.exists()).toBe(true)
      expect(retryButton.text()).toContain('Retry')
    })

    it('triggers data refetch when retry button is clicked', async () => {
      vi.mocked(instructorsApi.getMySectionDetail)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSectionDetail)

      const wrapper = mountComponent()
      await flushPromises()

      const retryButton = wrapper.find('.btn-retry')
      await retryButton.trigger('click')
      await flushPromises()

      expect(instructorsApi.getMySectionDetail).toHaveBeenCalledTimes(2)
    })

    it.each(['', undefined])(
      'shows invalid link state and skips API call for sectionId %s',
      async (sectionId) => {
        mockRoute.params.sectionId = sectionId as string | undefined
        vi.mocked(instructorsApi.getMySectionDetail).mockResolvedValue(mockSectionDetail)

        const wrapper = mountComponent()
        await flushPromises()

        expect(instructorsApi.getMySectionDetail).not.toHaveBeenCalled()
        expect(wrapper.text()).toContain('Invalid section details link.')
      },
    )
  })

  describe('section rendering', () => {
    it('renders section name and course name', async () => {
      vi.mocked(instructorsApi.getMySectionDetail).mockResolvedValue(mockSectionDetail)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('BSCS 3A')
      expect(wrapper.text()).toContain('Bachelor of Science in Computer Science')
    })

    it('renders summary cards', async () => {
      vi.mocked(instructorsApi.getMySectionDetail).mockResolvedValue(mockSectionDetail)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Handled Classes')
      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('Home Section Students')
      expect(wrapper.text()).toContain('2')
    })

    it('renders handled classes', async () => {
      vi.mocked(instructorsApi.getMySectionDetail).mockResolvedValue(mockSectionDetail)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Data Structures')
      expect(wrapper.text()).toContain('CS301')
      expect(wrapper.text()).toContain('Monday')
      expect(wrapper.text()).toContain('Room 101')
      expect(wrapper.text()).toContain('3 Students')
    })

    it('renders home section students', async () => {
      vi.mocked(instructorsApi.getMySectionDetail).mockResolvedValue(mockSectionDetail)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Home Section Students')
      expect(wrapper.text()).toContain('Alice Smith')
      expect(wrapper.text()).toContain('David Lee')
    })
  })

  describe('enrollment filters', () => {
    it('filters students by enrollment type', async () => {
      vi.mocked(instructorsApi.getMySectionDetail).mockResolvedValue(mockSectionDetail)

      const wrapper = mountComponent()
      await flushPromises()

      const classHeader = wrapper.find('.handled-class-header')
      await classHeader.trigger('click')
      await flushPromises()

      const regularFilter = wrapper.findAll('.filter-button').find(b => b.text() === 'Regular')
      await regularFilter!.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Alice Smith')
      expect(wrapper.text()).not.toContain('Bob Johnson')
    })

    it('uses an accessible disclosure button for handled classes', async () => {
      vi.mocked(instructorsApi.getMySectionDetail).mockResolvedValue(mockSectionDetail)

      const wrapper = mountComponent()
      await flushPromises()

      const toggleButton = wrapper.find('button.handled-class-header')
      expect(toggleButton.exists()).toBe(true)
      expect(toggleButton.attributes('aria-expanded')).toBe('false')

      await toggleButton.trigger('click')
      await flushPromises()

      expect(toggleButton.attributes('aria-expanded')).toBe('true')
      expect(toggleButton.attributes('aria-controls')).toBe('handled-class-00000000-0000-0000-0000-000000000100')
      expect(wrapper.find('#handled-class-00000000-0000-0000-0000-000000000100').exists()).toBe(true)
    })
  })

  describe('navigation', () => {
    it('navigates back to My Classes when back button is clicked', async () => {
      vi.mocked(instructorsApi.getMySectionDetail).mockResolvedValue(mockSectionDetail)

      const wrapper = mountComponent()
      await flushPromises()

      const backButton = wrapper.find('.back-button')
      await backButton.trigger('click')

      expect(mockPush).toHaveBeenCalledWith('/instructor/classes')
    })

    it('navigates to student detail when student row is clicked', async () => {
      vi.mocked(instructorsApi.getMySectionDetail).mockResolvedValue(mockSectionDetail)

      const wrapper = mountComponent()
      await flushPromises()

      const studentRows = wrapper.findAll('.student-row')
      await studentRows[0].trigger('click')

      expect(mockPush).toHaveBeenCalledWith('/instructor/students/00000000-0000-0000-0000-000000000050?fromSectionId=10')
    })
  })
})

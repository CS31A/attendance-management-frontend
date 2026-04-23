import type { InstructorSectionsWithStudentsResponseDto } from '@/types/instructor'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as instructorsApi from '@/api/instructors'
import InstructorClassesView from '@/views/instructor/InstructorClassesView.vue'

// Mock API module
vi.mock('@/api/instructors', () => ({
  getMySectionsWithStudents: vi.fn(),
}))

// Mock composables
vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(() => ({
    toast: { show: false, message: '', type: 'info', duration: 3000 },
    showToast: vi.fn(),
    closeToast: vi.fn(),
  })),
}))

// Mock error utility
vi.mock('@/utils/httpError', () => ({
  getErrorMessage: vi.fn((_error, defaultMessage) => defaultMessage),
}))

// Sample test data
const mockInstructorData: InstructorSectionsWithStudentsResponseDto = {
  instructorId: 1,
  instructorFirstname: 'John',
  instructorLastname: 'Doe',
  sections: [
    {
      sectionId: 10,
      sectionName: 'BSCS 3A',
      courseId: 5,
      courseName: 'Bachelor of Science in Computer Science',
      subjects: [
        {
          subjectId: 20,
          subjectName: 'Data Structures',
          subjectCode: 'CS301',
          scheduleId: 100,
          dayOfWeek: 'Monday',
          timeIn: '08:00:00',
          timeOut: '10:00:00',
          classroomName: 'Room 101',
          students: [
            {
              studentId: 50,
              firstname: 'Alice',
              lastname: 'Smith',
              isRegular: true,
              enrollmentType: 'Regular',
            },
            {
              studentId: 51,
              firstname: 'Bob',
              lastname: 'Johnson',
              isRegular: false,
              enrollmentType: 'Irregular',
            },
            {
              studentId: 52,
              firstname: 'Cara',
              lastname: 'Davis',
              isRegular: false,
              enrollmentType: 'Retake',
            },
          ],
        },
      ],
    },
  ],
}

function mountComponent() {
  return mount(InstructorClassesView, {
    global: {
      plugins: [createPinia()],
      stubs: {
        SkeletonLoader: true,
        Toast: true,
        AlertTriangle: true,
        BookOpen: true,
        RefreshCw: true,
        Users: true,
      },
    },
  })
}

describe('instructorClassesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('loading state', () => {
    it('displays loading spinner during data fetch', async () => {
      // Mock API to never resolve (simulating loading)
      let resolvePromise: (value: InstructorSectionsWithStudentsResponseDto) => void
      const loadingPromise = new Promise<InstructorSectionsWithStudentsResponseDto>((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockReturnValue(loadingPromise)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.loading-skeleton').exists()).toBe(true)
      expect(wrapper.find('.sections-content').exists()).toBe(false)
      expect(wrapper.find('.error-state').exists()).toBe(false)

      // Clean up
      resolvePromise!(mockInstructorData)
      await flushPromises()
    })

    it('hides loading spinner when data is loaded', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockInstructorData)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.loading-skeleton').exists()).toBe(false)
      expect(wrapper.find('.sections-content').exists()).toBe(true)
    })
  })

  describe('error state', () => {
    it('displays error message when error occurs', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockRejectedValue(
        new Error('Network error'),
      )

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.error-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('Failed to Load Classes')
    })

    it('displays retry button in error state', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockRejectedValue(
        new Error('Network error'),
      )

      const wrapper = mountComponent()
      await flushPromises()

      const retryButton = wrapper.find('.btn-retry')
      expect(retryButton.exists()).toBe(true)
      expect(retryButton.text()).toContain('Retry')
    })

    it('triggers data refetch when retry button is clicked', async () => {
      // Mock fetch to throw error first, then succeed
      vi.mocked(instructorsApi.getMySectionsWithStudents)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockInstructorData)

      const wrapper = mountComponent()
      await flushPromises()

      // Click retry button
      const retryButton = wrapper.find('.btn-retry')
      await retryButton.trigger('click')
      await flushPromises()

      // Verify fetch was called twice (initial + retry)
      expect(instructorsApi.getMySectionsWithStudents).toHaveBeenCalledTimes(2)
    })
  })

  describe('empty state', () => {
    it('displays "no sections" message when sections array is empty', async () => {
      const emptyData: InstructorSectionsWithStudentsResponseDto = {
        instructorId: 1,
        instructorFirstname: 'John',
        instructorLastname: 'Doe',
        sections: [],
      }
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(emptyData)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('No Sections Assigned')
    })

    it('does not display empty state when loading', async () => {
      // Mock API to never resolve (simulating loading)
      const loadingPromise = new Promise<InstructorSectionsWithStudentsResponseDto>(() => {})
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockReturnValue(loadingPromise)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.empty-state').exists()).toBe(false)
      expect(wrapper.find('.loading-skeleton').exists()).toBe(true)
    })
  })

  describe('sections rendering', () => {
    it('renders sections correctly when data is loaded', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockInstructorData)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.sections-content').exists()).toBe(true)
      expect(wrapper.find('.section-card').exists()).toBe(true)
      expect(wrapper.text()).toContain('BSCS 3A')
      expect(wrapper.text()).toContain('Bachelor of Science in Computer Science')
    })

    it('renders subject information correctly', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockInstructorData)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Data Structures')
      expect(wrapper.text()).toContain('CS301')
      expect(wrapper.text()).toContain('Monday')
      expect(wrapper.text()).toContain('08:00:00 - 10:00:00')
      expect(wrapper.text()).toContain('Room 101')
    })

    it('renders student list correctly', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockInstructorData)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Alice Smith')
      expect(wrapper.text()).toContain('Bob Johnson')
      expect(wrapper.text()).toContain('Cara Davis')
    })

    it('displays correct student count', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockInstructorData)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('3 Students')
    })
  })

  describe('enrollment badges', () => {
    it('displays regular badge for regular students', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockInstructorData)

      const wrapper = mountComponent()
      await flushPromises()

      const regularBadges = wrapper.findAll('.status-regular')
      expect(regularBadges.length).toBeGreaterThan(0)
      expect(regularBadges[0].text()).toBe('Regular')
    })

    it('displays irregular badge for irregular students', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockInstructorData)

      const wrapper = mountComponent()
      await flushPromises()

      const irregularBadges = wrapper.findAll('.status-irregular')
      expect(irregularBadges.length).toBeGreaterThan(0)
      expect(irregularBadges[0].text()).toBe('Irregular')
    })

    it('displays retake badge for retake students', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockInstructorData)

      const wrapper = mountComponent()
      await flushPromises()

      const retakeBadges = wrapper.findAll('.status-retake')
      expect(retakeBadges.length).toBeGreaterThan(0)
      expect(retakeBadges[0].text()).toBe('Retake')
    })

    it('applies correct CSS classes to regular badges', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockInstructorData)

      const wrapper = mountComponent()
      await flushPromises()

      const regularBadge = wrapper.find('.status-regular')
      expect(regularBadge.classes()).toContain('status-badge')
      expect(regularBadge.classes()).toContain('status-regular')
    })

    it('applies correct CSS classes to irregular badges', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockInstructorData)

      const wrapper = mountComponent()
      await flushPromises()

      const irregularBadge = wrapper.find('.status-irregular')
      expect(irregularBadge.classes()).toContain('status-badge')
      expect(irregularBadge.classes()).toContain('status-irregular')
    })

    it('applies correct CSS classes to retake badges', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockInstructorData)

      const wrapper = mountComponent()
      await flushPromises()

      const retakeBadge = wrapper.find('.status-retake')
      expect(retakeBadge.classes()).toContain('status-badge')
      expect(retakeBadge.classes()).toContain('status-retake')
    })
  })

  describe('summary cards', () => {
    it('displays total sections count', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockInstructorData)

      const wrapper = mountComponent()
      await flushPromises()

      const summaryCards = wrapper.findAll('.summary-card')
      expect(summaryCards.length).toBeGreaterThan(0)
      expect(wrapper.text()).toContain('Total Sections')
      expect(wrapper.text()).toContain('1')
    })

    it('displays total students count', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockInstructorData)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Total Students')
      expect(wrapper.text()).toContain('3')
    })
  })

  describe('instructor information', () => {
    it('displays instructor name when data is loaded', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockInstructorData)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Welcome, John Doe')
    })

    it('displays default subtitle when instructor data is not loaded', async () => {
      // Mock API to never resolve (simulating loading)
      const loadingPromise = new Promise<InstructorSectionsWithStudentsResponseDto>(() => {})
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockReturnValue(loadingPromise)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('View your assigned sections and enrolled students')
    })
  })

  describe('multiple sections', () => {
    it('renders multiple sections correctly', async () => {
      const multiSectionData: InstructorSectionsWithStudentsResponseDto = {
        ...mockInstructorData,
        sections: [
          mockInstructorData.sections[0],
          {
            sectionId: 11,
            sectionName: 'BSCS 3B',
            courseId: 5,
            courseName: 'Bachelor of Science in Computer Science',
            subjects: [],
          },
        ],
      }
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(multiSectionData)

      const wrapper = mountComponent()
      await flushPromises()

      const sectionCards = wrapper.findAll('.section-card')
      expect(sectionCards.length).toBe(2)
      expect(wrapper.text()).toContain('BSCS 3A')
      expect(wrapper.text()).toContain('BSCS 3B')
    })
  })

  describe('no students in subject', () => {
    it('displays "no students" message when subject has no students', async () => {
      const noStudentsData: InstructorSectionsWithStudentsResponseDto = {
        ...mockInstructorData,
        sections: [
          {
            ...mockInstructorData.sections[0],
            subjects: [
              {
                ...mockInstructorData.sections[0].subjects[0],
                students: [],
              },
            ],
          },
        ],
      }
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(noStudentsData)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.no-students').exists()).toBe(true)
      expect(wrapper.text()).toContain('No students enrolled in this subject')
    })
  })

  describe('enrollment filters', () => {
    it('filters to regular students only', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockInstructorData)

      const wrapper = mountComponent()
      await flushPromises()

      const regularFilter = wrapper.findAll('.filter-button').find(button => button.text() === 'Regular')
      await regularFilter!.trigger('click')

      expect(wrapper.text()).toContain('Alice Smith')
      expect(wrapper.text()).not.toContain('Bob Johnson')
      expect(wrapper.text()).not.toContain('Cara Davis')
    })

    it('filters to irregular students only', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockInstructorData)

      const wrapper = mountComponent()
      await flushPromises()

      const irregularFilter = wrapper.findAll('.filter-button').find(button => button.text() === 'Irregular')
      await irregularFilter!.trigger('click')

      expect(wrapper.text()).not.toContain('Alice Smith')
      expect(wrapper.text()).toContain('Bob Johnson')
      expect(wrapper.text()).not.toContain('Cara Davis')
    })

    it('filters to retake students only', async () => {
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockInstructorData)

      const wrapper = mountComponent()
      await flushPromises()

      const retakeFilter = wrapper.findAll('.filter-button').find(button => button.text() === 'Retake')
      await retakeFilter!.trigger('click')

      expect(wrapper.text()).not.toContain('Alice Smith')
      expect(wrapper.text()).not.toContain('Bob Johnson')
      expect(wrapper.text()).toContain('Cara Davis')
      expect(wrapper.text()).toContain('1 Student')
    })
  })
})

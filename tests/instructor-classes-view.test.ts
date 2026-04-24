import type {
  InstructorSectionOverviewItem,
  InstructorSectionsWithStudentsResponseDto,
} from '@/types/instructor'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as instructorsApi from '@/api/instructors'
import InstructorClassesView from '@/views/instructor/InstructorClassesView.vue'

vi.mock('@/api/instructors', () => ({
  getMySectionsOverview: vi.fn(),
  getMySectionsWithStudents: vi.fn(),
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
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}))

const mockSectionsOverview: InstructorSectionOverviewItem[] = [
  {
    sectionId: '00000000-0000-0000-0000-000000000010',
    sectionName: 'BSCS 3A',
    courseId: '00000000-0000-0000-0000-000000000005',
    courseName: 'Bachelor of Science in Computer Science',
    handledClassCount: 2,
    uniqueStudentCount: 30,
  },
]

const mockSectionsWithStudents: InstructorSectionsWithStudentsResponseDto = {
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
        ChevronRight: true,
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
    it('displays loading skeleton during data fetch', async () => {
      const loadingPromise = new Promise(() => {})
      vi.mocked(instructorsApi.getMySectionsOverview).mockReturnValue(loadingPromise as never)
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockReturnValue(loadingPromise as never)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.loading-skeleton').exists()).toBe(true)
      expect(wrapper.find('.sections-content').exists()).toBe(false)
      expect(wrapper.find('.error-state').exists()).toBe(false)
    })

    it('hides loading skeleton when data is loaded', async () => {
      vi.mocked(instructorsApi.getMySectionsOverview).mockResolvedValue(mockSectionsOverview)
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockSectionsWithStudents)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.loading-skeleton').exists()).toBe(false)
      expect(wrapper.find('.sections-content').exists()).toBe(true)
    })
  })

  describe('error state', () => {
    it('displays error message when error occurs', async () => {
      vi.mocked(instructorsApi.getMySectionsOverview).mockRejectedValue(
        new Error('Network error'),
      )
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockRejectedValue(
        new Error('Network error'),
      )

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.error-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('Failed to Load Classes')
    })

    it('displays retry button in error state', async () => {
      vi.mocked(instructorsApi.getMySectionsOverview).mockRejectedValue(
        new Error('Network error'),
      )
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
      vi.mocked(instructorsApi.getMySectionsOverview)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSectionsOverview)
      vi.mocked(instructorsApi.getMySectionsWithStudents)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSectionsWithStudents)

      const wrapper = mountComponent()
      await flushPromises()

      const retryButton = wrapper.find('.btn-retry')
      await retryButton.trigger('click')
      await flushPromises()

      expect(instructorsApi.getMySectionsOverview).toHaveBeenCalledTimes(2)
      expect(instructorsApi.getMySectionsWithStudents).toHaveBeenCalledTimes(2)
    })
  })

  describe('empty state', () => {
    it('displays "no sections" message when sections array is empty', async () => {
      vi.mocked(instructorsApi.getMySectionsOverview).mockResolvedValue([])
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue({
        ...mockSectionsWithStudents,
        sections: [],
      })

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('No Sections Assigned')
    })

    it('does not display empty state when loading', async () => {
      const loadingPromise = new Promise(() => {})
      vi.mocked(instructorsApi.getMySectionsOverview).mockReturnValue(loadingPromise as never)
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockReturnValue(loadingPromise as never)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.empty-state').exists()).toBe(false)
      expect(wrapper.find('.loading-skeleton').exists()).toBe(true)
    })
  })

  describe('sections rendering', () => {
    it('renders sections correctly when data is loaded', async () => {
      vi.mocked(instructorsApi.getMySectionsOverview).mockResolvedValue(mockSectionsOverview)
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockSectionsWithStudents)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.find('.sections-content').exists()).toBe(true)
      expect(wrapper.find('.section-card').exists()).toBe(true)
      expect(wrapper.text()).toContain('BSCS 3A')
      expect(wrapper.text()).toContain('Bachelor of Science in Computer Science')
    })

    it('displays correct class count', async () => {
      vi.mocked(instructorsApi.getMySectionsOverview).mockResolvedValue(mockSectionsOverview)
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockSectionsWithStudents)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('2 Classes')
    })

    it('displays correct student count', async () => {
      vi.mocked(instructorsApi.getMySectionsOverview).mockResolvedValue(mockSectionsOverview)
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockSectionsWithStudents)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('30 Students')
    })
  })

  describe('summary cards', () => {
    it('displays total sections count', async () => {
      vi.mocked(instructorsApi.getMySectionsOverview).mockResolvedValue(mockSectionsOverview)
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockSectionsWithStudents)

      const wrapper = mountComponent()
      await flushPromises()

      const summaryCards = wrapper.findAll('.summary-card')
      expect(summaryCards.length).toBeGreaterThan(0)
      expect(wrapper.text()).toContain('Total Sections')
      expect(wrapper.text()).toContain('1')
    })

    it('displays total unique students count', async () => {
      vi.mocked(instructorsApi.getMySectionsOverview).mockResolvedValue(mockSectionsOverview)
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockSectionsWithStudents)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Total Unique Students')
      expect(wrapper.text()).toContain('3')
    })

    it('uses globally deduped total while keeping per-section counts', async () => {
      const overlapOverview: InstructorSectionOverviewItem[] = [
        {
          sectionId: '00000000-0000-0000-0000-000000000010',
          sectionName: 'BSCS 3A',
          courseId: '00000000-0000-0000-0000-000000000005',
          courseName: 'Bachelor of Science in Computer Science',
          handledClassCount: 1,
          uniqueStudentCount: 2,
        },
        {
          sectionId: '00000000-0000-0000-0000-000000000011',
          sectionName: 'BSCS 3B',
          courseId: '00000000-0000-0000-0000-000000000005',
          courseName: 'Bachelor of Science in Computer Science',
          handledClassCount: 1,
          uniqueStudentCount: 2,
        },
      ]
      const overlapSectionsWithStudents: InstructorSectionsWithStudentsResponseDto = {
        ...mockSectionsWithStudents,
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
                    isRegular: true,
                    enrollmentType: 'Regular',
                  },
                ],
              },
            ],
          },
          {
            sectionId: 11,
            sectionName: 'BSCS 3B',
            courseId: 5,
            courseName: 'Bachelor of Science in Computer Science',
            subjects: [
              {
                subjectId: 21,
                subjectName: 'Algorithms',
                subjectCode: 'CS302',
                scheduleId: 101,
                dayOfWeek: 'Tuesday',
                timeIn: '10:00:00',
                timeOut: '12:00:00',
                classroomName: 'Room 102',
                students: [
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
                    isRegular: true,
                    enrollmentType: 'Regular',
                  },
                ],
              },
            ],
          },
        ],
      }

      vi.mocked(instructorsApi.getMySectionsOverview).mockResolvedValue(overlapOverview)
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(overlapSectionsWithStudents)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Total Unique Students')
      expect(wrapper.text()).toContain('3')
      expect(wrapper.text()).toContain('2 Students')
    })
  })

  describe('instructor information', () => {
    it('displays instructor name when data is loaded', async () => {
      vi.mocked(instructorsApi.getMySectionsOverview).mockResolvedValue(mockSectionsOverview)
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockSectionsWithStudents)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Welcome, John Doe')
    })

    it('displays default subtitle when instructor data is not loaded', async () => {
      const loadingPromise = new Promise(() => {})
      vi.mocked(instructorsApi.getMySectionsOverview).mockReturnValue(loadingPromise as never)
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockReturnValue(loadingPromise as never)

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('View your assigned sections and enrolled students')
    })
  })

  describe('multiple sections', () => {
    it('renders multiple sections correctly', async () => {
      const multiSectionOverview: InstructorSectionOverviewItem[] = [
        ...mockSectionsOverview,
        {
          sectionId: '00000000-0000-0000-0000-000000000011',
          sectionName: 'BSCS 3B',
          courseId: '00000000-0000-0000-0000-000000000005',
          courseName: 'Bachelor of Science in Computer Science',
          handledClassCount: 1,
          uniqueStudentCount: 25,
        },
      ]
      vi.mocked(instructorsApi.getMySectionsOverview).mockResolvedValue(multiSectionOverview)
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockSectionsWithStudents)

      const wrapper = mountComponent()
      await flushPromises()

      const sectionCards = wrapper.findAll('.section-card')
      expect(sectionCards.length).toBe(2)
      expect(wrapper.text()).toContain('BSCS 3A')
      expect(wrapper.text()).toContain('BSCS 3B')
    })
  })

  describe('navigation', () => {
    it('navigates to section detail when section card is clicked', async () => {
      vi.mocked(instructorsApi.getMySectionsOverview).mockResolvedValue(mockSectionsOverview)
      vi.mocked(instructorsApi.getMySectionsWithStudents).mockResolvedValue(mockSectionsWithStudents)

      const wrapper = mountComponent()
      await flushPromises()

      const sectionCard = wrapper.find('.section-card')
      await sectionCard.trigger('click')

      expect(mockPush).toHaveBeenCalledWith('/instructor/classes/sections/00000000-0000-0000-0000-000000000010')
    })
  })
})

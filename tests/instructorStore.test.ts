import type { InstructorSectionsWithStudentsResponseDto } from '@/types/instructor'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getMySectionsWithStudents } from '@/api/instructors'
import { useInstructorStore } from '@/stores/instructorStore'

vi.mock('@/api/instructors')

// Helper factory
function createInstructorData(
  overrides: Partial<InstructorSectionsWithStudentsResponseDto> = {},
): InstructorSectionsWithStudentsResponseDto {
  return {
    InstructorId: 1,
    InstructorFirstname: 'John',
    InstructorLastname: 'Doe',
    Sections: [],
    ...overrides,
  }
}

describe('instructorStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('state and getters', () => {
    it('initializes with null data and no loading', () => {
      const store = useInstructorStore()

      expect(store.instructorData).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.sections).toEqual([])
    })

    it('sections getter returns empty array when no data', () => {
      const store = useInstructorStore()

      expect(store.sections).toEqual([])
    })

    it('sections getter returns sections from instructorData', () => {
      const store = useInstructorStore()
      const mockData = createInstructorData({
        Sections: [
          {
            SectionId: 1,
            SectionName: 'BSCS 3A',
            CourseId: 1,
            CourseName: 'Computer Science',
            Subjects: [],
          },
        ],
      })
      store.instructorData = mockData

      expect(store.sections).toHaveLength(1)
      expect(store.sections[0].SectionName).toBe('BSCS 3A')
    })

    it('instructorInfo getter returns null when no data', () => {
      const store = useInstructorStore()

      expect(store.instructorInfo).toBeNull()
    })

    it('instructorInfo getter returns instructor details', () => {
      const store = useInstructorStore()
      store.instructorData = createInstructorData()

      expect(store.instructorInfo).toEqual({
        id: 1,
        firstname: 'John',
        lastname: 'Doe',
        fullName: 'John Doe',
      })
    })

    it('totalSections returns correct count', () => {
      const store = useInstructorStore()
      store.instructorData = createInstructorData({
        Sections: [
          {
            SectionId: 1,
            SectionName: 'BSCS 3A',
            CourseId: 1,
            CourseName: 'Computer Science',
            Subjects: [],
          },
          {
            SectionId: 2,
            SectionName: 'BSCS 3B',
            CourseId: 1,
            CourseName: 'Computer Science',
            Subjects: [],
          },
        ],
      })

      expect(store.totalSections).toBe(2)
    })

    it('totalStudents returns correct count across all sections and subjects', () => {
      const store = useInstructorStore()
      store.instructorData = createInstructorData({
        Sections: [
          {
            SectionId: 1,
            SectionName: 'BSCS 3A',
            CourseId: 1,
            CourseName: 'Computer Science',
            Subjects: [
              {
                SubjectId: 1,
                SubjectName: 'Data Structures',
                SubjectCode: 'CS301',
                ScheduleId: 1,
                DayOfWeek: 'Monday',
                TimeIn: '08:00:00',
                TimeOut: '10:00:00',
                ClassroomName: 'Room 101',
                Students: [
                  {
                    StudentId: 1,
                    Firstname: 'Alice',
                    Lastname: 'Smith',
                    IsRegular: true,
                    EnrollmentType: 'Regular',
                  },
                  {
                    StudentId: 2,
                    Firstname: 'Bob',
                    Lastname: 'Johnson',
                    IsRegular: false,
                    EnrollmentType: 'Irregular',
                  },
                ],
              },
            ],
          },
          {
            SectionId: 2,
            SectionName: 'BSCS 3B',
            CourseId: 1,
            CourseName: 'Computer Science',
            Subjects: [
              {
                SubjectId: 2,
                SubjectName: 'Algorithms',
                SubjectCode: 'CS302',
                ScheduleId: 2,
                DayOfWeek: 'Tuesday',
                TimeIn: '10:00:00',
                TimeOut: '12:00:00',
                ClassroomName: 'Room 102',
                Students: [
                  {
                    StudentId: 3,
                    Firstname: 'Charlie',
                    Lastname: 'Brown',
                    IsRegular: true,
                    EnrollmentType: 'Regular',
                  },
                ],
              },
            ],
          },
        ],
      })

      expect(store.totalStudents).toBe(3)
    })
  })

  describe('actions - success paths', () => {
    it('fetchSectionsWithStudents updates state on success', async () => {
      const mockData = createInstructorData({
        Sections: [
          {
            SectionId: 1,
            SectionName: 'BSCS 3A',
            CourseId: 1,
            CourseName: 'Computer Science',
            Subjects: [],
          },
        ],
      })
      vi.mocked(getMySectionsWithStudents).mockResolvedValue(mockData as never)

      const store = useInstructorStore()
      const result = await store.fetchSectionsWithStudents()

      expect(store.instructorData).toEqual(mockData)
      expect(store.error).toBeNull()
      expect(store.loading).toBe(false)
      expect(result).toEqual(mockData)
    })

    it('fetchSectionsWithStudents sets loading state during fetch', async () => {
      let resolvePromise: (value: InstructorSectionsWithStudentsResponseDto) => void
      const promise = new Promise<InstructorSectionsWithStudentsResponseDto>((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(getMySectionsWithStudents).mockReturnValue(promise as never)

      const store = useInstructorStore()
      const fetchPromise = store.fetchSectionsWithStudents()

      expect(store.loading).toBe(true)

      resolvePromise!(createInstructorData())
      await fetchPromise

      expect(store.loading).toBe(false)
    })

    it('clearError clears error state', () => {
      const store = useInstructorStore()
      store.error = 'Test error'

      store.clearError()

      expect(store.error).toBeNull()
    })

    it('resetStore resets all state', () => {
      const store = useInstructorStore()
      store.instructorData = createInstructorData()
      store.error = 'Test error'

      store.resetStore()

      expect(store.instructorData).toBeNull()
      expect(store.error).toBeNull()
      expect(store.loading).toBe(false)
    })
  })

  describe('actions - error paths', () => {
    it('fetchSectionsWithStudents sets error state on failure', async () => {
      const testError = new Error('Network error')
      vi.mocked(getMySectionsWithStudents).mockRejectedValue(testError)

      const store = useInstructorStore()

      await expect(store.fetchSectionsWithStudents()).rejects.toThrow(testError)

      expect(store.error).toBe('Network error')
      expect(store.loading).toBe(false)
      expect(store.instructorData).toBeNull()
    })

    it('fetchSectionsWithStudents handles non-Error exceptions', async () => {
      vi.mocked(getMySectionsWithStudents).mockRejectedValue('String error')

      const store = useInstructorStore()

      await expect(store.fetchSectionsWithStudents()).rejects.toBe('String error')

      expect(store.error).toBe('Failed to load sections')
      expect(store.loading).toBe(false)
    })

    it('fetchSectionsWithStudents resets loading on error', async () => {
      const testError = new Error('Fetch failed')
      vi.mocked(getMySectionsWithStudents).mockRejectedValue(testError)

      const store = useInstructorStore()

      await expect(store.fetchSectionsWithStudents()).rejects.toThrow(testError)

      expect(store.loading).toBe(false)
    })
  })
})

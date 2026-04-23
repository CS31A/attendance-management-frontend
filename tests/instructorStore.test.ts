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
    instructorId: 1,
    instructorFirstname: 'John',
    instructorLastname: 'Doe',
    sections: [],
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
        sections: [
          {
            sectionId: 1,
            sectionName: 'BSCS 3A',
            courseId: 1,
            courseName: 'Computer Science',
            subjects: [],
          },
        ],
      })
      store.instructorData = mockData

      expect(store.sections).toHaveLength(1)
      expect(store.sections[0].sectionName).toBe('BSCS 3A')
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
        sections: [
          {
            sectionId: 1,
            sectionName: 'BSCS 3A',
            courseId: 1,
            courseName: 'Computer Science',
            subjects: [],
          },
          {
            sectionId: 2,
            sectionName: 'BSCS 3B',
            courseId: 1,
            courseName: 'Computer Science',
            subjects: [],
          },
        ],
      })

      expect(store.totalSections).toBe(2)
    })

    it('totalStudents returns correct count across all sections and subjects', () => {
      const store = useInstructorStore()
      store.instructorData = createInstructorData({
        sections: [
          {
            sectionId: 1,
            sectionName: 'BSCS 3A',
            courseId: 1,
            courseName: 'Computer Science',
            subjects: [
              {
                subjectId: 1,
                subjectName: 'Data Structures',
                subjectCode: 'CS301',
                scheduleId: 1,
                dayOfWeek: 'Monday',
                timeIn: '08:00:00',
                timeOut: '10:00:00',
                classroomName: 'Room 101',
                students: [
                  {
                    studentId: 1,
                    firstname: 'Alice',
                    lastname: 'Smith',
                    isRegular: true,
                    enrollmentType: 'Regular',
                  },
                  {
                    studentId: 2,
                    firstname: 'Bob',
                    lastname: 'Johnson',
                    isRegular: false,
                    enrollmentType: 'Irregular',
                  },
                ],
              },
            ],
          },
          {
            sectionId: 2,
            sectionName: 'BSCS 3B',
            courseId: 1,
            courseName: 'Computer Science',
            subjects: [
              {
                subjectId: 2,
                subjectName: 'Algorithms',
                subjectCode: 'CS302',
                scheduleId: 2,
                dayOfWeek: 'Tuesday',
                timeIn: '10:00:00',
                timeOut: '12:00:00',
                classroomName: 'Room 102',
                students: [
                  {
                    studentId: 3,
                    firstname: 'Charlie',
                    lastname: 'Brown',
                    isRegular: true,
                    enrollmentType: 'Regular',
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
        sections: [
          {
            sectionId: 1,
            sectionName: 'BSCS 3A',
            courseId: 1,
            courseName: 'Computer Science',
            subjects: [],
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

import type { EntityId } from '@/types'

export interface ScheduleInstructor {
  id: EntityId
  firstName: string
  lastName: string
}

export interface Schedule {
  id: EntityId
  dayOfWeek: string
  timeIn: string
  timeOut: string
  subjectId: EntityId | null
  classroomId: EntityId | null
  sectionId: EntityId | null
  instructorId: EntityId | null
  courseId: EntityId | null
  subjectCode: string
  subjectName: string
  courseCode: string
  courseName: string
  sectionName: string
  classroomName: string
  instructorFirstName: string
  instructorLastName: string
}

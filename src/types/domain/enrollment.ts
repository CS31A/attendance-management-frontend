import type { EntityId } from '@/types'

export interface Enrollment {
  id: EntityId
  studentId: EntityId
  studentFirstname: string
  studentLastname: string
  enrollmentType: string
  enrolledAt: string
  isActive: boolean
  status: string
  subjectName?: string
  subject?: string
  sectionName?: string
  section?: string
  sectionId?: EntityId
}

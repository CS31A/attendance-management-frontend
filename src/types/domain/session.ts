import type { EntityId } from '@/types'
import type { SessionStatus } from '@/utils/constants'

export interface Session {
  id: EntityId
  status: SessionStatus
  rowVersion?: string
  sessionDate?: string
  subjectCode?: string
  subjectName?: string
  sectionName?: string
  actualStartTime?: string
  actualEndTime?: string
  scheduledRoomName?: string
  actualRoomName?: string
  scheduledStartTime?: string
  scheduledEndTime?: string
  startTime?: string
  endTime?: string
  courseCode?: string
  courseName?: string
  description?: string
  totalEnrolled?: number
  startedByName?: string
  updatedAt?: string
  modifiedAt?: string
  roomName?: string
}

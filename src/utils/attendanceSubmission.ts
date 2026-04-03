import { getErrorMessage, getErrorStatus } from '@/utils/httpError'

const DEFAULT_ATTENDANCE_SUBMISSION_ERROR = 'Failed to record attendance. Please try again.'
const DEFAULT_ATTENDANCE_CONFLICT_ERROR = 'Attendance could not be recorded for one or more students. Please confirm the affected student is enrolled in this session and try again.'

export function getAttendanceSubmissionErrorMessage(error: unknown): string {
  const status = getErrorStatus(error)

  if (status === 403) {
    return 'You are not authorized to record attendance for this session.'
  }

  if (status === 409) {
    return getErrorMessage(error, DEFAULT_ATTENDANCE_CONFLICT_ERROR)
  }

  if (status === 400) {
    return getErrorMessage(error, 'Invalid attendance data.')
  }

  return DEFAULT_ATTENDANCE_SUBMISSION_ERROR
}

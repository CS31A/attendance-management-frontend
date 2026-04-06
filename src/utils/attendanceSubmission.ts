import { getErrorMessage, getErrorStatus } from '@/utils/httpError'

const DEFAULT_ATTENDANCE_SUBMISSION_ERROR = 'Failed to record attendance. Please try again.'
const DEFAULT_ATTENDANCE_CONFLICT_ERROR = 'Attendance could not be recorded for one or more students. Please confirm the affected student is enrolled in this session and try again.'
const DEFAULT_ATTENDANCE_NOT_FOUND_ERROR = 'The session or attendance record could not be found. Please refresh and try again.'
const DEFAULT_ATTENDANCE_VALIDATION_ERROR = 'Attendance data failed validation. Please review the entries and try again.'
const DEFAULT_ATTENDANCE_RATE_LIMIT_ERROR = 'Too many attendance requests were sent. Please wait a moment and try again.'
const DEFAULT_ATTENDANCE_SERVER_ERROR = 'The attendance service is temporarily unavailable. Please try again shortly.'

export function getAttendanceSubmissionErrorMessage(error: unknown): string {
  const status = getErrorStatus(error)

  if (status === 401) {
    return 'Your session has expired. Please sign in again and retry attendance submission.'
  }

  if (status === 403) {
    return 'You are not authorized to record attendance for this session.'
  }

  if (status === 404) {
    return getErrorMessage(error, DEFAULT_ATTENDANCE_NOT_FOUND_ERROR)
  }

  if (status === 409) {
    return getErrorMessage(error, DEFAULT_ATTENDANCE_CONFLICT_ERROR)
  }

  if (status === 400) {
    return getErrorMessage(error, 'Invalid attendance data.')
  }

  if (status === 422) {
    return getErrorMessage(error, DEFAULT_ATTENDANCE_VALIDATION_ERROR)
  }

  if (status === 429) {
    return getErrorMessage(error, DEFAULT_ATTENDANCE_RATE_LIMIT_ERROR)
  }

  if (status !== undefined && status >= 500) {
    return getErrorMessage(error, DEFAULT_ATTENDANCE_SERVER_ERROR)
  }

  return DEFAULT_ATTENDANCE_SUBMISSION_ERROR
}

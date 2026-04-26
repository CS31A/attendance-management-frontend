import type { EntityId } from '@/types'
import type {
  InstructorSectionDetail,
  InstructorSectionOverviewItem,
  InstructorSectionsWithStudentsResponseDto,
  InstructorStudentDetail,
} from '@/types/instructor'
import api from './index'

export type InstructorDto = Record<string, unknown>
export type InstructorCollectionDto = InstructorDto[]

/**
 * Get current instructor's schedules
 * @returns {Promise<Array>} List of schedule objects
 */
export async function getMySchedules(): Promise<InstructorCollectionDto> {
  try {
    const response = await api.get('/instructors/me/schedules')
    return response.data
  }
  catch (error) {
    console.error('Failed to fetch instructor schedules:', error)
    return Promise.reject(error)
  }
}

/**
 * Get current instructor's information
 * @returns {Promise<object>} Instructor object
 */
export async function getMyProfile(): Promise<InstructorDto> {
  try {
    const response = await api.get('/instructors/profile')
    return response.data
  }
  catch (error) {
    console.error('Failed to fetch instructor profile:', error)
    return Promise.reject(error)
  }
}

/**
 * Get subjects assigned to a specific instructor
 * @param {number} id - Instructor ID
 * @returns {Promise<Array>} List of subject objects
 */
export async function getInstructorSubjects(id: EntityId): Promise<InstructorCollectionDto> {
  try {
    const response = await api.get(`/instructors/${id}/subjects`)
    return response.data
  }
  catch (error) {
    console.error(`Failed to fetch subjects for instructor ${id}:`, error)
    return Promise.reject(error)
  }
}

/**
 * Get current instructor's sections with enrolled students
 * @returns {Promise<InstructorSectionsWithStudentsResponseDto>} Instructor sections with students data
 */
export async function getMySectionsWithStudents(): Promise<InstructorSectionsWithStudentsResponseDto> {
  try {
    const response = await api.get('/instructors/me/sections-with-students')
    return normalizeInstructorSectionsResponse(response.data)
  }
  catch (error) {
    console.error('Failed to fetch instructor sections with students:', error)
    return Promise.reject(error)
  }
}

export async function getMySectionsOverview(): Promise<InstructorSectionOverviewItem[]> {
  try {
    const response = await api.get('/instructors/me/sections')
    return normalizeSectionsOverview(response.data)
  }
  catch (error) {
    console.error('Failed to fetch instructor sections overview:', error)
    return Promise.reject(error)
  }
}

export async function getMySectionDetail(sectionId: EntityId): Promise<InstructorSectionDetail> {
  try {
    const response = await api.get(`/instructors/me/sections/${sectionId}`)
    return normalizeSectionDetail(response.data)
  }
  catch (error) {
    console.error(`Failed to fetch instructor section detail for section ${sectionId}:`, error)
    return Promise.reject(error)
  }
}

export async function getMyStudentDetail(studentId: EntityId): Promise<InstructorStudentDetail> {
  try {
    const response = await api.get(`/instructors/me/students/${studentId}`)
    return normalizeStudentDetail(response.data)
  }
  catch (error) {
    console.error(`Failed to fetch instructor student detail for student ${studentId}:`, error)
    return Promise.reject(error)
  }
}

function normalizeInstructorSectionsResponse(payload: Record<string, unknown>): InstructorSectionsWithStudentsResponseDto {
  const sections = Array.isArray(payload.sections) ? payload.sections : []

  return {
    instructorId: String((payload.instructorId as EntityId) ?? '0'),
    instructorFirstname: (payload.instructorFirstname as string) ?? '',
    instructorLastname: (payload.instructorLastname as string) ?? '',
    sections: (sections as Record<string, unknown>[]).map(section => ({
      sectionId: String((section.sectionId as EntityId) ?? '0'),
      sectionName: (section.sectionName as string) ?? '',
      courseId: String((section.courseId as EntityId) ?? '0'),
      courseName: (section.courseName as string) ?? '',
      subjects: ((section.subjects ?? []) as unknown[]).map(subject => ({
        subjectId: String(((subject as Record<string, unknown>).subjectId as EntityId) ?? '0'),
        subjectName: ((subject as Record<string, unknown>).subjectName as string) ?? '',
        subjectCode: ((subject as Record<string, unknown>).subjectCode as string) ?? '',
        scheduleId: String(((subject as Record<string, unknown>).scheduleId as EntityId) ?? '0'),
        dayOfWeek: ((subject as Record<string, unknown>).dayOfWeek as string) ?? '',
        timeIn: ((subject as Record<string, unknown>).timeIn as string) ?? '',
        timeOut: ((subject as Record<string, unknown>).timeOut as string) ?? '',
        classroomName: ((subject as Record<string, unknown>).classroomName as string) ?? '',
        students: (((subject as Record<string, unknown>).students ?? []) as unknown[]).map(student => ({
          studentId: String(((student as Record<string, unknown>).studentId as EntityId) ?? '0'),
          firstname: ((student as Record<string, unknown>).firstname as string) ?? '',
          lastname: ((student as Record<string, unknown>).lastname as string) ?? '',
          isRegular: ((student as Record<string, unknown>).isRegular as boolean) ?? false,
          enrollmentType: ((student as Record<string, unknown>).enrollmentType as string) ?? 'Regular',
        })),
      })),
    })),
  }
}

function normalizeSectionsOverview(payload: Record<string, unknown> | Record<string, unknown>[]): InstructorSectionOverviewItem[] {
  const sections = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.sections)
      ? payload.sections
      : []

  return (sections as Record<string, unknown>[]).map(section => normalizeSectionOverviewItem(section))
}

function normalizeSectionOverviewItem(section: Record<string, unknown>): InstructorSectionOverviewItem {
  return {
    sectionId: String((section.sectionId as EntityId) ?? '0'),
    sectionName: (section.sectionName as string) ?? '',
    courseId: String((section.courseId as EntityId) ?? '0'),
    courseName: (section.courseName as string) ?? '',
    handledClassCount: (section.handledClassCount as number) ?? 0,
    uniqueStudentCount: (section.uniqueStudentCount as number) ?? 0,
  }
}

function normalizeSectionDetail(payload: Record<string, unknown>): InstructorSectionDetail {
  const handledClasses = Array.isArray(payload.handledClasses) ? payload.handledClasses : []
  const homeSectionStudents = Array.isArray(payload.homeSectionStudents) ? payload.homeSectionStudents : []

  return {
    sectionId: String((payload.sectionId as EntityId) ?? '0'),
    sectionName: (payload.sectionName as string) ?? '',
    courseId: String((payload.courseId as EntityId) ?? '0'),
    courseName: (payload.courseName as string) ?? '',
    handledClassCount: (payload.handledClassCount as number) ?? 0,
    homeSectionStudentCount: (payload.homeSectionStudentCount as number) ?? 0,
    handledClasses: (handledClasses as Record<string, unknown>[]).map(handledClass => normalizeHandledClassDetail(handledClass)),
    homeSectionStudents: (homeSectionStudents as Record<string, unknown>[]).map(student => normalizeHomeSectionStudent(student)),
  }
}

function normalizeHandledClassDetail(payload: Record<string, unknown>) {
  const students = Array.isArray(payload.students) ? payload.students : []

  return {
    subjectId: String((payload.subjectId as EntityId) ?? '0'),
    subjectName: (payload.subjectName as string) ?? '',
    subjectCode: (payload.subjectCode as string) ?? '',
    scheduleId: String((payload.scheduleId as EntityId) ?? '0'),
    dayOfWeek: (payload.dayOfWeek as string) ?? '',
    timeIn: (payload.timeIn as string) ?? '',
    timeOut: (payload.timeOut as string) ?? '',
    classroomId: String((payload.classroomId as EntityId) ?? '0'),
    classroomName: (payload.classroomName as string) ?? '',
    studentCount: (payload.studentCount as number) ?? 0,
    students: (students as Record<string, unknown>[]).map(student => normalizeHandledClassStudent(student)),
  }
}

function normalizeHandledClassStudent(payload: Record<string, unknown>) {
  return {
    studentId: String((payload.studentId as EntityId) ?? '0'),
    firstname: (payload.firstname as string) ?? '',
    lastname: (payload.lastname as string) ?? '',
    isRegular: (payload.isRegular as boolean) ?? false,
    enrollmentType: (payload.enrollmentType as string) ?? 'Regular',
    hasFingerprint: (payload.hasFingerprint as boolean) ?? false,
    fingerprintDeviceId: payload.fingerprintDeviceId ? String(payload.fingerprintDeviceId as EntityId) : undefined,
    fingerprintDeviceName: (payload.fingerprintDeviceName as string) ?? undefined,
  }
}

function normalizeHomeSectionStudent(payload: Record<string, unknown>) {
  return {
    studentId: String((payload.studentId as EntityId) ?? '0'),
    firstname: (payload.firstname as string) ?? '',
    lastname: (payload.lastname as string) ?? '',
    isRegular: (payload.isRegular as boolean) ?? false,
    enrollmentType: (payload.enrollmentType as string) ?? 'Regular',
    hasFingerprint: (payload.hasFingerprint as boolean) ?? false,
    fingerprintDeviceId: payload.fingerprintDeviceId ? String(payload.fingerprintDeviceId as EntityId) : undefined,
    fingerprintDeviceName: (payload.fingerprintDeviceName as string) ?? undefined,
  }
}

function normalizeStudentDetail(payload: Record<string, unknown>): InstructorStudentDetail {
  const enrollments = Array.isArray(payload.enrollments) ? payload.enrollments : []
  const attendanceSummary = payload.attendanceSummary ?? {}

  return {
    studentId: String((payload.studentId as EntityId) ?? '0'),
    firstname: (payload.firstname as string) ?? '',
    lastname: (payload.lastname as string) ?? '',
    sectionId: payload.sectionId ? String(payload.sectionId as EntityId) : null,
    sectionName: (payload.sectionName as string | null) ?? null,
    courseId: payload.courseId ? String(payload.courseId as EntityId) : null,
    courseName: (payload.courseName as string | null) ?? null,
    isRegular: (payload.isRegular as boolean) ?? false,
    enrollmentType: (payload.enrollmentType as string) ?? 'Regular',
    enrollments: (enrollments as Record<string, unknown>[]).map(enrollment => normalizeStudentEnrollment(enrollment)),
    attendanceSummary: normalizeStudentAttendanceSummary(attendanceSummary as Record<string, unknown>),
    fingerprint: normalizeStudentFingerprint(payload.fingerprint as Record<string, unknown> | null),
  }
}

function normalizeStudentFingerprint(payload: Record<string, unknown> | null | undefined) {
  if (!payload) {
    return null
  }

  return {
    id: String((payload.id as EntityId) ?? '0'),
    deviceId: String((payload.deviceId as EntityId) ?? '0'),
    deviceName: (payload.deviceName as string) ?? '',
    deviceLocation: (payload.deviceLocation as string) ?? '',
    enrolledAt: (payload.enrolledAt as string) ?? '',
  }
}

function normalizeStudentEnrollment(payload: Record<string, unknown>) {
  return {
    subjectId: String((payload.subjectId as EntityId) ?? '0'),
    subjectName: (payload.subjectName as string) ?? '',
    subjectCode: (payload.subjectCode as string) ?? '',
    sectionId: String((payload.sectionId as EntityId) ?? '0'),
    sectionName: (payload.sectionName as string) ?? '',
    enrollmentType: (payload.enrollmentType as string) ?? 'Regular',
  }
}

function normalizeStudentAttendanceSummary(payload: Record<string, unknown>) {
  return {
    totalSessions: (payload.totalSessions as number) ?? 0,
    presentCount: (payload.presentCount as number) ?? 0,
    absentCount: (payload.absentCount as number) ?? 0,
    lateCount: (payload.lateCount as number) ?? 0,
    attendanceRate: (payload.attendanceRate as number) ?? 0,
  }
}

export default {
  getMySchedules,
  getMyProfile,
  getInstructorSubjects,
  getMySectionsWithStudents,
  getMySectionsOverview,
  getMySectionDetail,
  getMyStudentDetail,
}

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

export async function getMySectionDetail(sectionId: number): Promise<InstructorSectionDetail> {
  try {
    const response = await api.get(`/instructors/me/sections/${sectionId}`)
    return normalizeSectionDetail(response.data)
  }
  catch (error) {
    console.error(`Failed to fetch instructor section detail for section ${sectionId}:`, error)
    return Promise.reject(error)
  }
}

export async function getMyStudentDetail(studentId: number): Promise<InstructorStudentDetail> {
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
  const sections = Array.isArray(payload.sections) ? payload.sections : (payload.Sections as unknown[]) ?? []

  return {
    instructorId: (payload.instructorId as number) ?? (payload.InstructorId as number) ?? 0,
    instructorFirstname: (payload.instructorFirstname as string) ?? (payload.InstructorFirstname as string) ?? '',
    instructorLastname: (payload.instructorLastname as string) ?? (payload.InstructorLastname as string) ?? '',
    sections: (sections as Record<string, unknown>[]).map(section => ({
      sectionId: (section.sectionId as number) ?? (section.SectionId as number) ?? 0,
      sectionName: (section.sectionName as string) ?? (section.SectionName as string) ?? '',
      courseId: (section.courseId as number) ?? (section.CourseId as number) ?? 0,
      courseName: (section.courseName as string) ?? (section.CourseName as string) ?? '',
      subjects: ((section.subjects ?? section.Subjects) as unknown[] ?? []).map(subject => ({
        subjectId: ((subject as Record<string, unknown>).subjectId as number) ?? ((subject as Record<string, unknown>).SubjectId as number) ?? 0,
        subjectName: ((subject as Record<string, unknown>).subjectName as string) ?? ((subject as Record<string, unknown>).SubjectName as string) ?? '',
        subjectCode: ((subject as Record<string, unknown>).subjectCode as string) ?? ((subject as Record<string, unknown>).SubjectCode as string) ?? '',
        scheduleId: ((subject as Record<string, unknown>).scheduleId as number) ?? ((subject as Record<string, unknown>).ScheduleId as number) ?? 0,
        dayOfWeek: ((subject as Record<string, unknown>).dayOfWeek as string) ?? ((subject as Record<string, unknown>).DayOfWeek as string) ?? '',
        timeIn: ((subject as Record<string, unknown>).timeIn as string) ?? ((subject as Record<string, unknown>).TimeIn as string) ?? '',
        timeOut: ((subject as Record<string, unknown>).timeOut as string) ?? ((subject as Record<string, unknown>).TimeOut as string) ?? '',
        classroomName: ((subject as Record<string, unknown>).classroomName as string) ?? ((subject as Record<string, unknown>).ClassroomName as string) ?? '',
        students: (((subject as Record<string, unknown>).students ?? (subject as Record<string, unknown>).Students) as unknown[] ?? []).map(student => ({
          studentId: ((student as Record<string, unknown>).studentId as number) ?? ((student as Record<string, unknown>).StudentId as number) ?? 0,
          firstname: ((student as Record<string, unknown>).firstname as string) ?? ((student as Record<string, unknown>).Firstname as string) ?? '',
          lastname: ((student as Record<string, unknown>).lastname as string) ?? ((student as Record<string, unknown>).Lastname as string) ?? '',
          isRegular: ((student as Record<string, unknown>).isRegular as boolean) ?? ((student as Record<string, unknown>).IsRegular as boolean) ?? false,
          enrollmentType: ((student as Record<string, unknown>).enrollmentType as string) ?? ((student as Record<string, unknown>).EnrollmentType as string) ?? 'Regular',
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
      : (payload.Sections as unknown[]) ?? []

  return (sections as Record<string, unknown>[]).map(section => normalizeSectionOverviewItem(section))
}

function normalizeSectionOverviewItem(section: Record<string, unknown>): InstructorSectionOverviewItem {
  return {
    sectionId: (section.sectionId as number) ?? (section.SectionId as number) ?? 0,
    sectionUuid: (section.sectionUuid as string) ?? (section.SectionUuid as string) ?? '',
    sectionName: (section.sectionName as string) ?? (section.SectionName as string) ?? '',
    courseId: (section.courseId as number) ?? (section.CourseId as number) ?? 0,
    courseUuid: (section.courseUuid as string) ?? (section.CourseUuid as string) ?? '',
    courseName: (section.courseName as string) ?? (section.CourseName as string) ?? '',
    handledClassCount: (section.handledClassCount as number) ?? (section.HandledClassCount as number) ?? 0,
    uniqueStudentCount: (section.uniqueStudentCount as number) ?? (section.UniqueStudentCount as number) ?? 0,
  }
}

function normalizeSectionDetail(payload: Record<string, unknown>): InstructorSectionDetail {
  const handledClasses = Array.isArray(payload.handledClasses) ? payload.handledClasses : (payload.HandledClasses as unknown[]) ?? []
  const homeSectionStudents = Array.isArray(payload.homeSectionStudents) ? payload.homeSectionStudents : (payload.HomeSectionStudents as unknown[]) ?? []

  return {
    sectionId: (payload.sectionId as number) ?? (payload.SectionId as number) ?? 0,
    sectionUuid: (payload.sectionUuid as string) ?? (payload.SectionUuid as string) ?? '',
    sectionName: (payload.sectionName as string) ?? (payload.SectionName as string) ?? '',
    courseId: (payload.courseId as number) ?? (payload.CourseId as number) ?? 0,
    courseUuid: (payload.courseUuid as string) ?? (payload.CourseUuid as string) ?? '',
    courseName: (payload.courseName as string) ?? (payload.CourseName as string) ?? '',
    handledClassCount: (payload.handledClassCount as number) ?? (payload.HandledClassCount as number) ?? 0,
    homeSectionStudentCount: (payload.homeSectionStudentCount as number) ?? (payload.HomeSectionStudentCount as number) ?? 0,
    handledClasses: (handledClasses as Record<string, unknown>[]).map(handledClass => normalizeHandledClassDetail(handledClass)),
    homeSectionStudents: (homeSectionStudents as Record<string, unknown>[]).map(student => normalizeHomeSectionStudent(student)),
  }
}

function normalizeHandledClassDetail(payload: Record<string, unknown>) {
  const students = Array.isArray(payload.students) ? payload.students : (payload.Students as unknown[]) ?? []

  return {
    subjectId: (payload.subjectId as number) ?? (payload.SubjectId as number) ?? 0,
    subjectUuid: (payload.subjectUuid as string) ?? (payload.SubjectUuid as string) ?? '',
    subjectName: (payload.subjectName as string) ?? (payload.SubjectName as string) ?? '',
    subjectCode: (payload.subjectCode as string) ?? (payload.SubjectCode as string) ?? '',
    scheduleId: (payload.scheduleId as number) ?? (payload.ScheduleId as number) ?? 0,
    scheduleUuid: (payload.scheduleUuid as string) ?? (payload.ScheduleUuid as string) ?? '',
    dayOfWeek: (payload.dayOfWeek as string) ?? (payload.DayOfWeek as string) ?? '',
    timeIn: (payload.timeIn as string) ?? (payload.TimeIn as string) ?? '',
    timeOut: (payload.timeOut as string) ?? (payload.TimeOut as string) ?? '',
    classroomId: (payload.classroomId as number) ?? (payload.ClassroomId as number) ?? 0,
    classroomUuid: (payload.classroomUuid as string) ?? (payload.ClassroomUuid as string) ?? '',
    classroomName: (payload.classroomName as string) ?? (payload.ClassroomName as string) ?? '',
    studentCount: (payload.studentCount as number) ?? (payload.StudentCount as number) ?? 0,
    students: (students as Record<string, unknown>[]).map(student => normalizeHandledClassStudent(student)),
  }
}

function normalizeHandledClassStudent(payload: Record<string, unknown>) {
  return {
    studentId: (payload.studentId as number) ?? (payload.StudentId as number) ?? 0,
    studentUuid: (payload.studentUuid as string) ?? (payload.StudentUuid as string) ?? '',
    firstname: (payload.firstname as string) ?? (payload.Firstname as string) ?? '',
    lastname: (payload.lastname as string) ?? (payload.Lastname as string) ?? '',
    isRegular: (payload.isRegular as boolean) ?? (payload.IsRegular as boolean) ?? false,
    enrollmentType: (payload.enrollmentType as string) ?? (payload.EnrollmentType as string) ?? 'Regular',
  }
}

function normalizeHomeSectionStudent(payload: Record<string, unknown>) {
  return {
    studentId: (payload.studentId as number) ?? (payload.StudentId as number) ?? 0,
    studentUuid: (payload.studentUuid as string) ?? (payload.StudentUuid as string) ?? '',
    firstname: (payload.firstname as string) ?? (payload.Firstname as string) ?? '',
    lastname: (payload.lastname as string) ?? (payload.Lastname as string) ?? '',
    isRegular: (payload.isRegular as boolean) ?? (payload.IsRegular as boolean) ?? false,
    enrollmentType: (payload.enrollmentType as string) ?? (payload.EnrollmentType as string) ?? 'Regular',
  }
}

function normalizeStudentDetail(payload: Record<string, unknown>): InstructorStudentDetail {
  const enrollments = Array.isArray(payload.enrollments) ? payload.enrollments : (payload.Enrollments as unknown[]) ?? []
  const attendanceSummary = payload.attendanceSummary ?? payload.AttendanceSummary ?? {}

  return {
    studentId: (payload.studentId as number) ?? (payload.StudentId as number) ?? 0,
    studentUuid: (payload.studentUuid as string) ?? (payload.StudentUuid as string) ?? '',
    firstname: (payload.firstname as string) ?? (payload.Firstname as string) ?? '',
    lastname: (payload.lastname as string) ?? (payload.Lastname as string) ?? '',
    sectionId: (payload.sectionId as number | null) ?? (payload.SectionId as number | null) ?? null,
    sectionName: (payload.sectionName as string | null) ?? (payload.SectionName as string | null) ?? null,
    courseId: (payload.courseId as number | null) ?? (payload.CourseId as number | null) ?? null,
    courseName: (payload.courseName as string | null) ?? (payload.CourseName as string | null) ?? null,
    isRegular: (payload.isRegular as boolean) ?? (payload.IsRegular as boolean) ?? false,
    enrollmentType: (payload.enrollmentType as string) ?? (payload.EnrollmentType as string) ?? 'Regular',
    enrollments: (enrollments as Record<string, unknown>[]).map(enrollment => normalizeStudentEnrollment(enrollment)),
    attendanceSummary: normalizeStudentAttendanceSummary(attendanceSummary as Record<string, unknown>),
  }
}

function normalizeStudentEnrollment(payload: Record<string, unknown>) {
  return {
    subjectId: (payload.subjectId as number) ?? (payload.SubjectId as number) ?? 0,
    subjectName: (payload.subjectName as string) ?? (payload.SubjectName as string) ?? '',
    subjectCode: (payload.subjectCode as string) ?? (payload.SubjectCode as string) ?? '',
    sectionId: (payload.sectionId as number) ?? (payload.SectionId as number) ?? 0,
    sectionName: (payload.sectionName as string) ?? (payload.SectionName as string) ?? '',
    enrollmentType: (payload.enrollmentType as string) ?? (payload.EnrollmentType as string) ?? 'Regular',
  }
}

function normalizeStudentAttendanceSummary(payload: Record<string, unknown>) {
  return {
    totalSessions: (payload.totalSessions as number) ?? (payload.TotalSessions as number) ?? 0,
    presentCount: (payload.presentCount as number) ?? (payload.PresentCount as number) ?? 0,
    absentCount: (payload.absentCount as number) ?? (payload.AbsentCount as number) ?? 0,
    lateCount: (payload.lateCount as number) ?? (payload.LateCount as number) ?? 0,
    attendanceRate: (payload.attendanceRate as number) ?? (payload.AttendanceRate as number) ?? 0,
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

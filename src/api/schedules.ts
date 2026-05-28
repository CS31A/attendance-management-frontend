import type { AxiosResponse } from 'axios'
import type { EntityId, PaginationParams } from '@/types'
import api from './index'

const SCHEDULE_ENDPOINT = '/schedules'

export interface ScheduleRelationDto {
  id?: EntityId
  name?: string
  title?: string
  code?: string
  room?: string
  sectionName?: string
  courseName?: string
  classroomName?: string
}

export interface ScheduleInstructorDto {
  id?: EntityId
  firstname?: string
  lastname?: string
  firstName?: string
  lastName?: string
}

export interface ScheduleDto {
  id: EntityId
  dayOfWeek?: string
  timeIn?: string
  timeOut?: string
  startTime?: string
  endTime?: string
  scheduledStartTime?: string
  scheduledEndTime?: string
  subjectId?: EntityId | null
  classroomId?: EntityId | null
  sectionId?: EntityId | null
  instructorId?: EntityId | null
  courseId?: EntityId | null
  subjectCode?: string
  subjectName?: string
  courseCode?: string
  courseName?: string
  sectionName?: string
  classroomName?: string
  instructorFirstName?: string
  instructorLastName?: string
  subject?: ScheduleRelationDto | null
  section?: ScheduleRelationDto | null
  classroom?: ScheduleRelationDto | null
  course?: ScheduleRelationDto | null
  instructor?: ScheduleInstructorDto | null
}

export type ScheduleCollectionDto = ScheduleDto[]
export interface SchedulePayload {
  timeIn: string
  timeOut: string
  dayOfWeek: string
  subjectId: EntityId
  classroomId: EntityId
  sectionId: EntityId
  instructorId: EntityId
}

export type ScheduleQueryParams = PaginationParams & {
}

function normalizeSchedule(schedule: ScheduleDto): ScheduleDto {
  const instructor = schedule.instructor

  return Object.assign(schedule, {
    subjectId: schedule.subjectId ?? schedule.subject?.id ?? null,
    subjectCode: schedule.subjectCode ?? schedule.subject?.code,
    subjectName: schedule.subjectName ?? schedule.subject?.name,
    classroomId: schedule.classroomId ?? schedule.classroom?.id ?? null,
    classroomName: schedule.classroomName ?? schedule.classroom?.name ?? schedule.classroom?.classroomName,
    sectionId: schedule.sectionId ?? schedule.section?.id ?? null,
    sectionName: schedule.sectionName ?? schedule.section?.name ?? schedule.section?.sectionName,
    courseId: schedule.courseId ?? schedule.course?.id ?? null,
    courseCode: schedule.courseCode ?? schedule.course?.code,
    courseName: schedule.courseName ?? schedule.course?.name ?? schedule.course?.courseName,
    instructorId: schedule.instructorId ?? instructor?.id ?? null,
    instructorFirstName: schedule.instructorFirstName ?? instructor?.firstName ?? instructor?.firstname,
    instructorLastName: schedule.instructorLastName ?? instructor?.lastName ?? instructor?.lastname,
  })
}

export function toSchedule(dto: ScheduleDto): {
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
} {
  return {
    id: dto.id,
    dayOfWeek: dto.dayOfWeek ?? '',
    timeIn: dto.timeIn ?? '',
    timeOut: dto.timeOut ?? '',
    subjectId: dto.subjectId ?? dto.subject?.id ?? null,
    classroomId: dto.classroomId ?? dto.classroom?.id ?? null,
    sectionId: dto.sectionId ?? dto.section?.id ?? null,
    instructorId: dto.instructorId ?? dto.instructor?.id ?? null,
    courseId: dto.courseId ?? dto.course?.id ?? null,
    subjectCode: dto.subjectCode ?? dto.subject?.code ?? '',
    subjectName: dto.subjectName ?? dto.subject?.name ?? '',
    courseCode: dto.courseCode ?? dto.course?.code ?? '',
    courseName: dto.courseName ?? dto.course?.name ?? '',
    sectionName: dto.sectionName ?? dto.section?.name ?? '',
    classroomName: dto.classroomName ?? dto.classroom?.name ?? '',
    instructorFirstName: dto.instructorFirstName ?? dto.instructor?.firstName ?? dto.instructor?.firstname ?? '',
    instructorLastName: dto.instructorLastName ?? dto.instructor?.lastName ?? dto.instructor?.lastname ?? '',
  }
}

export function toScheduleInstructor(dto: ScheduleInstructorDto): {
  id: EntityId
  firstName: string
  lastName: string
} {
  return {
    id: dto.id ?? '',
    firstName: dto.firstName ?? dto.firstname ?? '',
    lastName: dto.lastName ?? dto.lastname ?? '',
  }
}

function normalizeScheduleCollection(data: ScheduleCollectionDto): ScheduleCollectionDto {
  return data.map(normalizeSchedule)
}

/**
 * Get all schedules
 * @returns {Promise<Array>} List of schedule objects
 */
export async function getAllSchedules(): Promise<ScheduleCollectionDto> {
  try {
    const response = await api.get(SCHEDULE_ENDPOINT)
    return normalizeScheduleCollection(response.data)
  }
  catch (error) {
    console.error('Failed to fetch schedules:', error)
    return Promise.reject(error)
  }
}

/**
 * Get schedules for a specific section
 * @param {EntityId} sectionId - Section ID (string UUID)
 * @returns {Promise<Array>} List of schedule objects for the section
 */
export async function getSchedulesBySection(sectionId: EntityId): Promise<ScheduleCollectionDto> {
  try {
    const response = await api.get(`${SCHEDULE_ENDPOINT}/by-section/${sectionId}`)
    return normalizeScheduleCollection(response.data)
  }
  catch (error) {
    console.error(`Failed to fetch schedules for section ${sectionId}:`, error)
    return Promise.reject(error)
  }
}

/**
 * Get schedules for the current instructor
 * @returns {Promise<Array>} List of schedule objects for the current instructor
 */
export async function getMySchedules(): Promise<ScheduleCollectionDto> {
  try {
    const response = await api.get(`${SCHEDULE_ENDPOINT}/my-schedules`)
    return normalizeScheduleCollection(response.data)
  }
  catch (error) {
    console.error('Failed to fetch my schedules:', error)
    return Promise.reject(error)
  }
}

/**
 * Get a specific schedule by ID
 * @param {EntityId} id - Schedule ID (string UUID)
 * @returns {Promise<object>} Schedule object
 */
export async function getScheduleById(id: EntityId): Promise<ScheduleDto> {
  try {
    const response = await api.get(`${SCHEDULE_ENDPOINT}/${id}`)
    return normalizeSchedule(response.data)
  }
  catch (error) {
    console.error(`Failed to fetch schedule ${id}:`, error)
    return Promise.reject(error)
  }
}

/**
 * Create a new schedule
 * @param {object} data - Schedule data
 * @returns {Promise<object>} Created schedule object
 */
export async function createSchedule(data: SchedulePayload): Promise<ScheduleDto> {
  try {
    const response = await api.post(SCHEDULE_ENDPOINT, data)
    return normalizeSchedule(response.data)
  }
  catch (error) {
    console.error('Failed to create schedule:', error)
    return Promise.reject(error)
  }
}

/**
 * Update an existing schedule
 * @param {EntityId} id - Schedule ID (string UUID)
 * @param {object} data - Updated schedule data
 * @returns {Promise<object>} Updated schedule object
 */
export async function updateSchedule(id: EntityId, data: SchedulePayload): Promise<ScheduleDto> {
  try {
    const response = await api.patch(`${SCHEDULE_ENDPOINT}/${id}`, data)
    return normalizeSchedule(response.data)
  }
  catch (error) {
    console.error(`Failed to update schedule ${id}:`, error)
    return Promise.reject(error)
  }
}

/**
 * Delete a schedule
 * @param {EntityId} id - Schedule ID (string UUID)
 * @returns {Promise<void>}
 */
export async function deleteSchedule(id: EntityId): Promise<void> {
  try {
    await api.delete(`${SCHEDULE_ENDPOINT}/${id}`)
  }
  catch (error) {
    console.error(`Failed to delete schedule ${id}:`, error)
    return Promise.reject(error)
  }
}

/**
 * Check if schedule has sessions assigned
 * @param {EntityId} id - Schedule ID (string UUID)
 * @returns {Promise<AxiosResponse<boolean>>} True if schedule has sessions
 */
export async function hasSessionsInSchedule(id: EntityId): Promise<AxiosResponse<boolean>> {
  try {
    return await api.get<boolean>(`${SCHEDULE_ENDPOINT}/${id}/has-sessions`)
  }
  catch (error) {
    console.error(`Failed to check sessions for schedule ${id}:`, error)
    return Promise.reject(error)
  }
}

export default {
  getAllSchedules,
  getMySchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesBySection,
  hasSessionsInSchedule,
}

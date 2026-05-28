import type { Session } from '@/types/domain/session'
import type { AttendanceRecord, SessionAttendanceRecord, AttendanceSummary } from '@/types/domain/attendance'
import type { Schedule, ScheduleInstructor } from '@/types/domain/schedule'
import type { Course } from '@/types/domain/course'
import type { Section } from '@/types/domain/section'
import type { Subject } from '@/types/domain/subject'
import type { Classroom } from '@/types/domain/classroom'
import type { Enrollment } from '@/types/domain/enrollment'
import type { EntityId } from '@/types'

type IsAny<T> = 0 extends (1 & T) ? true : false
type IsRecordStringUnknown<T> = T extends Record<string, unknown> ? true : false
type ExpectTrue<T extends true> = T
type ExpectFalse<T extends false> = T
type Extends<T, U> = T extends U ? true : false
type IsOptional<T, K extends keyof T> = {} extends Pick<T, K> ? true : false

// Session
type _sessionNotAny = ExpectFalse<IsAny<Session>>
type _sessionNotRecord = ExpectFalse<IsRecordStringUnknown<Session>>
type _sessionHasId = ExpectTrue<Extends<Session['id'], EntityId>>
type _sessionHasStatus = ExpectTrue<Extends<Session['status'], string>>
type _sessionIdRequired = ExpectFalse<IsOptional<Session, 'id'>>
type _sessionStatusRequired = ExpectFalse<IsOptional<Session, 'status'>>

// AttendanceRecord
type _attendanceNotAny = ExpectFalse<IsAny<AttendanceRecord>>
type _attendanceNotRecord = ExpectFalse<IsRecordStringUnknown<AttendanceRecord>>
type _attendanceHasId = ExpectTrue<Extends<AttendanceRecord['id'], EntityId>>
type _attendanceHasStudentId = ExpectTrue<Extends<AttendanceRecord['studentId'], EntityId>>
type _attendanceHasSessionId = ExpectTrue<Extends<AttendanceRecord['sessionId'], EntityId>>
type _attendanceHasStatus = ExpectTrue<Extends<AttendanceRecord['status'], string>>

// SessionAttendanceRecord
type _sessionAttendanceNotAny = ExpectFalse<IsAny<SessionAttendanceRecord>>
type _sessionAttendanceNotRecord = ExpectFalse<IsRecordStringUnknown<SessionAttendanceRecord>>
type _sessionAttendanceExtendsAttendance = ExpectTrue<Extends<SessionAttendanceRecord, AttendanceRecord>>

// AttendanceSummary
type _attendanceSummaryNotAny = ExpectFalse<IsAny<AttendanceSummary>>
type _attendanceSummaryNotRecord = ExpectFalse<IsRecordStringUnknown<AttendanceSummary>>
type _attendanceSummaryHasTotalSessions = ExpectTrue<Extends<AttendanceSummary['totalSessions'], number>>

// Schedule
type _scheduleNotAny = ExpectFalse<IsAny<Schedule>>
type _scheduleNotRecord = ExpectFalse<IsRecordStringUnknown<Schedule>>
type _scheduleHasId = ExpectTrue<Extends<Schedule['id'], EntityId>>
type _scheduleHasDayOfWeek = ExpectTrue<Extends<Schedule['dayOfWeek'], string>>
type _scheduleHasTimeIn = ExpectTrue<Extends<Schedule['timeIn'], string>>
type _scheduleHasTimeOut = ExpectTrue<Extends<Schedule['timeOut'], string>>
type _scheduleHasSubjectId = ExpectTrue<Extends<Schedule['subjectId'], EntityId | null>>
type _scheduleHasClassroomId = ExpectTrue<Extends<Schedule['classroomId'], EntityId | null>>
type _scheduleHasSectionId = ExpectTrue<Extends<Schedule['sectionId'], EntityId | null>>
type _scheduleHasInstructorId = ExpectTrue<Extends<Schedule['instructorId'], EntityId | null>>
type _scheduleDayOfWeekRequired = ExpectFalse<IsOptional<Schedule, 'dayOfWeek'>>

// ScheduleInstructor
type _scheduleInstructorNotAny = ExpectFalse<IsAny<ScheduleInstructor>>
type _scheduleInstructorNotRecord = ExpectFalse<IsRecordStringUnknown<ScheduleInstructor>>
type _scheduleInstructorHasId = ExpectTrue<Extends<ScheduleInstructor['id'], EntityId>>
type _scheduleInstructorHasFirstName = ExpectTrue<Extends<ScheduleInstructor['firstName'], string>>
type _scheduleInstructorHasLastName = ExpectTrue<Extends<ScheduleInstructor['lastName'], string>>

// Course
type _courseNotAny = ExpectFalse<IsAny<Course>>
type _courseNotRecord = ExpectFalse<IsRecordStringUnknown<Course>>
type _courseHasId = ExpectTrue<Extends<Course['id'], EntityId>>
type _courseHasName = ExpectTrue<Extends<Course['name'], string>>
type _courseNameRequired = ExpectFalse<IsOptional<Course, 'name'>>

// Section
type _sectionNotAny = ExpectFalse<IsAny<Section>>
type _sectionNotRecord = ExpectFalse<IsRecordStringUnknown<Section>>
type _sectionHasId = ExpectTrue<Extends<Section['id'], EntityId>>
type _sectionHasName = ExpectTrue<Extends<Section['name'], string>>
type _sectionNameRequired = ExpectFalse<IsOptional<Section, 'name'>>

// Subject
type _subjectNotAny = ExpectFalse<IsAny<Subject>>
type _subjectNotRecord = ExpectFalse<IsRecordStringUnknown<Subject>>
type _subjectHasId = ExpectTrue<Extends<Subject['id'], EntityId>>
type _subjectHasName = ExpectTrue<Extends<Subject['name'], string>>
type _subjectHasCode = ExpectTrue<Extends<Subject['code'], string>>
type _subjectNameRequired = ExpectFalse<IsOptional<Subject, 'name'>>
type _subjectCodeRequired = ExpectFalse<IsOptional<Subject, 'code'>>

// Classroom
type _classroomNotAny = ExpectFalse<IsAny<Classroom>>
type _classroomNotRecord = ExpectFalse<IsRecordStringUnknown<Classroom>>
type _classroomHasId = ExpectTrue<Extends<Classroom['id'], EntityId>>
type _classroomHasName = ExpectTrue<Extends<Classroom['name'], string>>
type _classroomNameRequired = ExpectFalse<IsOptional<Classroom, 'name'>>

// Enrollment
type _enrollmentNotAny = ExpectFalse<IsAny<Enrollment>>
type _enrollmentNotRecord = ExpectFalse<IsRecordStringUnknown<Enrollment>>
type _enrollmentHasId = ExpectTrue<Extends<Enrollment['id'], EntityId>>
type _enrollmentHasStudentId = ExpectTrue<Extends<Enrollment['studentId'], EntityId>>
type _enrollmentHasStatus = ExpectTrue<Extends<Enrollment['status'], string>>

export {}

import type { EnrollmentDto } from '@/api/enrollments'
import type { EntityId } from '@/types'

type IsAny<T> = 0 extends (1 & T) ? true : false
type ExpectFalse<T extends false> = T
type ExpectTrue<T extends true> = T
type Extends<T, U> = T extends U ? true : false

type AttendanceStore = ReturnType<typeof import('@/stores/attendanceStore').useAttendanceStore>
type AuthStore = ReturnType<typeof import('@/stores/authStore').useAuthStore>
type ClassroomStore = ReturnType<typeof import('@/stores/classroomStore').useClassroomStore>
type CourseStore = ReturnType<typeof import('@/stores/courseStore').useCourseStore>
type EnrollmentStore = ReturnType<typeof import('@/stores/enrollmentStore').useEnrollmentStore>
type ScheduleStore = ReturnType<typeof import('@/stores/scheduleStore').useScheduleStore>
type SectionStore = ReturnType<typeof import('@/stores/sectionStore').useSectionStore>
type SubjectStore = ReturnType<typeof import('@/stores/subjectStore').useSubjectStore>

type _attendanceRecordNotAny = ExpectFalse<IsAny<AttendanceStore['attendanceRecords'][number]>>
type _attendanceSummaryNotAny = ExpectFalse<IsAny<AttendanceStore['summary']>>
type _attendanceSubmitPayloadNotAny = ExpectFalse<IsAny<Parameters<AttendanceStore['submitAttendance']>[0]>>
type _attendanceUpdatePayloadNotAny = ExpectFalse<IsAny<Parameters<AttendanceStore['updateAttendanceRecord']>[1]>>
type _attendanceStatusParamNotAny = ExpectFalse<IsAny<Parameters<AttendanceStore['recordsByStatus']>[0]>>

type _authUserNotAny = ExpectFalse<IsAny<AuthStore['user']>>
type _authUserProfileNotAny = ExpectFalse<IsAny<AuthStore['userProfile']>>
type _authLoginIdentifierNotAny = ExpectFalse<IsAny<Parameters<AuthStore['login']>[0]>>

type _classroomItemNotAny = ExpectFalse<IsAny<ClassroomStore['classrooms'][number]>>
type _classroomPayloadNotAny = ExpectFalse<IsAny<Parameters<ClassroomStore['createClassroom']>[0]>>
type _classroomIdUsesEntityId = ExpectTrue<Extends<Parameters<ClassroomStore['fetchClassroom']>[0], EntityId>>

type _courseItemNotAny = ExpectFalse<IsAny<CourseStore['courses'][number]>>
type _coursePayloadNotAny = ExpectFalse<IsAny<Parameters<CourseStore['createCourse']>[0]>>

type _enrollmentItemNotAny = ExpectFalse<IsAny<EnrollmentStore['studentEnrollments'][number]>>
type _enrollmentPayloadNotAny = ExpectFalse<IsAny<Parameters<EnrollmentStore['enrollStudent']>[0]>>
type _enrollmentCheckStudentIdNotAny = ExpectFalse<IsAny<Parameters<EnrollmentStore['checkEnrollment']>[0]>>
type _enrollmentTypeShape = ExpectTrue<Extends<EnrollmentDto['enrollmentType'], string | undefined>>
type _enrollmentDateShape = ExpectTrue<Extends<EnrollmentDto['enrollmentDate'], string | null | undefined>>

type _scheduleItemNotAny = ExpectFalse<IsAny<ScheduleStore['schedules'][number]>>
type _scheduleCurrentNotAny = ExpectFalse<IsAny<ScheduleStore['currentSchedule']>>
type _schedulePayloadNotAny = ExpectFalse<IsAny<Parameters<ScheduleStore['createSchedule']>[0]>>

type _sectionItemNotAny = ExpectFalse<IsAny<SectionStore['sections'][number]>>
type _sectionPayloadNotAny = ExpectFalse<IsAny<Parameters<SectionStore['addSection']>[0]>>

type _subjectItemNotAny = ExpectFalse<IsAny<SubjectStore['subjects'][number]>>
type _subjectPayloadNotAny = ExpectFalse<IsAny<Parameters<SubjectStore['createSubject']>[0]>>

type _entityIdNormalizerReturn = ExpectTrue<Extends<ReturnType<typeof import('@/utils/entityId').normalizeEntityId>, string | null>>
type _entityIdMatcherReturn = ExpectTrue<Extends<ReturnType<typeof import('@/utils/entityId').entityIdsMatch>, boolean>>

export {}

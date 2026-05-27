import type { CourseDto, CoursePayload } from '@/api/courses'
import courseApi from '@/api/courses'
import { createCrudStore } from '@/stores/createCrudStore'

export const useCourseStore = createCrudStore<CourseDto, CoursePayload, 'course'>(
  'course',
  'course',
  {
    getAll: () => courseApi.getAllCourses(),
    getById: id => courseApi.getCourseById(id),
    create: data => courseApi.createCourse(data),
    update: (id, data) => courseApi.updateCourse(id, data),
    delete: id => courseApi.deleteCourse(id),
  },
)

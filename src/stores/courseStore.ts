import type { CoursePayload } from '@/api/courses'
import type { Course } from '@/types/domain/course'
import courseApi, { toCourse } from '@/api/courses'
import { createCrudStore } from '@/stores/createCrudStore'

export const useCourseStore = createCrudStore<Course, CoursePayload, 'course'>('course', 'course', {
  getAll: async () => {
    const res = await courseApi.getAllCourses()
    return { ...res, data: res.data.map(toCourse) }
  },
  getById: async (id) => {
    const res = await courseApi.getCourseById(id)
    return { ...res, data: toCourse(res.data) }
  },
  create: async (data) => {
    const res = await courseApi.createCourse(data)
    return { ...res, data: toCourse(res.data) }
  },
  update: async (id, data) => {
    const res = await courseApi.updateCourse(id, data)
    return { ...res, data: toCourse(res.data) }
  },
  delete: id => courseApi.deleteCourse(id),
})

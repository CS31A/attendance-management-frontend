import type { ClassroomPayload } from '@/api/classrooms'
import type { Classroom } from '@/types/domain/classroom'
import classroomApi, { toClassroom } from '@/api/classrooms'
import { createCrudStore } from '@/stores/createCrudStore'

export const useClassroomStore = createCrudStore<Classroom, ClassroomPayload, 'classroom'>('classroom', 'classroom', {
  getAll: async () => {
    const res = await classroomApi.getAllClassrooms()
    return { ...res, data: res.data.map(toClassroom) }
  },
  getById: async (id) => {
    const res = await classroomApi.getClassroomById(id)
    return { ...res, data: toClassroom(res.data) }
  },
  create: async (data) => {
    const res = await classroomApi.createClassroom(data)
    return { ...res, data: toClassroom(res.data) }
  },
  update: async (id, data) => {
    const res = await classroomApi.updateClassroom(id, data)
    return { ...res, data: toClassroom(res.data) }
  },
  delete: id => classroomApi.deleteClassroom(id),
})

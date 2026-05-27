import type { ClassroomDto, ClassroomPayload } from '@/api/classrooms'
import classroomApi from '@/api/classrooms'
import { createCrudStore } from '@/stores/createCrudStore'

export const useClassroomStore = createCrudStore<ClassroomDto, ClassroomPayload, 'classroom'>(
  'classroom',
  'classroom',
  {
    getAll: () => classroomApi.getAllClassrooms(),
    getById: id => classroomApi.getClassroomById(id),
    create: data => classroomApi.createClassroom(data),
    update: (id, data) => classroomApi.updateClassroom(id, data),
    delete: id => classroomApi.deleteClassroom(id),
  },
)

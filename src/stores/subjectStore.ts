import type { SubjectPayload } from '@/api/subjects'
import type { Subject } from '@/types/domain/subject'
import subjectApi, { toSubject } from '@/api/subjects'
import { createCrudStore } from '@/stores/createCrudStore'

export const useSubjectStore = createCrudStore<Subject, SubjectPayload, 'subject'>('subject', 'subject', {
  getAll: async () => {
    const res = await subjectApi.getAllSubjects()
    return { ...res, data: res.data.map(toSubject) }
  },
  getById: async (id) => {
    const res = await subjectApi.getSubjectById(id)
    return { ...res, data: toSubject(res.data) }
  },
  create: async (data) => {
    const res = await subjectApi.createSubject(data)
    return { ...res, data: toSubject(res.data) }
  },
  update: async (id, data) => {
    const res = await subjectApi.updateSubject(id, data)
    return { ...res, data: toSubject(res.data) }
  },
  delete: id => subjectApi.deleteSubject(id),
})

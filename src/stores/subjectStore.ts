import type { SubjectDto, SubjectPayload } from '@/api/subjects'
import subjectApi from '@/api/subjects'
import { createCrudStore } from '@/stores/createCrudStore'

export const useSubjectStore = createCrudStore<SubjectDto, SubjectPayload, 'subject'>(
  'subject',
  'subject',
  {
    getAll: () => subjectApi.getAllSubjects(),
    getById: id => subjectApi.getSubjectById(id),
    create: data => subjectApi.createSubject(data),
    update: (id, data) => subjectApi.updateSubject(id, data),
    delete: id => subjectApi.deleteSubject(id),
  },
)

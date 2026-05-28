import type { EntityId } from '@/types'

export interface Section {
  id: EntityId
  name: string
  sectionName?: string
  code?: string
  courseId?: EntityId
  createdAt?: string
}

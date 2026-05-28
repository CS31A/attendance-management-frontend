import type { EntityId } from '@/types'

export interface Course {
  id: EntityId
  name: string
  code?: string
}

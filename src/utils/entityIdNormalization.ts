import type { EntityId } from '@/types'

type EntityLike = Record<string, unknown>

function asNonEmptyString(value: unknown): EntityId | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

export function getPublicEntityId(entity: EntityLike): EntityId {
  return asNonEmptyString(entity.uuid)
    ?? asNonEmptyString(entity.Uuid)
    ?? asNonEmptyString(entity.id)
    ?? asNonEmptyString(entity.Id)
    ?? ''
}

export function normalizePublicEntityId<T extends EntityLike>(entities: T[]): Array<T & { id: EntityId, numericId?: number }> {
  return entities.map((entity) => {
    const publicId = getPublicEntityId(entity)
    const numericId = typeof entity.id === 'number' ? entity.id : undefined

    return {
      ...entity,
      ...(numericId === undefined ? {} : { numericId }),
      id: publicId,
    }
  })
}

import type { EntityId } from '@/types'

type EntityLike = { id: EntityId }

function asNonEmptyString(value: unknown): EntityId | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

export function getPublicEntityId(entity: EntityLike): EntityId {
  const raw = entity as Record<string, unknown>
  return asNonEmptyString(raw.uuid as string)
    ?? asNonEmptyString(raw.Uuid as string)
    ?? asNonEmptyString(entity.id)
    ?? asNonEmptyString(raw.Id as string)
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

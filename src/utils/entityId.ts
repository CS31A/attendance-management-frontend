import type { EntityId } from '@/types'

export function normalizeEntityId(id: EntityId | null | undefined): string | null {
  if (id === null || id === undefined)
    return null

  return String(id)
}

export function entityIdsMatch(left: EntityId | null | undefined, right: EntityId | null | undefined): boolean {
  const normalizedLeft = normalizeEntityId(left)
  const normalizedRight = normalizeEntityId(right)

  return normalizedLeft !== null && normalizedLeft === normalizedRight
}

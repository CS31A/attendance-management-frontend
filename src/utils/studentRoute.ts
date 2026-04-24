import type { EntityId } from '@/types'

interface StudentRouteUser {
  role?: string
  profileId?: EntityId
  userId?: EntityId
  id?: EntityId
}

function toRouteId(value: EntityId | undefined): string | null {
  if (typeof value !== 'string')
    return null

  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function resolveStudentProfileId(user: StudentRouteUser): string | null {
  if (user.role !== 'Student')
    return null

  return toRouteId(user.profileId)
}

export function parseStudentRouteParam(value: EntityId | undefined): string | null {
  return toRouteId(value)
}

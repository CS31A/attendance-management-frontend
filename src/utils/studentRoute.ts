import type { EntityId } from '@/types'

interface StudentRouteUser {
  role?: string
  profileId?: EntityId
  userId?: EntityId
  id?: EntityId
}

function toPositiveInteger(value: EntityId | undefined): number | null {
  if (typeof value === 'number')
    return Number.isInteger(value) && value > 0 ? value : null

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
  }

  return null
}

export function resolveStudentProfileId(user: StudentRouteUser): number | null {
  if (user.role !== 'Student')
    return null

  return toPositiveInteger(user.profileId)
}

export function parseStudentRouteParam(value: EntityId | undefined): number | null {
  return toPositiveInteger(value)
}

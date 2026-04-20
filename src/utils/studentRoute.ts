import type { EntityId } from '@/types'

interface StudentRouteUser {
  role?: string
  profileId?: EntityId
  userId?: EntityId
  id?: EntityId
}

export function resolveStudentProfileId(user: StudentRouteUser): number | null {
  if (user.role !== 'Student')
    return null

  const value = user.profileId
  if (typeof value === 'number' && Number.isFinite(value))
    return value

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export function parseStudentRouteParam(value: EntityId | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value))
    return value

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

import type { EntityId } from '@/types'
import type { UserRole } from '@/utils/constants'

export type AuthRole = UserRole | 'Teacher'

export interface AuthenticatedUser {
  id?: EntityId
  userId?: EntityId
  username?: string
  email?: string
}

export interface AuthProfileDetails {
  id?: EntityId
  firstname?: string
  lastname?: string
  sectionId?: EntityId | null
  sectionName?: string
  courseName?: string
  isRegular?: boolean
}

export interface AuthUserProfile {
  userId?: EntityId
  username?: string
  email?: string
  role?: AuthRole
  createdAt?: string
  updatedAt?: string
  studentProfile?: AuthProfileDetails | null
  instructorProfile?: AuthProfileDetails | null
  adminProfile?: AuthProfileDetails | null
}

export interface CheckAuthResponse {
  user?: AuthenticatedUser | string | null
}

export interface AuthActionResponse {
  success: boolean
  message?: string
}

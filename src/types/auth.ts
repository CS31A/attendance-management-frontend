import type { EntityId } from '@/types'
import type { UserRole } from '@/utils/constants'

export type AuthRole = UserRole | 'Teacher'

export interface AuthenticatedUser {
  id?: EntityId
  userId?: EntityId
  username?: string
  email?: string
  [key: string]: unknown
}

export interface AuthProfileDetails {
  id?: EntityId
  firstname?: string
  lastname?: string
  sectionId?: EntityId | null
  sectionName?: string
  courseName?: string
  isRegular?: boolean
  [key: string]: unknown
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
  [key: string]: unknown
}

export interface CheckAuthResponse {
  user?: AuthenticatedUser | null
  [key: string]: unknown
}

export interface AuthActionResponse {
  success: boolean
  message?: string
  [key: string]: unknown
}

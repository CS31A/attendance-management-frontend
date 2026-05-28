import type { EntityId } from '@/types'
import type { UserRole } from '@/utils/constants'

export interface ApiUserProfile {
  id?: EntityId
  firstname?: string
  lastname?: string
  department?: string | null
  sectionId?: EntityId | null
  isRegular?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ApiUser {
  userId?: EntityId
  id?: EntityId
  username?: string
  email?: string
  role?: UserRole | 'Teacher'
  createdAt?: string
  updatedAt?: string
  isDeleted?: boolean
  firstName?: string
  lastName?: string
  profileId?: EntityId
  department?: string | null
  sectionId?: EntityId | null
  isRegular?: boolean
  adminProfile?: ApiUserProfile | null
  instructorProfile?: ApiUserProfile | null
  studentProfile?: ApiUserProfile | null
  deletedAt?: string | null
}

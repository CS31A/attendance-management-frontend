import type { PaginationParams } from '@/types'
import api from '@/api'

export interface QrCodePayload {
  sessionId: number
  expirationMinutes?: number
  maxUsage?: number
  [key: string]: unknown
}

export interface QrCodeScanPayload {
  qrHash: string
  studentId?: number
  deviceInfo?: Record<string, unknown>
}

export interface QrCodeResponseDto {
  id?: number
  qrCodeId?: number
  qrHash?: string
  qrCodeImage?: string
  qrCodeImageUrl?: string
  generatedAt?: string
  expiresAt?: string
  usageCount?: number
  isActive?: boolean
  [key: string]: unknown
}

export type QrCodeValidationResponseDto = Record<string, unknown>
export interface QrCodeScanInfoDto {
  scheduleTitle?: string
  generatedAt?: string
  expiresAt?: string
  [key: string]: unknown
}

export interface QrCodeScanStatisticsDto {
  totalScans?: number
  successfulScans?: number
  failedScans?: number
  uniqueStudents?: number
  [key: string]: unknown
}

export interface QrCodeScanRecordDto {
  id?: number
  studentName?: string
  studentId?: string | number
  scannedAt?: string
  status?: string
  deviceInfo?: string
  [key: string]: unknown
}

export interface QrCodeScanHistoryItemsDto {
  items?: QrCodeScanRecordDto[]
  totalItems?: number
  [key: string]: unknown
}

export interface QrCodeScanHistoryResponseDto {
  qrCodeInfo: QrCodeScanInfoDto | null
  scanStatistics: QrCodeScanStatisticsDto | null
  scans: QrCodeScanHistoryItemsDto | null
}

export type QrCodePaginationParams = PaginationParams & {
  [key: string]: unknown
}

/**
 * QR Code API service for attendance tracking
 *
 * This module provides functions for generating, validating, and managing QR codes
 * for session attendance.
 *
 * @module api/qrCode
 */

// ==================== GENERATION & VALIDATION ====================

/**
 * Generate a new QR code for a session
 *
 * @param {object} payload - Generation parameters
 * @param {number} payload.sessionId - Session ID
 * @param {number} [payload.expirationMinutes] - Expiration time in minutes
 * @param {number} [payload.maxUsage] - Maximum number of scans allowed (optional)
 * @returns {Promise<QrCodeGenerateResponseDto>} Generated QR code response with id, hash, and image
 */
export async function generateQrCode(payload: QrCodePayload): Promise<QrCodeResponseDto> {
  const response = await api.post('/QrCode/generate', payload)

  const data = response.data

  // Convert base64 image to data URL if present
  if (data.qrCodeImage) {
    data.qrCodeImageUrl = `data:image/png;base64,${data.qrCodeImage}`
  }

  return data
}

/**
 * Scan a QR code to record attendance
 *
 * @param {object} payload - Scan data
 * @param {string} payload.qrHash - QR code hash
 * @param {number} [payload.studentId] - Optional legacy student ID; server derives student from auth token
 * @param {object} [payload.deviceInfo] - Optional device information
 * @returns {Promise<QrCodeValidationResponseDto>} Scan result
 */
export async function scanQrCode(payload: QrCodeScanPayload): Promise<QrCodeValidationResponseDto> {
  const response = await api.post('/QrCode/scan', payload)
  return response.data
}

/**
 * Validate a QR code without recording attendance
 *
 * @param {string} qrHash - QR code hash
 * @returns {Promise<QrCodeValidationResponseDto>} Validation result
 */
export async function validateQrCode(qrHash: string): Promise<QrCodeValidationResponseDto> {
  const response = await api.get(`/QrCode/validate/${qrHash}`)
  return response.data
}

// ==================== MANAGEMENT OPERATIONS ====================

/**
 * Get a QR code by ID
 *
 * @param {number} id - QR code ID
 * @returns {Promise<QrCodeResponseDto>} QR code details
 */
export async function getQrCodeById(id: number): Promise<QrCodeResponseDto> {
  const response = await api.get(`/QrCode/${id}`)
  return response.data
}

/**
 * Get QR code image by ID
 *
 * @param {number} id - QR code ID
 * @returns {Promise<string>} QR code image as data URL
 */
export async function getQrCodeImage(id: number): Promise<string | ArrayBuffer | null> {
  const response = await api.get(`/QrCode/${id}/image`, {
    responseType: 'blob',
  })

  // Convert blob to data URL for display
  const blob = response.data
  const dataUrl = await new Promise<string | ArrayBuffer | null>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })

  return dataUrl
}

/**
 * Get a QR code by hash
 *
 * @param {string} qrHash - QR code hash
 * @returns {Promise<QrCodeResponseDto>} QR code details
 */
export async function getQrCodeByHash(qrHash: string): Promise<QrCodeResponseDto> {
  const response = await api.get(`/QrCode/hash/${qrHash}`)
  return response.data
}

/**
 * Revoke a QR code by ID
 *
 * @param {number} id - QR code ID
 * @param {object} [payload] - Revocation details
 * @param {string} [payload.reason] - Reason for revocation
 * @returns {Promise<QrCodeResponseDto>} Updated QR code
 */
export async function revokeQrCodeById(
  id: number,
  payload: Record<string, unknown> = {},
): Promise<QrCodeResponseDto> {
  const response = await api.patch(`/QrCode/${id}/revoke`, payload)
  return response.data
}

/**
 * Revoke a QR code by hash
 *
 * @param {string} qrHash - QR code hash
 * @param {object} [payload] - Revocation details
 * @param {string} [payload.reason] - Reason for revocation
 * @returns {Promise<QrCodeResponseDto>} Updated QR code
 */
export async function revokeQrCodeByHash(
  qrHash: string,
  payload: Record<string, unknown> = {},
): Promise<QrCodeResponseDto> {
  const response = await api.patch(`/QrCode/hash/${qrHash}/revoke`, payload)
  return response.data
}

/**
 * Reactivate a QR code by ID
 *
 * @param {number} id - QR code ID
 * @returns {Promise<QrCodeResponseDto>} Updated QR code
 */
export async function reactivateQrCodeById(id: number): Promise<QrCodeResponseDto> {
  const response = await api.patch(`/QrCode/${id}/reactivate`)
  return response.data
}

/**
 * Reactivate a QR code by hash
 *
 * @param {string} qrHash - QR code hash
 * @returns {Promise<QrCodeResponseDto>} Updated QR code
 */
export async function reactivateQrCodeByHash(qrHash: string): Promise<QrCodeResponseDto> {
  const response = await api.patch(`/QrCode/hash/${qrHash}/reactivate`)
  return response.data
}

// ==================== HISTORY OPERATIONS ====================

/**
 * Get all QR codes for a specific session
 *
 * @param {number} sessionId - Session ID
 * @returns {Promise<Array<QrCodeResponseDto>>} List of QR codes for the session
 */
export async function getSessionQrCodes(sessionId: number): Promise<QrCodeResponseDto[]> {
  const response = await api.get(`/QrCode/session/${sessionId}`)
  return response.data
}

/**
 * Get scan history for a QR code by ID
 *
 * @param {number} id - QR code ID
 * @param {object} [params] - Pagination parameters
 * @param {number} [params.page] - Page number
 * @param {number} [params.limit] - Items per page
 * @returns {Promise<QrCodeScanHistoryResponseDto>} Scan history
 */
export async function getScanHistoryById(
  id: number,
  params: QrCodePaginationParams = {},
): Promise<QrCodeScanHistoryResponseDto> {
  const response = await api.get(`/QrCode/${id}/scan-history`, { params })
  return response.data
}

/**
 * Get scan history for a QR code by hash
 *
 * @param {string} qrHash - QR code hash
 * @param {object} [params] - Pagination parameters
 * @param {number} [params.page] - Page number
 * @param {number} [params.limit] - Items per page
 * @returns {Promise<QrCodeScanHistoryResponseDto>} Scan history
 */
export async function getScanHistoryByHash(
  qrHash: string,
  params: QrCodePaginationParams = {},
): Promise<QrCodeScanHistoryResponseDto> {
  const response = await api.get(`/QrCode/hash/${qrHash}/scan-history`, { params })
  return response.data
}

export default {
  generateQrCode,
  scanQrCode,
  validateQrCode,
  getQrCodeById,
  getQrCodeImage,
  getQrCodeByHash,
  revokeQrCodeById,
  revokeQrCodeByHash,
  reactivateQrCodeById,
  reactivateQrCodeByHash,
  getSessionQrCodes,
  getScanHistoryById,
  getScanHistoryByHash,
}

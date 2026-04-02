import { describe, expect, test } from 'bun:test'

import { getErrorMessage, getErrorStatus, getValidationErrorMessages } from '@/utils/httpError'

describe('httpError helpers', () => {
  test('reads status and message from response-like mock errors', () => {
    const error = new Error('Unauthorized') as Error & {
      response?: { status: number }
    }
    error.response = { status: 401 }

    expect(getErrorStatus(error)).toBe(401)
    expect(getErrorMessage(error, 'fallback')).toBe('Unauthorized')
  })

  test('prefers backend response message when available', () => {
    const error = {
      message: 'Request failed with status code 400',
      response: {
        status: 400,
        data: {
          message: 'Email already exists',
        },
      },
    }

    expect(getErrorMessage(error, 'fallback')).toBe('Email already exists')
  })

  test('prefers friendly fallback over generic axios response errors', () => {
    const error = {
      isAxiosError: true,
      message: 'Request failed with status code 500',
      response: {
        status: 500,
        data: {},
      },
    }

    expect(getErrorMessage(error, 'Failed to save classroom')).toBe('Failed to save classroom')
  })

  test('normalizes validation messages from response-like payloads', () => {
    const error = {
      response: {
        status: 400,
        data: {
          errors: {
            email: ['Email is required'],
            role: 'Role is invalid',
            notes: ['', 'Notes are too long'],
          },
        },
      },
    }

    expect(getValidationErrorMessages(error)).toEqual([
      'Email is required',
      'Role is invalid',
      'Notes are too long',
    ])
  })
})

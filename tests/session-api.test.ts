import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/api'
import {
  deleteSession,
  endSession,
  startSession,
  updateSessionRoom,
} from '@/api/sessions'

vi.mock('@/api', () => ({
  default: {
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('session api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.patch).mockResolvedValue({ data: { id: '1', status: 'active', rowVersion: 'next-token' } } as never)
    vi.mocked(api.delete).mockResolvedValue({ data: { id: '1', status: 'cancelled', rowVersion: 'next-token' } } as never)
  })

  it('startSession sends rowVersion in the request body', async () => {
    await startSession('1', { actualRoomId: '2', rowVersion: 'token-1' })

    expect(api.patch).toHaveBeenCalledWith('/sessions/1/start', {
      actualRoomId: '2',
      rowVersion: 'token-1',
    })
  })

  it('endSession sends rowVersion in the request body', async () => {
    await endSession('1', { description: 'done', rowVersion: 'token-2' })

    expect(api.patch).toHaveBeenCalledWith('/sessions/1/end', {
      description: 'done',
      rowVersion: 'token-2',
    })
  })

  it('updateSessionRoom sends rowVersion in the request body', async () => {
    await updateSessionRoom('1', { actualRoomId: '5', rowVersion: 'token-3' })

    expect(api.patch).toHaveBeenCalledWith('/sessions/1/room', {
      actualRoomId: '5',
      rowVersion: 'token-3',
    })
  })

  it('deleteSession sends reason and rowVersion in the request body', async () => {
    await deleteSession('1', { reason: 'Room unavailable', rowVersion: 'token-4' })

    expect(api.delete).toHaveBeenCalledWith('/sessions/1', {
      data: {
        reason: 'Room unavailable',
        rowVersion: 'token-4',
      },
    })
  })
})

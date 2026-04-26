import { describe, expect, it } from 'vitest'
import { getPublicEntityId, normalizePublicEntityId } from '@/utils/entityIdNormalization'

describe('entity ID normalization', () => {
  it('prefers uuid over numeric raw entity id', () => {
    expect(getPublicEntityId({ id: 2004, uuid: 'subject-uuid' })).toBe('subject-uuid')
  })

  it('falls back to string id for DTOs that already expose UUID as id', () => {
    expect(getPublicEntityId({ id: 'section-uuid' })).toBe('section-uuid')
  })

  it('normalizes raw entity arrays so public id is the UUID', () => {
    expect(normalizePublicEntityId([{ id: 43, uuid: 'classroom-uuid', name: 'Lab 1' }])).toEqual([
      { id: 'classroom-uuid', uuid: 'classroom-uuid', numericId: 43, name: 'Lab 1' },
    ])
  })

  it('returns empty string and preserves numericId if only a numeric ID exists (enforcing UUID usage)', () => {
    const output = normalizePublicEntityId([{ id: 99 }])
    expect(output).toEqual([{ id: '', numericId: 99 }])
  })
})

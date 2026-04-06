import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('modal keyboard behavior', () => {
  it('deleteModal only uses Escape for modal-wide keyboard handling', () => {
    const source = readFileSync('src/components/common/DeleteModal.vue', 'utf8')
    expect(source.includes('event.key === \'Escape\'')).toBe(true)
    expect(source.includes('event.key === \'Enter\'')).toBe(false)
  })

  it('deleteModal still exposes explicit delete confirmation control', () => {
    const source = readFileSync('src/components/common/DeleteModal.vue', 'utf8')
    expect(source.includes('class="btn-delete"')).toBe(true)
    expect(source.includes('@click="handleConfirm"')).toBe(true)
  })
})

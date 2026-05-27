import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('mapUserProfile location', () => {
  describe('should be exported from API layer', () => {
    it('should export mapUserProfile from admin API', async () => {
      const adminApi = await import('@/api/admin')
      expect(adminApi).toHaveProperty('mapUserProfile')
      expect(typeof adminApi.mapUserProfile).toBe('function')
    })
  })

  describe('should NOT be defined in userStore', () => {
    it('should not define mapUserProfile in userStore.ts', () => {
      const storePath = resolve(__dirname, '../src/stores/userStore.ts')
      const storeContent = readFileSync(storePath, 'utf-8')

      // Should not have function definition
      expect(storeContent).not.toMatch(/function\s+mapUserProfile/)
      // Should not have const/let/var definition
      expect(storeContent).not.toMatch(/(?:const|let|var)\s+mapUserProfile\s*=/)
      // Should not have export
      expect(storeContent).not.toMatch(/export\s+(?:function|const|let|var)\s+mapUserProfile/)
    })
  })
})

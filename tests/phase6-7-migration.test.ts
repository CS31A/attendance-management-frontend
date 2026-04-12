import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('phase 6 and 7 migration targets', () => {
  it('utility modules are migrated to TypeScript', () => {
    const utilsModules = [
      'src/utils/auth.ts',
      'src/utils/constants.ts',
      'src/utils/qrcode.ts',
      'src/utils/toast.ts',
    ]

    utilsModules.forEach((modulePath) => {
      expect(existsSync(modulePath)).toBe(true)
    })
  })

  it('pinia stores are migrated to TypeScript', () => {
    const stores = [
      'src/stores/attendanceStore.ts',
      'src/stores/authStore.ts',
      'src/stores/classroomStore.ts',
      'src/stores/courseStore.ts',
      'src/stores/enrollmentStore.ts',
      'src/stores/qrCodeStore.ts',
      'src/stores/scheduleStore.ts',
      'src/stores/sectionStore.ts',
      'src/stores/sessionStore.ts',
      'src/stores/subjectStore.ts',
      'src/stores/userStore.ts',
    ]

    stores.forEach((storePath) => {
      expect(existsSync(storePath)).toBe(true)
    })
  })
})

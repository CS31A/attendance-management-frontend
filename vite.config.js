import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - split large libraries
          'vendor-vue': ['vue', 'vue-router'],
          'vendor-charts': ['chart.js', 'vue-chartjs'],
          'vendor-icons': ['lucide-vue-next'],

          // Store chunks - group by feature
          'stores': [
            './src/stores/authStore.ts',
            './src/stores/userStore.ts',
            './src/stores/courseStore.ts',
            './src/stores/sectionStore.ts',
            './src/stores/sessionStore.ts',

          ],

          // Component chunks - modals
          'modals': [
            './src/components/CreateUserModal.vue',
            './src/components/EditUserModal.vue',
            './src/components/SectionModal.vue',
          ],

          // Component chunks - session components
          'session-components': [
            './src/components/sessions/CreateSessionModal.vue',
            './src/components/sessions/EndSessionModal.vue',
            './src/components/sessions/StartSessionModal.vue',
            './src/components/sessions/UpdateRoomModal.vue',
            './src/components/sessions/SessionCard.vue',
            './src/components/sessions/SessionTable.vue',
            './src/components/sessions/SessionStatusBadge.vue',
          ],

          // Component chunks - tables
          'table-components': [
            './src/components/tables/CourseTable.vue',
            './src/components/tables/CourseTableSection.vue',
            './src/components/tables/SectionTable.vue',
            './src/components/tables/SectionTableSection.vue',
            './src/components/tables/UserTable.vue',
            './src/components/tables/UserTableSection.vue',
          ],
        },
      },
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
})

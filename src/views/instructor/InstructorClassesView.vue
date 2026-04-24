<script setup lang="ts">
import { AlertTriangle, BookOpen, ChevronRight, RefreshCw, Users } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Toast from '@/components/common/Toast.vue'
import { useToast } from '@/composables/useToast'
import { useInstructorStore } from '@/stores/instructorStore'
import type { EntityId } from '@/types'
import { getErrorMessage } from '@/utils/httpError'

const SkeletonLoader = defineAsyncComponent(() => import('@/components/common/SkeletonLoader.vue'))

const router = useRouter()
const instructorStore = useInstructorStore()

const errorMessage = ref('')

const sectionsOverview = computed(() => instructorStore.sectionsOverviewList)
const loading = computed(() => instructorStore.loading)
const instructorInfo = computed(() => instructorStore.instructorInfo)
const totalUniqueStudents = computed(() => instructorStore.totalUniqueStudents)

const { toast, showToast, closeToast } = useToast()

function navigateToSection(sectionId: EntityId) {
  router.push(`/instructor/classes/sections/${sectionId}`)
}

async function loadSections() {
  errorMessage.value = ''
  try {
    await instructorStore.fetchSectionsOverview()
  }
  catch (error) {
    console.error('Failed to load sections overview:', error)
    const message = getErrorMessage(error, 'Failed to load your classes. Please try again.')
    showToast(message, 'error')
    errorMessage.value = message
  }
}

onMounted(() => {
  loadSections()
})
</script>

<template>
  <div class="instructor-classes-view">
    <div class="classes-header">
      <div class="header-content">
        <h1 class="page-title">
          My Classes
        </h1>
        <p v-if="instructorInfo" class="page-subtitle">
          Welcome, {{ instructorInfo.fullName }}
        </p>
        <p v-else class="page-subtitle">
          View your assigned sections and enrolled students
        </p>
      </div>
    </div>

    <div v-if="loading && !sectionsOverview.length" class="loading-skeleton">
      <SkeletonLoader type="rectangle" :height="60" style="margin-bottom: 1rem; width: 100%;" />
      <SkeletonLoader v-for="i in 3" :key="i" type="rectangle" :height="120" style="margin-bottom: 1rem; width: 100%;" />
    </div>

    <div v-else-if="errorMessage" class="error-state">
      <AlertTriangle :size="48" class="error-icon" />
      <h3>Failed to Load Classes</h3>
      <p>{{ errorMessage }}</p>
      <button class="btn-retry" @click="loadSections">
        <RefreshCw :size="18" />
        <span>Retry</span>
      </button>
    </div>

    <div v-else-if="!sectionsOverview.length && !loading" class="empty-state">
      <BookOpen :size="64" class="empty-icon" />
      <h3>No Sections Assigned</h3>
      <p>You currently have no assigned sections. Please contact your administrator if you believe this is an error.</p>
    </div>

    <div v-else class="sections-content">
      <div class="sections-summary">
        <div class="summary-card">
          <BookOpen :size="24" class="summary-icon" />
          <div class="summary-info">
            <span class="summary-label">Total Sections</span>
            <span class="summary-value">{{ sectionsOverview.length }}</span>
          </div>
        </div>
        <div class="summary-card">
          <Users :size="24" class="summary-icon" />
          <div class="summary-info">
            <span class="summary-label">Total Unique Students</span>
            <span class="summary-value">{{ totalUniqueStudents }}</span>
          </div>
        </div>
      </div>

      <div class="sections-grid">
        <div
          v-for="section in sectionsOverview"
          :key="section.sectionId"
          class="section-card"
          @click="navigateToSection(section.sectionId)"
        >
          <div class="section-card-content">
            <div class="section-card-info">
              <h2 class="section-name">
                {{ section.sectionName }}
              </h2>
              <p class="course-name">
                {{ section.courseName }}
              </p>
            </div>
            <div class="section-card-stats">
              <div class="stat-item">
                <BookOpen :size="16" class="stat-icon" />
                <span>{{ section.handledClassCount }} Class{{ section.handledClassCount !== 1 ? 'es' : '' }}</span>
              </div>
              <div class="stat-item">
                <Users :size="16" class="stat-icon" />
                <span>{{ section.uniqueStudentCount }} Student{{ section.uniqueStudentCount !== 1 ? 's' : '' }}</span>
              </div>
            </div>
          </div>
          <div class="section-card-cta">
            <span class="cta-text">View Section</span>
            <ChevronRight :size="18" class="cta-icon" />
          </div>
        </div>
      </div>
    </div>

    <Toast
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      :duration="toast.duration"
      @close="closeToast"
    />
  </div>
</template>

<style scoped>
.instructor-classes-view {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.classes-header {
  margin-bottom: 1.5rem;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  margin: 0;
}

.loading-skeleton {
  padding: 1rem 0;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.error-icon {
  color: var(--color-error);
  margin-bottom: 1rem;
}

.error-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 0.5rem 0;
}

.error-state p {
  font-size: 1rem;
  color: var(--color-gray-500);
  margin: 0 0 1.5rem 0;
  max-width: 500px;
}

.btn-retry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-secondary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-retry:hover {
  background: var(--color-secondary-light);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  color: var(--color-gray-400);
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  font-size: 1rem;
  color: var(--color-gray-500);
  margin: 0;
  max-width: 500px;
}

.sections-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sections-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.summary-icon {
  color: var(--color-secondary);
  flex-shrink: 0;
}

.summary-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  font-weight: 500;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
}

.sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.section-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s;
  overflow: hidden;
}

.section-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.section-card-content {
  padding: 1.25rem;
}

.section-card-info {
  margin-bottom: 0.75rem;
}

.section-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0 0 0.25rem 0;
}

.course-name {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  margin: 0;
}

.section-card-stats {
  display: flex;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.813rem;
  color: var(--color-gray-600);
  font-weight: 500;
}

.stat-icon {
  color: var(--color-gray-400);
}

.section-card-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.75rem;
  background: var(--color-gray-50);
  border-top: 1px solid var(--color-gray-200);
  color: var(--color-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 0.2s;
}

.section-card:hover .section-card-cta {
  background: var(--color-secondary);
  color: white;
}

.cta-icon {
  transition: transform 0.2s;
}

.section-card:hover .cta-icon {
  transform: translateX(2px);
}

@media (max-width: 768px) {
  .instructor-classes-view {
    padding: 0.75rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .sections-summary {
    grid-template-columns: 1fr;
  }

  .sections-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .instructor-classes-view {
    padding: 0.5rem;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .page-subtitle {
    font-size: 0.75rem;
  }

  .summary-card {
    padding: 1rem;
  }

  .summary-value {
    font-size: 1.25rem;
  }

  .section-name {
    font-size: 1rem;
  }
}
</style>

<script setup>
import { ref, defineAsyncComponent, onMounted } from 'vue'
import { useSectionStore } from '@/stores/sectionStore.js'
const SectionTableSection = defineAsyncComponent(() => import('@/components/tables/SectionTableSection.vue'))

const sectionsStore = useSectionStore()
const sections = sectionsStore.getSections
const showAddSectionModal = ref(false)
const showEditSectionModal = ref(false)
const loading = ref(false)

onMounted(async() => {
  loading.value = true
  try {
    await sectionsStore.fetchSections()
  } catch(error) {
    console.log(error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="section-management">
    <!-- Loading overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    </div>
    
    <!-- Error message -->
    <div v-if="error" class="error-message">
      <div class="error-content">
        <AlertTriangle class="error-icon" size="24" />
        <p>{{ error }}</p>
        <button @click="sectionsStore.fetchSections" class="retry-btn">Retry</button>
      </div>
    </div>

    <div class="container" v-else-if="sectionsStore.getNumberOfSections || !sectionsStore.error">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">Section Management</h1>
            <p class="page-subtitle">Manage Sections</p>
          </div>
          <button @click="" class="btn-add">
            <Plus class="icon" size="20" />
            <span>Add Section</span>
          </button>
        </div>
      </div>

      <SectionTableSection v-if="sectionsStore.getFilteredSections.length > 0"
        :sections="sections" title="All Sections" :pagination="{
          currentPage, totalPages, hasNextPage, hasPreviousPage, totalSections, itemsPerPage: sectionsStore.getItemsPerPage
        }"
      />
    </div>
  </div>
</template>

<style scoped>
/* Main Container */
.section-management {
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem;
  position: relative;
  overflow-x: hidden;
}

.section-management::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  pointer-events: none;
}
.container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}
/* Header */
.page-header {
  margin-bottom: 2rem;
  animation: slideInDown 0.6s ease-out;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.header-text {
  flex: 1;
  min-width: 250px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1e3a8a;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 0;
  font-weight: 300;
}

</style>

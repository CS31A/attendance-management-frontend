<script setup>
import { defineAsyncComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const ConfirmationModal = defineAsyncComponent(() => import('@/components/common/ConfirmationModal.vue'))

const authStore = useAuthStore()
const router = useRouter()
const isLoading = ref(false)
const showConfirmation = ref(false)

function initiateLogout() {
  showConfirmation.value = true
}

async function handleLogout() {
  showConfirmation.value = false
  isLoading.value = true
  try {
    await authStore.logout()
    router.push('/login')
  }
  catch (error) {
    console.error('Logout error:', error)
    router.push('/login')
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <button class="logout-button" :disabled="isLoading" @click="initiateLogout">
    <span v-if="isLoading">Logging out...</span>
    <span v-else>Logout</span>
  </button>

  <ConfirmationModal
    :show="showConfirmation"
    title="Confirm Logout"
    message="Are you sure you want to logout?"
    confirm-text="Logout"
    cancel-text="Cancel"
    @confirm="handleLogout"
    @cancel="showConfirmation = false"
  />
</template>

<style scoped>
.logout-button {
  padding: 8px 16px;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.logout-button:hover:not(:disabled) {
  background-color: #dc2626;
}

.logout-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>

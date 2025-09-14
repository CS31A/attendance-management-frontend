<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const isLoading = ref(false)

const handleLogout = async () => {
  isLoading.value = true
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
    router.push('/login')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <button @click="handleLogout" class="logout-button" :disabled="isLoading">
    <span v-if="isLoading">Logging out...</span>
    <span v-else>Logout</span>
  </button>
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
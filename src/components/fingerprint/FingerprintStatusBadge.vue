<script setup lang="ts">
import type { EntityId } from '@/types'
import { Fingerprint } from 'lucide-vue-next'

defineProps<{
  hasFingerprint: boolean
  studentId: EntityId
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    class="fingerprint-status-btn"
    :class="{ enrolled: hasFingerprint }"
    @click.stop="emit('click')"
  >
    <Fingerprint
      :size="20"
      :class="hasFingerprint ? 'text-green-500' : 'text-gray-400'"
    />
  </button>
</template>

<style scoped>
.fingerprint-status-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.fingerprint-status-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: scale(1.1);
}

.fingerprint-status-btn.enrolled:hover {
  background: rgba(34, 197, 94, 0.1);
}
</style>

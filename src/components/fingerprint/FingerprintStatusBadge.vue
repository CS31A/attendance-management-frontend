<script setup lang="ts">
import { Fingerprint } from 'lucide-vue-next'

defineProps<{
  hasFingerprint: boolean
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
    :aria-label="hasFingerprint ? 'Fingerprint enrolled' : 'Enroll fingerprint'"
    @click.stop="emit('click')"
  >
    <Fingerprint
      :size="20"
      :class="hasFingerprint ? 'enrolled' : 'not-enrolled'"
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

.enrolled {
  color: var(--color-success);
}

.not-enrolled {
  color: var(--color-gray-400);
}
</style>

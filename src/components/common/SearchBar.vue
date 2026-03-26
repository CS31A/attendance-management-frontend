<script setup lang="ts">
import { Search } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
}>(), {
  modelValue: '',
  placeholder: 'Search...',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  emit('update:modelValue', target?.value ?? '')
}
</script>

<template>
  <div class="search-box">
    <Search class="search-icon" :size="18" />
    <input
      :value="props.modelValue"
      type="text"
      :placeholder="props.placeholder"
      class="search-input"
      @input="handleInput"
    >
  </div>
</template>

<style scoped>
.search-box {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.125rem;
  height: 1.125rem;
  color: var(--color-gray-400);
  pointer-events: none;
  transition: color 0.2s ease;
}

.search-input {
  width: 100%;
  padding: 0.625rem 0.875rem 0.625rem 2.75rem;
  border: 2px solid var(--color-gray-200);
  border-radius: 12px;
  font-size: 0.875rem;
  background: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 8px 25px rgba(30, 58, 138, 0.2);
  transform: translateY(-2px);
}

.search-input:focus + .search-icon {
  color: var(--color-primary);
}
</style>

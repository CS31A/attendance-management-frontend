<script setup>
import { Search } from 'lucide-vue-next'

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Search...',
  },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="search-box">
    <Search class="search-icon" size="20" />
    <input
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      class="search-input"
      @input="$emit('update:modelValue', $event.target.value)"
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
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-gray-400);
  pointer-events: none;
  transition: color 0.2s ease;
}

.search-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 2px solid var(--color-gray-200);
  border-radius: 16px;
  font-size: 1rem;
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

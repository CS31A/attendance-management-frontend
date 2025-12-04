<script setup>
import { ChevronDown } from 'lucide-vue-next'
import { onMounted, onUnmounted, ref } from 'vue'

defineProps({
  options: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    default: 'Select an option',
  },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const dropdownRef = ref(null)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function selectOption(option) {
  emit('update:modelValue', option)
  isOpen.value = false
}

function closeDropdown(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<template>
  <div ref="dropdownRef" class="custom-dropdown">
    <div
      class="dropdown-trigger"
      :class="{ 'is-open': isOpen }"
      @click="toggleDropdown"
    >
      <span class="selected-value">{{ modelValue || placeholder }}</span>
      <ChevronDown class="chevron-icon" :class="{ 'is-rotated': isOpen }" size="16" />
    </div>

    <transition name="dropdown-fade">
      <div v-if="isOpen" class="dropdown-menu">
        <div
          v-for="option in options"
          :key="option"
          class="dropdown-item"
          :class="{ 'is-selected': option === modelValue }"
          @click="selectOption(option)"
        >
          {{ option }}
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.custom-dropdown {
  position: relative;
  width: 100%;
  min-width: 180px;
}

.dropdown-trigger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.625rem 1rem;
  background: white;
  border: 2px solid var(--color-gray-200);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
}

.dropdown-trigger:hover {
  border-color: var(--color-gray-300);
}

.dropdown-trigger.is-open {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.selected-value {
  margin-right: 0.5rem;
}

.chevron-icon {
  transition: transform 0.3s ease;
  color: var(--color-gray-400);
}

.chevron-icon.is-rotated {
  transform: rotate(180deg);
  color: var(--color-primary);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--color-primary);
  overflow: hidden;
  z-index: 50;
  padding: 0.25rem;
}

.dropdown-item {
  padding: 0.625rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--color-gray-700);
  font-weight: 500;
}

.dropdown-item:hover {
  background-color: var(--color-gray-50);
  color: var(--color-primary);
}

.dropdown-item.is-selected {
  background-color: var(--color-primary);
  color: white;
}

.dropdown-item.is-selected:hover {
  background-color: var(--color-primary-light);
}

/* Transition */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

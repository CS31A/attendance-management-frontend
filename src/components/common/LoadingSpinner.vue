<script setup>
import { Loader2 } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'inline',
    validator: value => ['overlay', 'inline', 'spinner-only'].includes(value),
  },
  message: {
    type: String,
    default: 'Loading...',
  },
  size: {
    type: String,
    default: 'medium',
    validator: value => ['small', 'medium', 'large'].includes(value),
  },
  fullScreen: {
    type: Boolean,
    default: false,
  },
  blur: {
    type: Boolean,
    default: true,
  },
})

const spinnerSize = computed(() => {
  const sizes = {
    small: 20,
    medium: 40,
    large: 60,
  }
  return sizes[props.size]
})
</script>

<template>
  <!-- Overlay type -->
  <div
    v-if="type === 'overlay'"
    class="loading-overlay"
    :class="{ 'full-screen': fullScreen, 'with-blur': blur }"
    role="status"
    aria-label="Loading"
  >
    <div class="loading-content">
      <Loader2 :size="spinnerSize" class="spinner" />
      <p class="loading-message">
        {{ message }}
      </p>
    </div>
  </div>

  <!-- Inline type -->
  <div
    v-else-if="type === 'inline'"
    class="loading-inline"
    role="status"
    aria-label="Loading"
  >
    <Loader2 :size="spinnerSize" class="spinner" />
    <p class="loading-message">
      {{ message }}
    </p>
  </div>

  <!-- Spinner-only type -->
  <Loader2
    v-else
    :size="spinnerSize"
    class="spinner"
    role="status"
    aria-label="Loading"
  />
</template>

<style scoped>
/* Overlay type */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  animation: fadeIn 0.2s ease-in;
}

.loading-overlay.full-screen {
  position: fixed;
}

.loading-overlay.with-blur {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* Inline type */
.loading-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--color-gray-500);
}

/* Spinner animation */
.spinner {
  color: var(--color-primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Loading message */
.loading-message {
  margin: 0;
  color: var(--color-gray-500);
  font-size: 1rem;
  font-weight: 500;
}

.loading-inline .loading-message {
  margin-top: 0;
}
</style>

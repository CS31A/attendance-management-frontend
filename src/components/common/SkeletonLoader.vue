<script setup lang="ts">
import { computed } from 'vue'

type SkeletonType = 'text' | 'circle' | 'rectangle'
type SizeValue = string | number

const props = withDefaults(defineProps<{
  type?: SkeletonType
  width?: SizeValue
  height?: SizeValue
  borderRadius?: string
}>(), {
  type: 'text',
})

const style = computed(() => {
  const styles: Record<string, string> = {}

  if (props.width) {
    styles.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }

  if (props.height) {
    styles.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }

  if (props.borderRadius) {
    styles.borderRadius = props.borderRadius
  }

  return styles
})
</script>

<template>
  <div
    class="skeleton-loader"
    :class="[`type-${type}`]"
    :style="style"
    aria-hidden="true"
  />
</template>

<style scoped>
.skeleton-loader {
  background-color: var(--color-gray-200);
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-sm);
}

/* Types */
.type-text {
  width: 100%;
  height: 1rem;
  margin-bottom: 0.5rem;
  border-radius: var(--radius-sm);
}

.type-text:last-child {
  margin-bottom: 0;
}

.type-circle {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.type-rectangle {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-md);
}

/* Shimmer Animation */
.skeleton-loader::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0.4) 20%,
    rgba(255, 255, 255, 0.7) 60%,
    rgba(255, 255, 255, 0)
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>

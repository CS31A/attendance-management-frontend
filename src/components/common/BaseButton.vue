<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: value => ['primary', 'secondary', 'error', 'success', 'ghost'].includes(value),
  },
  size: {
    type: String,
    default: 'medium',
    validator: value => ['small', 'medium', 'large'].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  fullWidth: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: Object,
    default: null,
  },
  iconPosition: {
    type: String,
    default: 'left',
    validator: value => ['left', 'right'].includes(value),
  },
})

const emit = defineEmits(['click'])

const buttonClasses = computed(() => {
  return [
    'base-button',
    `base-button--${props.variant}`,
    `base-button--${props.size}`,
    {
      'base-button--disabled': props.disabled || props.loading,
      'base-button--loading': props.loading,
      'base-button--full-width': props.fullWidth,
      'base-button--icon-right': props.iconPosition === 'right',
    },
  ]
})

function handleClick(event) {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <component
      :is="icon"
      v-if="icon && iconPosition === 'left'"
      class="base-button__icon"
      :size="size === 'small' ? 16 : size === 'large' ? 24 : 20"
    />
    <span v-if="$slots.default" class="base-button__text">
      <slot />
    </span>
    <component
      :is="icon"
      v-if="icon && iconPosition === 'right'"
      class="base-button__icon"
      :size="size === 'small' ? 16 : size === 'large' ? 24 : 20"
    />
    <span v-if="loading" class="base-button__spinner" />
  </button>
</template>

<style scoped>
/* Base Button Styles */
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  white-space: nowrap;
  font-family: inherit;
}

.base-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Size Variants */
.base-button--small {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  border-radius: 8px;
}

.base-button--medium {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 10px;
}

.base-button--large {
  padding: 0.625rem 1.25rem;
  font-size: 1rem;
  border-radius: 12px;
}

/* Primary Variant */
.base-button--primary {
  background: var(--color-primary);
  color: white;
  box-shadow: 0 8px 25px rgba(30, 58, 138, 0.3);
}

.base-button--primary:hover:not(.base-button--disabled) {
  background: var(--color-primary-light);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 15px 35px rgba(30, 58, 138, 0.4);
}

.base-button--primary:active:not(.base-button--disabled) {
  transform: translateY(-1px) scale(1.01);
}

/* Secondary Variant */
.base-button--secondary {
  background: var(--color-slate-100);
  color: var(--color-slate-700);
  border: 2px solid var(--color-slate-200);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.base-button--secondary:hover:not(.base-button--disabled) {
  background: var(--color-slate-200);
  border-color: var(--color-slate-300);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.base-button--secondary:active:not(.base-button--disabled) {
  transform: translateY(-1px);
}

/* Error Variant */
.base-button--error {
  background: var(--color-error);
  color: white;
  box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);
}

.base-button--error:hover:not(.base-button--disabled) {
  background: var(--color-error-dark);
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(239, 68, 68, 0.4);
}

.base-button--error:active:not(.base-button--disabled) {
  transform: translateY(-1px);
}

/* Success Variant */
.base-button--success {
  background: var(--color-success);
  color: white;
  box-shadow: 0 4px 6px rgba(34, 197, 94, 0.3);
}

.base-button--success:hover:not(.base-button--disabled) {
  background: var(--color-success-dark);
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(34, 197, 94, 0.4);
}

.base-button--success:active:not(.base-button--disabled) {
  transform: translateY(-1px);
}

/* Ghost Variant */
.base-button--ghost {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid transparent;
}

.base-button--ghost:hover:not(.base-button--disabled) {
  background: rgba(30, 58, 138, 0.05);
  border-color: var(--color-primary-light);
}

.base-button--ghost:active:not(.base-button--disabled) {
  background: rgba(30, 58, 138, 0.1);
}

/* Disabled State */
.base-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Loading State */
.base-button--loading {
  cursor: wait;
}

.base-button--loading .base-button__text {
  opacity: 0.6;
}

/* Full Width */
.base-button--full-width {
  width: 100%;
}

/* Icon Right */
.base-button--icon-right {
  flex-direction: row-reverse;
}

/* Icon Styles */
.base-button__icon {
  flex-shrink: 0;
}

/* Spinner */
.base-button__spinner {
  position: absolute;
  right: 1rem;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .base-button--medium {
    padding: 0.625rem 1.25rem;
    font-size: 0.9rem;
  }

  .base-button--large {
    padding: 0.875rem 1.75rem;
    font-size: 1rem;
  }
}

@media (max-width: 640px) {
  .base-button--small {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  .base-button--medium {
    padding: 0.625rem 1.25rem;
    font-size: 0.85rem;
  }

  .base-button--large {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .base-button--small {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }

  .base-button--medium {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }

  .base-button--large {
    padding: 0.625rem 1.25rem;
    font-size: 0.85rem;
  }
}
</style>

<script setup>
import { X } from 'lucide-vue-next'
import { onUnmounted, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
    validator: value => ['sm', 'md', 'lg', 'xl'].includes(value),
  },
  showClose: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['close'])

function handleClose() {
  emit('close')
}

// Close modal on Escape key
function handleKeydown(event) {
  if (event.key === 'Escape' && props.show) {
    handleClose()
  }
}

// Lock body scroll when modal is open
watch(() => props.show, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeydown)
  }
  else {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="app-modal-overlay"
      @click="handleClose"
    >
      <div
        class="app-modal-content"
        :class="`app-modal-${size}`"
        @click.stop
      >
        <!-- Header -->
        <div v-if="title || $slots.header" class="app-modal-header">
          <slot name="header">
            <h3>{{ title }}</h3>
          </slot>
          <button v-if="showClose" class="app-btn-close" @click="handleClose">
            <X size="24" />
          </button>
        </div>

        <!-- Body -->
        <div class="app-modal-body">
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="app-modal-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

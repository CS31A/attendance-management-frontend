/**
 * Simple toast notification utility
 * Provides user feedback for success, error, warning, and info messages
 * @module utils/toast
 */

/**
 * Toast notification configuration
 */
const TOAST_DURATION = 4000 // 4 seconds
const TOAST_CONTAINER_ID = 'toast-container'

/**
 * Toast types with corresponding styles
 */
const TOAST_TYPES = {
  success: {
    icon: '✓',
    bgColor: '#10b981',
    textColor: '#ffffff',
  },
  error: {
    icon: '✕',
    bgColor: '#ef4444',
    textColor: '#ffffff',
  },
  warning: {
    icon: '⚠',
    bgColor: '#f59e0b',
    textColor: '#ffffff',
  },
  info: {
    icon: 'ℹ',
    bgColor: '#3b82f6',
    textColor: '#ffffff',
  },
}

/**
 * Ensure toast container exists in DOM
 * @returns {HTMLElement} Toast container element
 */
function getOrCreateToastContainer() {
  let container = document.getElementById(TOAST_CONTAINER_ID)

  if (!container) {
    container = document.createElement('div')
    container.id = TOAST_CONTAINER_ID
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `
    document.body.appendChild(container)
  }

  return container
}

/**
 * Create and display a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type ('success' | 'error' | 'warning' | 'info')
 * @param {number} duration - Duration in milliseconds (default: 4000)
 */
function showToast(message, type = 'info', duration = TOAST_DURATION) {
  const container = getOrCreateToastContainer()
  const config = TOAST_TYPES[type] || TOAST_TYPES.info

  // Create toast element
  const toast = document.createElement('div')
  toast.style.cssText = `
    background-color: ${config.bgColor};
    color: ${config.textColor};
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 250px;
    max-width: 400px;
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
    font-size: 14px;
    font-weight: 500;
  `

  // Add icon
  const icon = document.createElement('span')
  icon.textContent = config.icon
  icon.style.cssText = `
    font-size: 18px;
    font-weight: bold;
    flex-shrink: 0;
  `

  // Add message
  const messageEl = document.createElement('span')
  messageEl.textContent = message
  messageEl.style.cssText = `
    flex: 1;
    word-wrap: break-word;
  `

  toast.appendChild(icon)
  toast.appendChild(messageEl)

  // Add animation keyframes if not already present
  if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style')
    style.id = 'toast-animations'
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)
  }

  // Add to container
  container.appendChild(toast)

  // Auto remove after duration
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in'
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 300)
  }, duration)

  // Click to dismiss
  toast.style.cursor = 'pointer'
  toast.addEventListener('click', () => {
    toast.style.animation = 'slideOut 0.3s ease-in'
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 300)
  })
}

/**
 * Show success toast
 * @param {string} message - Success message
 * @param {number} duration - Duration in milliseconds
 */
export function showSuccess(message, duration) {
  showToast(message, 'success', duration)
}

/**
 * Show error toast
 * @param {string} message - Error message
 * @param {number} duration - Duration in milliseconds
 */
export function showError(message, duration) {
  showToast(message, 'error', duration)
}

/**
 * Show warning toast
 * @param {string} message - Warning message
 * @param {number} duration - Duration in milliseconds
 */
export function showWarning(message, duration) {
  showToast(message, 'warning', duration)
}

/**
 * Show info toast
 * @param {string} message - Info message
 * @param {number} duration - Duration in milliseconds
 */
export function showInfo(message, duration) {
  showToast(message, 'info', duration)
}

export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
}

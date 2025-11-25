<script setup>
import { ArrowLeft, Calendar, ClipboardCheck, FileText, Home, LayoutDashboard } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'

const router = useRouter()

function goHome() {
  router.push('/dashboard')
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <!-- 404 Error Code -->
      <div class="error-code">
        <span class="digit">4</span>
        <span class="digit zero">0</span>
        <span class="digit">4</span>
      </div>

      <!-- Error Message -->
      <div class="error-message">
        <h1 class="error-title">
          Page Not Found
        </h1>
        <p class="error-description">
          Oops! The page you're looking for seems to have wandered off.
          It might have been moved, deleted, or never existed in the first place.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <BaseButton
          variant="primary"
          size="large"
          @click="goHome"
        >
          <template #icon>
            <Home :size="20" />
          </template>
          Go to Dashboard
        </BaseButton>
        <BaseButton
          variant="secondary"
          size="large"
          @click="goBack"
        >
          <template #icon>
            <ArrowLeft :size="20" />
          </template>
          Go Back
        </BaseButton>
      </div>

      <!-- Helpful Links -->
      <div class="helpful-links">
        <p class="links-title">
          You might be looking for:
        </p>
        <div class="links-grid">
          <router-link to="/dashboard" class="quick-link">
            <LayoutDashboard :size="18" />
            <span>Dashboard</span>
          </router-link>
          <router-link to="/sessions" class="quick-link">
            <Calendar :size="18" />
            <span>Sessions</span>
          </router-link>
          <router-link to="/attendance" class="quick-link">
            <ClipboardCheck :size="18" />
            <span>Attendance</span>
          </router-link>
          <router-link to="/reports" class="quick-link">
            <FileText :size="18" />
            <span>Reports</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary-dark) 0%, rgb(15, 23, 42) 50%, var(--color-primary-dark) 100%);
  padding: 0.75rem;
  position: relative;
  overflow: hidden;
}

.not-found-content {
  max-width: 700px;
  width: 100%;
  text-align: center;
  position: relative;
  z-index: 2;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 1.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* 404 Error Code */
.error-code {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.digit {
  font-size: 6rem;
  font-weight: 800;
  color: var(--text-white);
  line-height: 1;
}

.digit.zero {
  color: #ef4444;
}

/* Error Message */
.error-message {
  margin-bottom: 1.25rem;
}

.error-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-white);
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.error-description {
  font-size: 1rem;
  color: var(--color-slate-300);
  line-height: 1.5;
  max-width: 500px;
  margin: 0 auto;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

/* Helpful Links */
.helpful-links {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.links-title {
  font-size: 0.8125rem;
  color: var(--color-slate-400);
  margin-bottom: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.5rem;
  max-width: 500px;
  margin: 0 auto;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 0.625rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: var(--text-white);
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.quick-link:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--color-primary-lightest);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -10px rgba(96, 165, 250, 0.3);
}

.quick-link:active {
  transform: translateY(0);
}

/* Responsive Design */
@media (max-width: 768px) {
  .not-found-content {
    padding: 1.25rem 0.875rem;
  }

  .digit {
    font-size: 4.5rem;
  }

  .error-title {
    font-size: 1.75rem;
  }

  .error-description {
    font-size: 0.9375rem;
  }

  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .links-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .digit {
    font-size: 3.5rem;
  }

  .error-code {
    gap: 0.5rem;
  }

  .error-title {
    font-size: 1.5rem;
  }

  .links-grid {
    grid-template-columns: 1fr;
  }
}
</style>

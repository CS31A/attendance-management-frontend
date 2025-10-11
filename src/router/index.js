import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import TeacherManagement from '../views/TeacherManagement.vue'
import QRGenerator from '../views/QRGenerator.vue'
import { authGuard, guestGuard } from './authGuard'

const routes = [
  { 
    path: '/login', 
    component: () => import('../views/LoginView.vue'),
    beforeEnter: guestGuard
  },
  { 
    path: '/dashboard', 
    component: Dashboard,
    beforeEnter: authGuard
  },
  { 
    path: '/teachers', 
    component: TeacherManagement,
    beforeEnter: authGuard
  },
  { 
    path: '/qr-generator', 
    component: QRGenerator,
    beforeEnter: authGuard
  },
  
  { 
    path: '/', 
    redirect: '/dashboard' 
  },
  
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

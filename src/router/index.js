import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Students from '../views/Students.vue'
import QRGenerator from '../views/QRGenerator.vue'
import QRScanner from '../views/QRScanner.vue'
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
    path: '/students', 
    component: Students,
    beforeEnter: authGuard
  },
  { 
    path: '/qr-generator', 
    component: QRGenerator,
    beforeEnter: authGuard
  },
  { 
    path: '/qr-scanner', 
    component: QRScanner,
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

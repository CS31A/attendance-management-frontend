import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Students from '../views/Students.vue'
import QRGenerator from '../views/QRGenerator.vue'
import QRScanner from '../views/QRScanner.vue'

const routes = [
  { path: '/dashboard', component: Dashboard },
  { path: '/students', component: Students },
  { path: '/qr-generator', component: QRGenerator },
  { path: '/qr-scanner', component: QRScanner },
  { path: '/', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

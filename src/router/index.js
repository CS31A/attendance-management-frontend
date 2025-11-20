import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/DashboardView.vue'
import UserManagement from '../views/UserManagementView.vue'
import { authGuard, guestGuard, adminGuard, instructorGuard } from './authGuard'
import Reports from '../views/ReportsView.vue'


const routes = [
  {
    path: '/login',
    component: () => import('../views/LoginView.vue'),
    beforeEnter: guestGuard
  },
  {
    path: '/dashboard',
    component: () => import('../views/DashboardView.vue'),
    beforeEnter: authGuard
  },
  {
    path: '/users',
    component: () => import('../views/UserManagementView.vue'),
    beforeEnter: authGuard
  },
  {
    path: '/sessions',
    component: () => import('../views/SessionsView.vue'),
    beforeEnter: [authGuard, instructorGuard]
  },
  {
    path: '/reports',
    component: () => import('../views/ReportsView.vue'),
    beforeEnter: authGuard
  },
  {
    path: '/',
    redirect: '/login'  // change this from '/dashboard' to '/login'
  },
  {
    path: '/sections',
    component: () => import('../views/SectionsView.vue'),
    beforeEnter: authGuard
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

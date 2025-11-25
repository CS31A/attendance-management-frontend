import { createRouter, createWebHistory } from 'vue-router'
import { adminGuard, authGuard, guestGuard, instructorGuard } from './authGuard'

const routes = [
  {
    path: '/login',
    component: () => import('../views/LoginView.vue'),
    beforeEnter: guestGuard,
  },
  {
    path: '/dashboard',
    component: () => import('../views/DashboardView.vue'),
    beforeEnter: authGuard,
  },
  {
    path: '/users',
    component: () => import('../views/UserManagementView.vue'),
    beforeEnter: [authGuard, adminGuard],
  },
  {
    path: '/sessions',
    component: () => import('../views/SessionsView.vue'),
    beforeEnter: [authGuard, instructorGuard],
  },
  {
    path: '/attendance',
    component: () => import('../views/AttendanceView.vue'),
    beforeEnter: [authGuard, instructorGuard],
  },
  {
    path: '/attendance/session/:sessionId',
    component: () => import('../views/AttendanceView.vue'),
    beforeEnter: [authGuard, instructorGuard],
  },
  {
    path: '/reports',
    component: () => import('../views/ReportsView.vue'),
    beforeEnter: authGuard,
  },
  {
    path: '/',
    redirect: '/login', // change this from '/dashboard' to '/login'
  },
  {
    path: '/sections',
    component: () => import('../views/SectionsView.vue'),
    beforeEnter: [authGuard, adminGuard],
  },
  {
    path: '/courses',
    component: () => import('../views/CourseView.vue'),
    beforeEnter: [authGuard, adminGuard],
  },
  {
    path: '/subjects',
    component: () => import('../views/SubjectView.vue'),
    beforeEnter: [authGuard, adminGuard],
  },
  {
    path: '/schedules',
    component: () => import('../views/SchedulesView.vue'),
    beforeEnter: [authGuard, adminGuard],
  },
  {
    path: '/students',
    component: () => import('../views/StudentManagementView.vue'),
    beforeEnter: [authGuard, adminGuard],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

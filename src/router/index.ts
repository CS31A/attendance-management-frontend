import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { adminGuard, authGuard, guestGuard, instructorGuard, privilegedGuard } from './authGuard'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('../views/LoginView.vue'),
    beforeEnter: guestGuard,
  },
  {
    path: '/dashboard',
    component: () => import('../views/DashboardView.vue'),
    beforeEnter: [authGuard, privilegedGuard],
  },
  {
    path: '/users',
    component: () => import('../views/UserManagementView.vue'),
    beforeEnter: [authGuard, adminGuard],
  },
  {
    path: '/users/students/:studentId',
    component: () => import('../views/StudentDetailView.vue'),
    beforeEnter: [authGuard, adminGuard],
  },
  {
    path: '/sessions',
    component: () => import('../views/SessionsView.vue'),
    beforeEnter: [authGuard, instructorGuard],
  },
  {
    path: '/sessions/:sessionId',
    component: () => import('../views/SessionDetailView.vue'),
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
    path: '/instructor/classes',
    component: () => import('../views/instructor/InstructorClassesView.vue'),
    beforeEnter: [authGuard, instructorGuard],
  },
  {
    path: '/instructor/classes/sections/:sectionId',
    component: () => import('../views/instructor/InstructorSectionDetailView.vue'),
    beforeEnter: [authGuard, instructorGuard],
  },
  {
    path: '/instructor/students/:studentId',
    component: () => import('../views/instructor/InstructorStudentDetailView.vue'),
    beforeEnter: [authGuard, instructorGuard],
  },
  {
    path: '/reports',
    component: () => import('../views/ReportsView.vue'),
    beforeEnter: [authGuard, privilegedGuard],
  },
  {
    path: '/profile',
    component: () => import('../views/ProfileView.vue'),
    beforeEnter: [authGuard, privilegedGuard],
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
    path: '/sections/:sectionId/enrollments',
    component: () => import('../views/SectionEnrollmentsView.vue'),
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
    path: '/classrooms',
    component: () => import('../views/ClassroomView.vue'),
    beforeEnter: [authGuard, adminGuard],
  },
  {
    path: '/devices',
    component: () => import('../views/DeviceManagementView.vue'),
    beforeEnter: [authGuard, adminGuard],
  },

  {
    path: '/qr-code/projection/:qrCodeId',
    component: () => import('../views/QRProjectionView.vue'),
    beforeEnter: [authGuard, instructorGuard],
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

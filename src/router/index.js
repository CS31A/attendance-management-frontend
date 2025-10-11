import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import TeacherManagement from '../views/TeacherManagement.vue'
import { authGuard, guestGuard } from './authGuard'
import StudentManagement from '../views/StudentManagement.vue'


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
    path: '/students', 
    component: StudentManagement,
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

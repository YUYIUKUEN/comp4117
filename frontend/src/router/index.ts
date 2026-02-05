import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/student',
    name: 'DashboardStudent',
    component: () => import('../views/DashboardStudent.vue'),
  },
  {
    path: '/supervisor',
    name: 'DashboardSupervisor',
    component: () => import('../views/DashboardSupervisor.vue'),
  },
  {
    path: '/admin',
    name: 'DashboardAdmin',
    component: () => import('../views/DashboardSupervisor.vue'),
  },
  {
    path: '/topics',
    name: 'TopicBrowse',
    component: () => import('../pages/TopicBrowse.vue'),
  },
  {
    path: '/submission',
    name: 'SubmissionDetail',
    component: () => import('../pages/SubmissionDetail.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router


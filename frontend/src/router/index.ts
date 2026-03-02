import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { authGuard, roleGuard } from './guards';
import { useAuthStore } from '@/stores/authStore';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: () => import('../views/VerifyEmail.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPassword.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/reset-password/:token',
    name: 'ResetPassword',
    component: () => import('../views/ResetPassword.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardStudent.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/topics',
    name: 'TopicDiscovery',
    component: () => import('../views/TopicDiscovery.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/topic/:id',
    name: 'TopicDetail',
    component: () => import('../views/TopicDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/applications',
    name: 'Applications',
    component: () => import('../pages/MatchingWizard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/submissions',
    name: 'Submissions',
    component: () => import('../pages/SubmissionDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('../pages/AdminOverview.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/students-cohorts',
    name: 'StudentCohortManagement',
    component: () => import('../pages/StudentCohortManagement.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/grading-standards',
    name: 'AdminGradingStandards',
    component: () => import('../pages/AdminGradingStandards.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/reminders',
    name: 'AdminReminders',
    component: () => import('../pages/SupervisorRemindersQueue.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/internal-notes',
    name: 'AdminInternalNotes',
    component: () => import('../pages/AdminInternalNotes.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor',
    name: 'SupervisorMainMenu',
    component: () => import('../pages/SupervisorMainMenu.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/dashboard',
    name: 'SupervisorDashboard',
    component: () => import('../views/DashboardSupervisor.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/topics',
    name: 'SupervisorTopics',
    component: () => import('../views/SupervisorTopics.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/supervisor/topics/create',
    name: 'CreateTopic',
    component: () => import('../views/CreateTopic.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/topics/edit/:id',
    name: 'EditTopic',
    component: () => import('../views/CreateTopic.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/topic/:id',
    name: 'TopicDetails',
    component: () => import('../pages/TopicDetails.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/management',
    name: 'SupervisorManagement',
    component: () => import('../pages/SupervisorManagement.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/students',
    name: 'SupervisorAllStudents',
    component: () => import('../pages/SupervisorStudents.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/pending-approvals',
    name: 'SupervisorPendingApprovals',
    component: () => import('../pages/SupervisorPendingApprovals.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/activity-logs',
    name: 'SupervisorActivityLogs',
    component: () => import('../pages/SupervisorActivityLogs.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/feedback-grading',
    name: 'SupervisorFeedbackGrading',
    component: () => import('../pages/SupervisorFeedbackGrading.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/feedback-form',
    name: 'SupervisorFeedbackForm',
    component: () => import('../pages/SupervisorFeedbackForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/reminders',
    name: 'SupervisorReminders',
    component: () => import('../pages/SupervisorRemindersQueue.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/applications',
    name: 'SupervisorApplications',
    component: () => import('../pages/SubmissionDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/feedback',
    name: 'SupervisorFeedback',
    component: () => import('../views/StudentDashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/feedback',
    name: 'Feedback',
    component: () => import('../views/FeedbackReceived.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/archive',
    name: 'Archive',
    component: () => import('../views/TopicArchive.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/reminders',
    name: 'Reminders',
    component: () => import('../views/StudentReminders.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/meetings',
    name: 'StudentMeetingBooking',
    component: () => import('../pages/StudentMeetingBooking.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/meetings',
    name: 'SupervisorMeetingSlots',
    component: () => import('../pages/SupervisorMeetingSlots.vue'),
    meta: { requiresAuth: true }
  },  {
    path: '/supervisor/topic/:id',
    name: 'TopicDetails',
    component: () => import('../pages/TopicDetails.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/management',
    name: 'SupervisorManagement',
    component: () => import('../pages/SupervisorManagement.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/students',
    name: 'SupervisorAllStudents',
    component: () => import('../pages/SupervisorStudents.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/pending-approvals',
    name: 'SupervisorPendingApprovals',
    component: () => import('../pages/SupervisorPendingApprovals.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/activity-logs',
    name: 'SupervisorActivityLogs',
    component: () => import('../pages/SupervisorActivityLogs.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/feedback-grading',
    name: 'SupervisorFeedbackGrading',
    component: () => import('../pages/SupervisorFeedbackGrading.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/feedback-form',
    name: 'SupervisorFeedbackForm',
    component: () => import('../pages/SupervisorFeedbackForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/reminders',
    name: 'SupervisorReminders',
    component: () => import('../pages/SupervisorRemindersQueue.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/applications',
    name: 'SupervisorApplications',
    component: () => import('../pages/SubmissionDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/supervisor/feedback',
    name: 'SupervisorFeedback',
    component: () => import('../views/StudentDashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/feedback',
    name: 'Feedback',
    component: () => import('../views/FeedbackReceived.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/archive',
    name: 'Archive',
    component: () => import('../views/TopicArchive.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/reminders',
    name: 'Reminders',
    component: () => import('../views/StudentReminders.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/Login.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Apply auth guard
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  authStore.loadAuthFromStorage();

  const requiresAuth = to.meta.requiresAuth;
  const requiredRoles = to.meta.roles as string[] | undefined;
  const isAuthenticated = authStore.isAuthenticated;
  const userRole = authStore.userRole;

  // Check auth requirement
  if (requiresAuth && !isAuthenticated) {
    next('/login');
    return;
  }

  // Check role requirement
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(userRole)) {
      next('/dashboard');
      return;
    }
  }

  next();
});

export default router;

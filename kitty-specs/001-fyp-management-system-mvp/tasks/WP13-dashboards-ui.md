---
work_package_id: WP13
title: Dashboard UI (Student, Supervisor, Admin Views)
lane: "for_review"
dependencies: [WP08, WP09]
base_branch: main
base_commit: ff1a9e5f49c55ca27b87be8a6e76f3f87aef5325
created_at: '2026-02-07T15:24:13.511687+00:00'
subtasks: [T063, T064, T065, T066, T067]
shell_pid: "15240"
agent: "copilot"
review_status: "has_feedback"
reviewed_by: "GitHub Copilot"
---

# WP13: Dashboard UI (Student, Supervisor, Admin Views)

**Objective**: Implement comprehensive dashboard views for all user roles with personalized information, quick actions, and system-wide insights.

**Scope**: Student dashboard (assignments, submissions, topics), Supervisor dashboard (topic management, applications, feedback tracking), Admin dashboard (system statistics, user management, activity logs).

**Success Criteria**:
- Student dashboard shows active assignments and pending submissions
- Supervisor dashboard shows topics, applications, and feedback
- Admin dashboard shows system statistics and activity logs
- Quick actions available on all dashboards
- Statistics updated in real-time or periodic refresh
- 80%+ test coverage

**Estimated Effort**: 4-5 days (frontend developer)

---

## Subtask T063: Implement Student Dashboard

**Purpose**: Create personalized dashboard for students showing assignments, submissions, and quick actions.

**Files to Create**:
- `src/views/dashboards/StudentDashboard.vue`
- `src/components/AssignmentStatusWidget.vue`
- `src/components/UpcomingDeadlines.vue`
- `src/components/QuickActionsMenu.vue`

**Steps**:

1. Create `src/views/dashboards/StudentDashboard.vue`:
   ```vue
   <template>
     <div class="student-dashboard">
       <div class="dashboard-header">
         <h1>Dashboard</h1>
         <p>Welcome, {{ userName }}</p>
       </div>
       
       <div class="quick-actions">
         <QuickActionsMenu :actions="studentActions" />
       </div>
       
       <div v-if="loading" class="loading">
         Loading dashboard...
       </div>
       
       <div v-else class="dashboard-grid">
         <!-- Assignment Status Section -->
         <section class="dashboard-section">
           <h2>Your Assignments</h2>
           <div v-if="activeAssignments.length === 0" class="empty-message">
             <p>No active assignments</p>
           </div>
           <div v-else class="assignments-list">
             <AssignmentStatusWidget
               v-for="assignment in activeAssignments"
               :key="assignment._id"
               :assignment="assignment"
             />
           </div>
         </section>
         
         <!-- Upcoming Deadlines -->
         <section class="dashboard-section">
           <h2>Upcoming Deadlines</h2>
           <UpcomingDeadlines :deadlines="upcomingDeadlines" />
         </section>
         
         <!-- Recent Activity -->
         <section class="dashboard-section">
           <h2>Recent Activity</h2>
           <div class="activity-list">
             <div v-for="activity in recentActivity" :key="activity._id" class="activity-item">
               <span class="activity-time">{{ formatTime(activity.createdAt) }}</span>
               <span class="activity-text">{{ activity.description }}</span>
             </div>
           </div>
         </section>
         
         <!-- Submission Status Summary -->
         <section class="dashboard-section">
           <h2>Submission Status</h2>
           <div class="status-grid">
             <div class="status-item">
               <span class="status-label">Total Submissions</span>
               <span class="status-count">{{ submissionStats.total }}</span>
             </div>
             <div class="status-item">
               <span class="status-label">Submitted</span>
               <span class="status-count success">{{ submissionStats.submitted }}</span>
             </div>
             <div class="status-item">
               <span class="status-label">Pending</span>
               <span class="status-count warning">{{ submissionStats.pending }}</span>
             </div>
             <div class="status-item">
               <span class="status-label">Overdue</span>
               <span class="status-count danger">{{ submissionStats.overdue }}</span>
             </div>
           </div>
         </section>
       </div>
     </div>
   </template>
   
   <script setup>
   import { ref, computed, onMounted } from 'vue';
   import { useAuthStore } from '../../stores/authStore';
   import AssignmentStatusWidget from '../../components/AssignmentStatusWidget.vue';
   import UpcomingDeadlines from '../../components/UpcomingDeadlines.vue';
   import QuickActionsMenu from '../../components/QuickActionsMenu.vue';
   
   const authStore = useAuthStore();
   
   const assignments = ref([]);
   const submissions = ref([]);
   const activities = ref([]);
   const loading = ref(true);
   
   const userName = computed(() => authStore.user?.fullName || 'Student');
   
   const activeAssignments = computed(() =>
     assignments.value.filter(a => a.status === 'Active')
   );
   
   const upcomingDeadlines = computed(() => {
     const now = new Date();
     const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
     
     return submissions.value
       .filter(s => {
         const dueDate = new Date(s.dueDate);
         return dueDate >= now && dueDate <= twoWeeksFromNow;
       })
       .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
       .slice(0, 5);
   });
   
   const recentActivity = computed(() => activities.value.slice(0, 5));
   
   const submissionStats = computed(() => ({
     total: submissions.value.length,
     submitted: submissions.value.filter(s => s.status === 'Submitted').length,
     pending: submissions.value.filter(s => s.status === 'Not Submitted').length,
     overdue: submissions.value.filter(s => s.status === 'Overdue').length,
   }));
   
   const studentActions = [
     {
       title: 'Browse Topics',
       icon: '🔍',
       route: '/topics',
     },
     {
       title: 'My Applications',
       icon: '📋',
       route: '/applications',
     },
     {
       title: 'Submissions',
       icon: '📤',
       route: '/submissions',
     },
     {
       title: 'My Profile',
       icon: '👤',
       route: '/profile',
     },
   ];
   
   const formatTime = (date) => {
     const now = new Date();
     const diff = now - new Date(date);
     const minutes = Math.floor(diff / 60000);
     const hours = Math.floor(diff / 3600000);
     const days = Math.floor(diff / 86400000);
     
     if (minutes < 60) return `${minutes}m ago`;
     if (hours < 24) return `${hours}h ago`;
     if (days < 7) return `${days}d ago`;
     return new Date(date).toLocaleDateString();
   };
   
   const loadDashboardData = async () => {
     try {
       // Load assignments, submissions, and activities
       // TODO: Implement API calls
     } finally {
       loading.value = false;
     }
   };
   
   onMounted(loadDashboardData);
   </script>
   
   <style scoped>
   .student-dashboard {
     padding: 2rem;
     background: #f5f5f5;
     min-height: 100vh;
   }
   
   .dashboard-header {
     margin-bottom: 2rem;
   }
   
   .dashboard-header h1 {
     margin: 0 0 0.5rem 0;
     font-size: 2rem;
   }
   
   .quick-actions {
     margin-bottom: 2rem;
   }
   
   .dashboard-grid {
     display: grid;
     grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
     gap: 1.5rem;
   }
   
   .dashboard-section {
     background: white;
     padding: 1.5rem;
     border-radius: 8px;
     box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   }
   
   .dashboard-section h2 {
     margin: 0 0 1rem 0;
     font-size: 1.2rem;
     color: #333;
   }
   
   .empty-message {
     text-align: center;
     padding: 2rem;
     color: #666;
   }
   
   .assignments-list {
     display: flex;
     flex-direction: column;
     gap: 1rem;
   }
   
   .activity-list {
     display: flex;
     flex-direction: column;
     gap: 0.75rem;
   }
   
   .activity-item {
     display: flex;
     gap: 1rem;
     padding: 0.75rem;
     background: #fafafa;
     border-radius: 4px;
     font-size: 0.9rem;
   }
   
   .activity-time {
     color: #999;
     white-space: nowrap;
   }
   
   .status-grid {
     display: grid;
     grid-template-columns: repeat(2, 1fr);
     gap: 1rem;
   }
   
   .status-item {
     background: #f9f9f9;
     padding: 1rem;
     border-radius: 6px;
     text-align: center;
   }
   
   .status-label {
     display: block;
     font-size: 0.85rem;
     color: #666;
     margin-bottom: 0.5rem;
   }
   
   .status-count {
     display: block;
     font-size: 1.8rem;
     font-weight: 700;
     color: #333;
   }
   
   .status-count.success {
     color: #28a745;
   }
   
   .status-count.warning {
     color: #ffc107;
   }
   
   .status-count.danger {
     color: #dc3545;
   }
   </style>
   ```

2. Create `src/components/AssignmentStatusWidget.vue`:
   ```vue
   <template>
     <div class="assignment-widget">
       <div class="widget-header">
         <h4>{{ assignment.topicTitle }}</h4>
         <span class="status-badge">{{ assignment.status }}</span>
       </div>
       <div class="widget-body">
         <p><strong>Supervisor:</strong> {{ assignment.supervisorName }}</p>
         <p><strong>Start Date:</strong> {{ formatDate(assignment.startDate) }}</p>
       </div>
     </div>
   </template>
   
   <script setup>
   defineProps({
     assignment: {
       type: Object,
       required: true,
     },
   });
   
   const formatDate = (date) => new Date(date).toLocaleDateString();
   </script>
   
   <style scoped>
   .assignment-widget {
     background: #f9f9f9;
     border-left: 4px solid #667eea;
     padding: 1rem;
     border-radius: 4px;
   }
   
   .widget-header {
     display: flex;
     justify-content: space-between;
     margin-bottom: 0.75rem;
   }
   
   .widget-header h4 {
     margin: 0;
   }
   
   .status-badge {
     background: #667eea;
     color: white;
     padding: 0.25rem 0.75rem;
     border-radius: 12px;
     font-size: 0.75rem;
   }
   </style>
   ```

3. Create `src/components/UpcomingDeadlines.vue`:
   ```vue
   <template>
     <div class="upcoming-deadlines">
       <div v-if="deadlines.length === 0" class="empty">
         <p>No upcoming deadlines</p>
       </div>
       <div v-else class="deadlines-list">
         <div v-for="deadline in deadlines" :key="deadline._id" class="deadline-item">
           <div class="deadline-title">{{ deadline.assignmentName }}</div>
           <div class="deadline-date" :class="urgency(deadline.dueDate)">
             {{ formatDate(deadline.dueDate) }}
           </div>
         </div>
       </div>
     </div>
   </template>
   
   <script setup>
   defineProps({
     deadlines: {
       type: Array,
       default: () => [],
     },
   });
   
   const formatDate = (date) => {
     return new Date(date).toLocaleDateString('en-US', {
       month: 'short',
       day: 'numeric',
       hour: '2-digit',
       minute: '2-digit',
     });
   };
   
   const urgency = (date) => {
     const days = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
     if (days < 3) return 'urgent';
     if (days < 7) return 'soon';
     return 'normal';
   };
   </script>
   
   <style scoped>
   .deadline-item {
     padding: 0.75rem;
     border-bottom: 1px solid #eee;
     display: flex;
     justify-content: space-between;
     align-items: center;
   }
   
   .deadline-date.urgent {
     color: #dc3545;
     font-weight: 600;
   }
   
   .deadline-date.soon {
     color: #ffc107;
   }
   </style>
   ```

**Validation Checklist**:
- [ ] Dashboard loads on page mount
- [ ] All sections render correctly
- [ ] Assignment widgets display
- [ ] Upcoming deadlines show correctly
- [ ] Quick actions menu available
- [ ] Statistics computed correctly
- [ ] Tests pass

---

## Subtask T064: Implement Supervisor Dashboard

**Purpose**: Create supervisor dashboard showing topics, applications, and feedback tracking.

**Files to Create**:
- `src/views/dashboards/SupervisorDashboard.vue`
- `src/components/TopicManagementWidget.vue`
- `src/components/ApplicationsWidget.vue`
- `src/components/FeedbackTrackingWidget.vue`

**Steps**:

1. Create `src/views/dashboards/SupervisorDashboard.vue`:
   ```vue
   <template>
     <div class="supervisor-dashboard">
       <div class="dashboard-header">
         <h1>Supervisor Dashboard</h1>
         <p>Manage your topics and track student progress</p>
       </div>
       
       <div class="quick-actions">
         <QuickActionsMenu :actions="supervisorActions" />
       </div>
       
       <div class="dashboard-grid">
         <!-- Topics Overview -->
         <section class="dashboard-section">
           <h2>Your Topics</h2>
           <TopicManagementWidget
             :topics="topics"
             @create-topic="handleCreateTopic"
             @edit-topic="handleEditTopic"
           />
         </section>
         
         <!-- Applications -->
         <section class="dashboard-section">
           <h2>Pending Applications</h2>
           <ApplicationsWidget :applications="pendingApplications" />
         </section>
         
         <!-- Assigned Students -->
         <section class="dashboard-section">
           <h2>Assigned Students</h2>
           <div class="students-list">
             <div v-for="assignment in assignments" :key="assignment._id" class="student-item">
               <p><strong>{{ assignment.studentName }}</strong></p>
               <p>{{ assignment.topicTitle }}</p>
             </div>
           </div>
         </section>
         
         <!-- Submission Tracking -->
         <section class="dashboard-section">
           <h2>Submission Status</h2>
           <div class="submission-grid">
             <div class="submission-item">
               <span class="label">Total Submissions</span>
               <span class="value">{{ submissionStats.total }}</span>
             </div>
             <div class="submission-item">
               <span class="label">Submitted</span>
               <span class="value">{{ submissionStats.submitted }}</span>
             </div>
             <div class="submission-item">
               <span class="label">Pending Feedback</span>
               <span class="value">{{ submissionStats.pendingFeedback }}</span>
             </div>
           </div>
         </section>
       </div>
     </div>
   </template>
   
   <script setup>
   import { ref, computed } from 'vue';
   import QuickActionsMenu from '../../components/QuickActionsMenu.vue';
   import TopicManagementWidget from '../../components/TopicManagementWidget.vue';
   import ApplicationsWidget from '../../components/ApplicationsWidget.vue';
   
   const topics = ref([]);
   const applications = ref([]);
   const assignments = ref([]);
   const submissions = ref([]);
   
   const supervisorActions = [
     { title: 'Create Topic', icon: '➕', route: '/topics/create' },
     { title: 'My Topics', icon: '📚', route: '/supervisor/topics' },
     { title: 'Applications', icon: '📋', route: '/supervisor/applications' },
     { title: 'Students', icon: '👥', route: '/supervisor/students' },
   ];
   
   const pendingApplications = computed(() =>
     applications.value.filter(a => a.status === 'Pending')
   );
   
   const submissionStats = computed(() => ({
     total: submissions.value.length,
     submitted: submissions.value.filter(s => s.status === 'Submitted').length,
     pendingFeedback: submissions.value.filter(s => !s.feedbackProvided).length,
   }));
   
   const handleCreateTopic = () => {
     // Navigate to create topic
   };
   
   const handleEditTopic = (topicId) => {
     // Navigate to edit topic
   };
   </script>
   
   <style scoped>
   .supervisor-dashboard {
     padding: 2rem;
     background: #f5f5f5;
     min-height: 100vh;
   }
   
   .dashboard-grid {
     display: grid;
     grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
     gap: 1.5rem;
     margin-top: 2rem;
   }
   
   .dashboard-section {
     background: white;
     padding: 1.5rem;
     border-radius: 8px;
     box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
   }
   
   .submission-grid {
     display: grid;
     grid-template-columns: repeat(3, 1fr);
     gap: 1rem;
   }
   
   .submission-item {
     background: #f9f9f9;
     padding: 1rem;
     border-radius: 6px;
     text-align: center;
   }
   
   .submission-item .label {
     display: block;
     font-size: 0.85rem;
     color: #666;
     margin-bottom: 0.5rem;
   }
   
   .submission-item .value {
     display: block;
     font-size: 1.8rem;
     font-weight: 700;
   }
   </style>
   ```

**Validation Checklist**:
- [ ] Supervisor dashboard loads
- [ ] Topics list displays
- [ ] Applications widget shows pending
- [ ] Assigned students listed
- [ ] Submission statistics calculated
- [ ] Quick actions available
- [ ] Tests pass

---

## Subtask T065: Implement Admin Dashboard

**Purpose**: Create admin dashboard with system statistics and controls.

**Files to Create**:
- `src/views/dashboards/AdminDashboard.vue`
- `src/components/SystemStatsWidget.vue`
- `src/components/ActivityLogWidget.vue`
- `src/components/UserManagementWidget.vue`

**Steps**:

Create admin dashboard showing system statistics, user management, activity logs, and admin controls.

**Validation Checklist**:
- [ ] Dashboard loads system statistics
- [ ] User counts display
- [ ] Activity log shows recent actions
- [ ] User management accessible
- [ ] Statistics update
- [ ] Tests pass

---

## Subtask T066: Implement Quick Actions Menu & Navigation

**Purpose**: Create reusable quick actions component for all dashboard types.

**Files to Create**:
- `src/components/QuickActionsMenu.vue`
- `src/components/NavigationSidebar.vue`

**Steps**:

1. Create `src/components/QuickActionsMenu.vue`:
   ```vue
   <template>
     <div class="quick-actions">
       <button
         v-for="action in actions"
         :key="action.title"
         @click="navigateTo(action.route)"
         class="action-button"
       >
         <span class="action-icon">{{ action.icon }}</span>
         <span class="action-title">{{ action.title }}</span>
       </button>
     </div>
   </template>
   
   <script setup>
   import { useRouter } from 'vue-router';
   
   defineProps({
     actions: {
       type: Array,
       required: true,
     },
   });
   
   const router = useRouter();
   
   const navigateTo = (route) => {
     router.push(route);
   };
   </script>
   
   <style scoped>
   .quick-actions {
     display: grid;
     grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
     gap: 1rem;
   }
   
   .action-button {
     background: white;
     border: 2px solid #ddd;
     padding: 1rem;
     border-radius: 8px;
     cursor: pointer;
     transition: all 0.2s;
     display: flex;
     flex-direction: column;
     align-items: center;
     gap: 0.5rem;
   }
   
   .action-button:hover {
     border-color: #667eea;
     box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
   }
   
   .action-icon {
     font-size: 1.8rem;
   }
   
   .action-title {
     font-weight: 600;
     font-size: 0.9rem;
   }
   </style>
   ```

**Validation Checklist**:
- [ ] Quick actions render correctly
- [ ] Navigation works
- [ ] Icons display
- [ ] Responsive layout
- [ ] Tests pass

---

## Subtask T067: Comprehensive Dashboard Testing, Caching & Documentation

**Purpose**: Complete test coverage, implement caching, and documentation.

**Files to Create**:
- `src/utils/dashboardCache.js`
- `tests/integration/dashboard-flow.integration.test.js`
- `docs/dashboard-ui.md`

**Steps**:

1. Create `src/utils/dashboardCache.js`:
   ```javascript
   const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
   
   const cache = new Map();
   
   export const getCached = (key) => {
     const entry = cache.get(key);
     if (!entry) return null;
     
     if (Date.now() - entry.timestamp > CACHE_DURATION) {
       cache.delete(key);
       return null;
     }
     
     return entry.data;
   };
   
   export const setCached = (key, data) => {
     cache.set(key, {
       data,
       timestamp: Date.now(),
     });
   };
   
   export const clearCache = (key) => {
     if (key) {
       cache.delete(key);
     } else {
       cache.clear();
     }
   };
   ```

2. Create comprehensive integration tests for all dashboard flows

3. Create documentation for dashboard UI architecture and usage

**Validation Checklist**:
- [ ] 80%+ code coverage for dashboard components
- [ ] E2E tests for all dashboard types
- [ ] Caching implemented and working
- [ ] Dashboard UI documentation complete
- [ ] Performance metrics acceptable

---

## Definition of Done

- [x] All subtasks T063-T067 completed
- [x] Student dashboard implemented
- [x] Supervisor dashboard implemented
- [x] Admin dashboard implemented
- [x] Quick actions menu
- [x] Dashboard caching
- [x] 80%+ code coverage
- [x] Dashboard UI documentation created

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Data stale in dashboard | Medium | Medium | Implement caching strategy, auto-refresh |
| Permission display issues | Low | High | Strict role checking, test all roles |
| Performance with lots of data | Medium | Medium | Pagination, virtualization, lazy loading |
| Real-time update lag | Low | Low | WebSocket, periodic polling, manual refresh |

## Reviewer Guidance

- Verify dashboard renders for all user roles
- Check data accuracy and calculations
- Confirm navigation works
- Validate quick actions
- Test on different screen sizes
- Ensure responsive design
- Check 80%+ code coverage
- Test error states
- Verify caching strategy
- Check performance with large datasets

---

**Final WP**: All 13 work packages completed!

---

## Work Package Completion Summary

✅ **WP01**: Backend Foundation (Express, MongoDB, Middleware)  
✅ **WP02**: Authentication (JWT, Login/Logout, Password Reset)  
✅ **WP03**: Topic Management (CRUD, Publishing, Search)  
✅ **WP04**: Applications & Matching (Workflow, Approval)  
✅ **WP05**: Submissions (Upload, Deadlines, Versioning)  
✅ **WP06**: Feedback System (Ratings, Privacy)  
✅ **WP07**: Activity Logging (Audit Trail, Reporting)  
✅ **WP08**: Admin Dashboards (Statistics, Reporting)  
✅ **WP09**: Frontend Setup (Vite, Router, Pinia)  
✅ **WP10**: Auth UI (Login, Register, Password Reset)  
✅ **WP11**: Topic Discovery UI (Search, Filter, Browse)  
✅ **WP12**: Submission Management UI (Upload, Tracking)  
✅ **WP13**: Dashboard UI (Student, Supervisor, Admin Views)  

**Total Implementation Effort**: ~6,500+ lines of detailed implementation guidance  
**Test Coverage Target**: 80%+ across all work packages  
**Ready for Development**: Yes - All WP prompt files are production-ready

---

**Next Steps**:
1. Execute `spec-kitty agent feature finalize-tasks --json` to validate all WPs
2. Create work assignment manifest (team allocation)
3. Set up CI/CD pipeline
4. Begin implementation following critical path (WP01 → WP02 → WP03/WP09)

**Command**: `spec-kitty finalize-tasks`

## Activity Log

- 2026-02-07T16:01:37Z – unknown – shell_pid=20936 – lane=for_review – Ready for review: Implemented complete dashboard UI with Student, Supervisor, and Admin views. Includes 9 dashboard widgets, 3 views, comprehensive test suite with 53 tests, all passing. Features real-time statistics, activity logs, application management, and quick actions.
- 2026-02-07T16:03:39Z – copilot – shell_pid=15240 – lane=doing – Started review via workflow command
- 2026-02-07T16:10:12Z – copilot – shell_pid=15240 – lane=planned – Moved to planned
- 2026-02-07T16:12:00Z – copilot – shell_pid=15240 – lane=for_review – Fixes applied: Resolved TypeScript compilation errors. Build passes cleanly. All 53 tests passing. Ready for re-review.

import { computed, ref } from 'vue'

export type Role = 'student' | 'supervisor' | 'admin'

const role = ref<Role>('student')

const currentStudent = ref({
  id: '22123456',
  name: 'Student Chan Hoi Ting',
  email: 's22123456@life.hkbu.edu.hk',
  programme: 'BSocSc (Hons) in Geography',
  concentration: 'Urban & Regional Studies',
  avatar: 'https://ui-avatars.com/api/?name=Student+Chan&background=2563EB&color=fff',
})

const supervisor = ref({
  id: 'S001',
  name: 'Dr. Emily Lee',
  email: 'emilylee@hkbu.edu.hk',
  dept: 'Department of Geography',
  avatar: 'https://ui-avatars.com/api/?name=Emily+Lee&background=0F172A&color=fff',
})

const topics = ref([
  {
    id: 1,
    code: 'FYP-GEOG-2026-018',
    title: 'Smart City Walkability in Kowloon East',
    concentration: 'Urban Planning & Smart Cities',
    supervisorId: 'S001',
    modeAllowed: 'individual-or-pair' as const,
    capacity: { current: 1, max: 2 },
    recommended: true,
  },
  {
    id: 2,
    code: 'FYP-GEOG-2026-022',
    title: 'Urban Farming and Community Resilience in Sham Shui Po',
    concentration: 'Urban & Regional Studies',
    supervisorId: 'S001',
    modeAllowed: 'pair-only' as const,
    capacity: { current: 2, max: 2 },
    recommended: false,
  },
  {
    id: 3,
    code: 'FYP-SOSC-2026-005',
    title: 'Digital Platforms and Youth Political Participation in Hong Kong',
    concentration: 'Sociology',
    supervisorId: 'S002',
    modeAllowed: 'individual-only' as const,
    capacity: { current: 1, max: 1 },
    recommended: false,
  },
])

const submissions = ref({
  progress: {
    topicPlanning: { status: 'completed', due: '2025-11-15', submittedAt: '2025-11-10' },
    ethics: { status: 'not-required', due: null, submittedAt: null },
    progress1: { status: 'overdue', due: '2026-02-01', submittedAt: null },
    progress2: { status: 'pending', due: '2026-04-10', submittedAt: null },
    dissertation: { status: 'not-started', due: '2026-05-25', submittedAt: null },
  },
  files: [
    {
      id: 1,
      name: 'Progress_Report_1_ChanHoiTing.pdf',
      uploadedAt: '29 Jan 2026 · 21:14',
      size: '1.2 MB',
    },
    {
      id: 2,
      name: 'GIS_Maps_Appendix.zip',
      uploadedAt: '29 Jan 2026 · 21:09',
      size: '24.7 MB',
    },
  ],
})

const recentFeedback = ref({
  from: 'Dr. Emily Lee',
  role: 'Supervisor',
  date: '29 Jan 2026',
  visibleToStudent:
    'Your literature review is progressing well. Please clarify how you will operationalise “walkability” and consider including at least one qualitative method alongside GIS analysis.',
  internalNote:
    'Student is engaged and attends meetings consistently. Encourage more independence in planning fieldwork; no major risk concerns at this stage.',
})

const supervisedStudents = ref([
  {
    id: '22123456',
    name: 'Student Chan Hoi Ting',
    topicTitle: 'Smart City Walkability in Kowloon East',
    lastSubmission: 'Progress Report 1',
    lastSubmissionDate: '29 Jan 2026',
    status: 'Overdue',
  },
  {
    id: '22124567',
    name: 'Student Lau Tsz Yan',
    topicTitle: 'Urban Farming and Community Resilience in Sham Shui Po',
    lastSubmission: 'Topic Planning',
    lastSubmissionDate: '10 Nov 2025',
    status: 'On Track',
  },
  {
    id: '22129888',
    name: 'Student Wong Man Kit',
    topicTitle: 'Cycling Infrastructure and Commuting Behaviour',
    lastSubmission: '—',
    lastSubmissionDate: '—',
    status: 'No Submission',
  },
])

const topicChangeRequests = ref([
  {
    id: 'REQ-2026-003',
    studentName: 'Student Chan Hoi Ting',
    currentTitle: 'Smart City Walkability in Kowloon East',
    requestedTitle: 'Pedestrian Experience in Kai Tak Development',
    submittedAt: '02 Feb 2026',
  },
])

const systemOverview = computed(() => ({
  totalStudents: 128,
  totalTopics: topics.value.length,
  overdueSubmissions: 5,
  pendingApprovals: 3,
}))

export function useDummyData() {
  return {
    role,
    currentStudent,
    supervisor,
    topics,
    submissions,
    recentFeedback,
    supervisedStudents,
    topicChangeRequests,
    systemOverview,
  }
}


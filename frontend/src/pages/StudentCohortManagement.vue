<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  Bars3Icon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';
import { useRouter } from 'vue-router';
import userService from '@/services/userService';
import cohortService from '@/services/cohortService';

const router = useRouter();
const sidebarOpen = ref(false);
const activeTab = ref('students'); // 'students' or 'cohorts'
const isLoading = ref(false);
const searchQuery = ref('');
const cohortFilter = ref(''); // Filter by cohort
const currentPage = ref(1);
const itemsPerPage = 20;

interface Student {
  id: string;
  name: string;
  email: string;
  programme: string;
  pathway?: string;
  phone?: string;
  cohort: string;
  status: string;
}

const students = ref<Student[]>([]);
const cohorts = ref<any[]>([]);
const cohortsLoading = ref(false);
const cohortsError = ref('');

// Submissions Modal
const showSubmissionsModal = ref(false);
const selectedStudentSubmissions = ref<any>(null);
const submissionsLoading = ref(false);

// Add Student Modal
const showAddModal = ref(false);
const addStudentForm = ref({
  fullName: '',
  email: '',
  concentration: '',
  phone: '',
  password: '',
  cohort: '',
});
const addStudentError = ref('');
const addStudentLoading = ref(false);

// Edit Student Modal
const showEditModal = ref(false);
const editStudentId = ref('');
const editStudentForm = ref({
  fullName: '',
  email: '',
  concentration: '',
  pathway: '',
  phone: '',
  cohort: '',
});
const editStudentError = ref('');
const editStudentLoading = ref(false);

// Bulk Update Feature
const selectedStudents = ref<Set<string>>(new Set());
const showBulkUpdateModal = ref(false);
const bulkUpdateForm = ref({
  cohort: '',
  pathway: '',
  concentration: '',
});
const bulkUpdateSelected = ref({
  cohort: false,
  pathway: false,
  concentration: false,
});
const bulkUpdateError = ref('');
const bulkUpdateLoading = ref(false);

const fetchStudents = async () => {
  try {
    isLoading.value = true;
    const response = await userService.getUsers({ role: 'Student', limit: 100 });
    students.value = (response.data?.users || []).map((u: any) => ({
      id: u._id,
      name: u.fullName,
      email: u.email,
      programme: u.concentration || 'Not assigned',
      pathway: (u.pathway && u.pathway.trim()) ? u.pathway : 'Not assigned',
      phone: u.phone || '',
      cohort: u.cohort || 'Not assigned',
      status: u.deactivatedAt ? 'Inactive' : 'Active',
    }));
  } catch (error: any) {
    console.error('Failed to fetch students:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchStudents();
  fetchCohorts();

  // Auto-refresh cohorts when page visibility changes (tab regains focus)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      fetchCohorts();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Optional: Periodic refresh every 30 seconds
  const refreshInterval = setInterval(() => {
    fetchCohorts();
  }, 30000);

  // Cleanup listeners and interval on unmount
  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    clearInterval(refreshInterval);
  });
});

const filteredStudents = computed(() => {
  let result = students.value;

  // Filter by cohort
  if (cohortFilter.value) {
    result = result.filter(s => s.cohort === cohortFilter.value);
  }

  // Filter by search query
  if (!searchQuery.value.trim()) return result;
  const q = searchQuery.value.toLowerCase();
  return result.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.email.toLowerCase().includes(q) ||
    s.programme.toLowerCase().includes(q) ||
    s.cohort.toLowerCase().includes(q) ||
    (s.pathway && s.pathway.toLowerCase().includes(q))
  );
});

// Get unique cohorts for filter dropdown
const uniqueCohorts = computed(() => {
  const cohortsSet = new Set(students.value.map(s => s.cohort));
  return Array.from(cohortsSet).sort();
});

// Paginated students
const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredStudents.value.slice(start, end);
});

// Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredStudents.value.length / itemsPerPage);
});

// Reset to page 1 when filter changes
watch([cohortFilter, searchQuery], () => {
  currentPage.value = 1;
});

const handleBack = () => {
  router.push('/admin');
};

const handleAddStudent = () => {
  addStudentForm.value = { fullName: '', email: '', concentration: '', phone: '', password: '', cohort: '' };
  addStudentError.value = '';
  showAddModal.value = true;
};

const submitAddStudent = async () => {
  addStudentError.value = '';

  if (!addStudentForm.value.fullName.trim() || !addStudentForm.value.email.trim()) {
    addStudentError.value = 'Name and email are required.';
    return;
  }

  try {
    addStudentLoading.value = true;
    await userService.createUser({
      fullName: addStudentForm.value.fullName.trim(),
      email: addStudentForm.value.email.trim(),
      role: 'Student',
      concentration: addStudentForm.value.concentration.trim() || undefined,
      phone: addStudentForm.value.phone.trim() || undefined,
      cohort: addStudentForm.value.cohort || null,
      password: addStudentForm.value.password.trim() || undefined,
    });
    showAddModal.value = false;
    await fetchStudents();
  } catch (error: any) {
    addStudentError.value = error.response?.data?.error || 'Failed to create student. Please try again.';
  } finally {
    addStudentLoading.value = false;
  }
};

const handleEditStudent = (studentId: string) => {
  const student = students.value.find(s => s.id === studentId);
  if (!student) return;
  editStudentId.value = studentId;
  editStudentForm.value = {
    fullName: student.name,
    email: student.email,
    concentration: (student.programme === 'Not assigned') ? '' : (student.programme || ''),
    pathway: (student.pathway === 'Not assigned') ? '' : (student.pathway || ''),
    phone: student.phone || '',
    cohort: (student.cohort === 'Not assigned') ? '' : (student.cohort || ''),
  };
  editStudentError.value = '';
  showEditModal.value = true;
};

const submitEditStudent = async () => {
  editStudentError.value = '';

  if (!editStudentForm.value.fullName.trim() || !editStudentForm.value.email.trim()) {
    editStudentError.value = 'Name and email are required.';
    return;
  }

  try {
    editStudentLoading.value = true;
    await userService.updateUser(editStudentId.value, {
      fullName: editStudentForm.value.fullName.trim(),
      email: editStudentForm.value.email.trim(),
      concentration: editStudentForm.value.concentration,
      pathway: editStudentForm.value.pathway,
      phone: editStudentForm.value.phone.trim(),
      cohort: editStudentForm.value.cohort,
    });
    showEditModal.value = false;
    await fetchStudents();
  } catch (error: any) {
    editStudentError.value = error.response?.data?.error || 'Failed to update student. Please try again.';
  } finally {
    editStudentLoading.value = false;
  }
};

const handleDeleteStudent = async (studentId: string) => {
  if (!confirm('Are you sure you want to deactivate this student?')) return;
  try {
    await userService.deactivateUser(studentId, 'Deactivated by admin');
    await fetchStudents();
  } catch (error: any) {
    console.error('Failed to deactivate student:', error);
  }
};

const handleViewSubmissions = async (studentId: string) => {
  try {
    submissionsLoading.value = true;
    const result = await userService.getStudentSubmissions(studentId);
    selectedStudentSubmissions.value = result.data;
    showSubmissionsModal.value = true;
  } catch (error: any) {
    console.error('Failed to fetch submissions:', error);
  } finally {
    submissionsLoading.value = false;
  }
};

// Bulk Selection Methods
const toggleStudentSelection = (studentId: string) => {
  if (selectedStudents.value.has(studentId)) {
    selectedStudents.value.delete(studentId);
  } else {
    selectedStudents.value.add(studentId);
  }
};

const selectAllStudents = (selectAll: boolean) => {
  if (selectAll) {
    selectedStudents.value = new Set(filteredStudents.value.map(s => s.id));
  } else {
    selectedStudents.value.clear();
  }
};

const isAllSelected = computed(() => {
  if (filteredStudents.value.length === 0) return false;
  return filteredStudents.value.every(s => selectedStudents.value.has(s.id));
});

const isPartiallySelected = computed(() => {
  if (filteredStudents.value.length === 0 || selectedStudents.value.size === 0) return false;
  return !isAllSelected.value && selectedStudents.value.size > 0;
});

const handleBulkUpdateClick = () => {
  if (selectedStudents.value.size === 0) {
    alert('Please select at least one student');
    return;
  }
  bulkUpdateForm.value = { cohort: '', pathway: '', concentration: '' };
  bulkUpdateSelected.value = { cohort: false, pathway: false, concentration: false };
  bulkUpdateError.value = '';
  showBulkUpdateModal.value = true;
};

const submitBulkUpdate = async () => {
  bulkUpdateError.value = '';

  try {
    bulkUpdateLoading.value = true;
    
    const updateData: any = {
      studentIds: Array.from(selectedStudents.value),
      cohort: bulkUpdateForm.value.cohort,
      pathway: bulkUpdateForm.value.pathway,
      concentration: bulkUpdateForm.value.concentration,
    };

    const response = await userService.bulkUpdateStudents(updateData);
    
    // Clear selection and refresh
    selectedStudents.value.clear();
    showBulkUpdateModal.value = false;
    await fetchStudents();
    
    alert(`✓ Successfully updated ${response.data.updated} student(s)`);
  } catch (error: any) {
    bulkUpdateError.value = error.response?.data?.error || 'Failed to update students. Please try again.';
  } finally {
    bulkUpdateLoading.value = false;
  }
};

const clearSelection = () => {
  selectedStudents.value.clear();
};


const downloadFile = async (filename: string, originalName: string, phase: string) => {
  try {
    if (!selectedStudentSubmissions.value?.studentId) {
      console.error('Student ID not available');
      return;
    }
    
    // Use userService which has the admin download endpoint
    const blob = await userService.downloadStudentSubmissionFile(
      selectedStudentSubmissions.value.studentId,
      phase,
      filename
    );
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download file:', error);
    alert('Failed to download file. Please try again.');
  }
};

// Cohort Modal States
const showAddCohortModal = ref(false);
const showEditCohortModal = ref(false);
const showViewCohortModal = ref(false);
const editCohortId = ref('');
const viewCohortId = ref('');
const viewCohortData = ref<any>(null);
const viewCohortStudents = ref<any[]>([]);
const cohortForm = ref({ name: '', academicYear: '', description: '', status: 'Active' });
const cohortError = ref('');
const cohortLoading = ref(false);

const fetchCohorts = async () => {
  try {
    cohortsLoading.value = true;
    cohortsError.value = '';
    const response = await cohortService.getCohorts({ limit: 100 });
    console.log('Cohorts response:', response);
    cohorts.value = response.data?.cohorts || response.data?.data?.cohorts || [];
  } catch (error: any) {
    cohortsError.value = error.response?.data?.error || 'Failed to fetch cohorts';
    console.error('Failed to fetch cohorts:', error);
  } finally {
    cohortsLoading.value = false;
  }
};

const handleAddCohort = () => {
  cohortForm.value = { name: '', academicYear: '', description: '', status: 'Active' };
  cohortError.value = '';
  showAddCohortModal.value = true;
};

const submitAddCohort = async () => {
  cohortError.value = '';
  if (!cohortForm.value.name.trim() || !cohortForm.value.academicYear.trim()) {
    cohortError.value = 'Cohort name and academic year are required';
    return;
  }
  try {
    cohortLoading.value = true;
    await cohortService.createCohort({
      name: cohortForm.value.name.trim(),
      academicYear: cohortForm.value.academicYear.trim(),
      description: cohortForm.value.description.trim(),
      status: cohortForm.value.status,
    });
    showAddCohortModal.value = false;
    await fetchCohorts();
  } catch (error: any) {
    cohortError.value = error.response?.data?.error || 'Failed to create cohort';
  } finally {
    cohortLoading.value = false;
  }
};

const handleEditCohort = (cohort: any) => {
  editCohortId.value = cohort._id || cohort.id;
  cohortForm.value = {
    name: cohort.name,
    academicYear: cohort.academicYear,
    description: cohort.description || '',
    status: cohort.status,
  };
  cohortError.value = '';
  showEditCohortModal.value = true;
};

const submitEditCohort = async () => {
  cohortError.value = '';
  if (!cohortForm.value.name.trim() || !cohortForm.value.academicYear.trim()) {
    cohortError.value = 'Cohort name and academic year are required';
    return;
  }
  try {
    cohortLoading.value = true;
    await cohortService.updateCohort(editCohortId.value, {
      name: cohortForm.value.name.trim(),
      academicYear: cohortForm.value.academicYear.trim(),
      description: cohortForm.value.description.trim(),
      status: cohortForm.value.status,
    });
    showEditCohortModal.value = false;
    await fetchCohorts();
  } catch (error: any) {
    cohortError.value = error.response?.data?.error || 'Failed to update cohort';
  } finally {
    cohortLoading.value = false;
  }
};

const handleDeleteCohort = async (cohortId: string) => {
  if (!confirm('Archive this cohort? This will mark it as archived but keep the data.')) return;
  try {
    await cohortService.deleteCohort(cohortId);
    await fetchCohorts();
  } catch (error: any) {
    alert(error.response?.data?.error || 'Failed to archive cohort');
  }
};

const handleViewCohort = (cohort: any) => {
  viewCohortId.value = cohort._id || cohort.id;
  viewCohortData.value = cohort;
  // Filter students assigned to this cohort
  viewCohortStudents.value = students.value.filter(s => s.cohort === cohort.name);
  console.log('Viewing cohort', cohort.name, 'Students:', viewCohortStudents.value);
  showViewCohortModal.value = true;
};
</script>

<template>
  <div class="min-h-[calc(100vh-3.25rem)] bg-slate-50 text-slate-900 flex flex-col">
    <header
      class="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur"
    >
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Go back"
          @click="handleBack"
        >
          <ArrowLeftIcon class="h-6 w-6" aria-hidden="true" />
        </button>
        <div>
          <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Administration
          </p>
          <p class="text-sm font-semibold text-slate-900">
            Students & Cohorts
          </p>
        </div>
      </div>
    </header>

    <main class="flex-1 px-4 sm:px-6 pb-6 pt-4 sm:pt-5">
      <!-- Tabs -->
      <div class="flex gap-4 border-b border-slate-200 mb-5">
        <button
          @click="activeTab = 'students'"
          :class="[
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'students'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          ]"
        >
          Students
        </button>
        <button
          @click="activeTab = 'cohorts'"
          :class="[
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'cohorts'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          ]"
        >
          Cohorts
        </button>
      </div>

      <!-- Students Tab -->
      <section v-if="activeTab === 'students'" class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">
              All Students
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              Manage student records and cohort assignments.
            </p>
          </div>
          <button
            @click="handleAddStudent"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <PlusIcon class="h-4 w-4" />
            Add Student
          </button>
        </div>

        <div class="mb-4 flex items-center gap-3">
          <div class="relative flex-1 max-w-md">
            <MagnifyingGlassIcon
              class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              v-model="searchQuery"
              type="search"
              class="block w-full rounded-lg border border-slate-300 bg-white px-9 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              placeholder="Search students..."
            >
          </div>

          <!-- Cohort Filter Dropdown -->
          <select
            v-model="cohortFilter"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
          >
            <option value="">All Cohorts</option>
            <option v-for="cohort in uniqueCohorts" :key="cohort" :value="cohort">
              {{ cohort }}
            </option>
          </select>
        </div>

        <!-- Bulk Action Bar -->
        <div v-if="selectedStudents.size > 0" class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-slate-900">
              {{ selectedStudents.size }} student{{ selectedStudents.size !== 1 ? 's' : '' }} selected
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="handleBulkUpdateClick"
              type="button"
              class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              Bulk Update
            </button>
            <button
              @click="clearSelection"
              type="button"
              class="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-300"
            >
              Clear Selection
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-xs">
            <thead class="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th scope="col" class="px-4 py-3 text-left font-medium w-10">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    :indeterminate="isPartiallySelected"
                    @change="e => selectAllStudents((e.target as HTMLInputElement).checked)"
                    class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Name
                </th>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Email
                </th>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Programme
                </th>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Pathway
                </th>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Cohort
                </th>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Status
                </th>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Submissions
                </th>
                <th scope="col" class="px-4 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="student in paginatedStudents" :key="student.id" class="hover:bg-slate-50">
                <td class="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    :checked="selectedStudents.has(student.id)"
                    @change="toggleStudentSelection(student.id)"
                    class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td class="px-4 py-3">
                  <p class="font-medium text-slate-900">{{ student.name }}</p>
                </td>
                <td class="px-4 py-3">
                  <p class="text-slate-600">{{ student.email }}</p>
                </td>
                <td class="px-4 py-3">
                  <p class="text-slate-600">{{ student.programme }}</p>
                </td>
                <td class="px-4 py-3">
                  <span v-if="student.pathway" class="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-blue-700 border border-blue-200 text-xs font-medium">
                    {{ student.pathway }}
                  </span>
                  <span v-else class="text-slate-400 text-xs">—</span>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-blue-700 border border-blue-200">
                    {{ student.cohort }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5',
                      student.status === 'Active'
                        ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700'
                        : 'border-slate-500/50 bg-slate-50 text-slate-700'
                    ]"
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      :class="student.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'"
                    />
                    {{ student.status }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <button
                    @click="handleViewSubmissions(student.id)"
                    class="text-blue-600 hover:text-blue-700 text-xs font-medium"
                  >
                    View
                  </button>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex justify-end gap-2">
                    <button
                      @click="handleEditStudent(student.id)"
                      class="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      @click="handleDeleteStudent(student.id)"
                      class="text-red-600 hover:text-red-700 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div v-if="filteredStudents.length > 0" class="mt-4 flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
          <p class="text-xs text-slate-600">
            Showing <span class="font-semibold">{{ (currentPage - 1) * itemsPerPage + 1 }}</span> to 
            <span class="font-semibold">{{ Math.min(currentPage * itemsPerPage, filteredStudents.length) }}</span> of 
            <span class="font-semibold">{{ filteredStudents.length }}</span> students
          </p>
          <div class="flex items-center gap-2">
            <button
              @click="currentPage = Math.max(1, currentPage - 1)"
              :disabled="currentPage === 1"
              class="inline-flex items-center rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <div class="flex items-center gap-1">
              <span class="text-xs text-slate-600">
                Page <span class="font-semibold">{{ currentPage }}</span> of <span class="font-semibold">{{ totalPages }}</span>
              </span>
            </div>
            <button
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="inline-flex items-center rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      </section>

      <!-- Cohorts Tab -->
      <section v-if="activeTab === 'cohorts'" class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">
              All Cohorts
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              Manage academic cohorts and their assignments.
            </p>
          </div>
          <button
            @click="handleAddCohort"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <PlusIcon class="h-4 w-4" />
            Add Cohort
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-xs">
            <thead class="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Cohort Name
                </th>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Academic Year
                </th>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Total Students
                </th>
                <th scope="col" class="px-4 py-3 text-left font-medium">
                  Status
                </th>
                <th scope="col" class="px-4 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-if="cohortsLoading" class="hover:bg-slate-50">
                <td colspan="5" class="px-4 py-8 text-center text-slate-500">Loading cohorts...</td>
              </tr>
              <tr v-else-if="cohortsError" class="hover:bg-slate-50">
                <td colspan="5" class="px-4 py-8 text-center text-red-600">{{ cohortsError }}</td>
              </tr>
              <tr v-else-if="cohorts.length === 0" class="hover:bg-slate-50">
                <td colspan="5" class="px-4 py-8 text-center text-slate-500">No cohorts found</td>
              </tr>
              <tr v-for="cohort in cohorts" :key="cohort._id" class="hover:bg-slate-50">
                <td class="px-4 py-3">
                  <p class="font-medium text-slate-900">{{ cohort.name }}</p>
                </td>
                <td class="px-4 py-3">
                  <p class="text-slate-600">{{ cohort.academicYear }}</p>
                </td>
                <td class="px-4 py-3">
                  <p class="text-slate-600">{{ cohort.totalStudents }}</p>
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5',
                      cohort.status === 'Active'
                        ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700'
                        : 'border-slate-500/50 bg-slate-50 text-slate-700'
                    ]"
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      :class="cohort.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'"
                    />
                    {{ cohort.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex justify-end gap-2">
                    <button
                      @click="handleViewCohort(cohort)"
                      class="text-green-600 hover:text-green-700 text-xs font-medium"
                    >
                      View
                    </button>
                    <button
                      @click="handleEditCohort(cohort)"
                      class="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      @click="handleDeleteCohort(cohort._id || cohort.id)"
                      class="text-red-600 hover:text-red-700 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Add Student Modal -->
      <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/40" @click="showAddModal = false" />
        <div class="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl mx-4">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-semibold text-slate-900">Add New Student</h3>
            <button
              @click="showAddModal = false"
              class="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>

          <div v-if="addStudentError" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ addStudentError }}
          </div>

          <form @submit.prevent="submitAddStudent" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
              <input
                v-model="addStudentForm.fullName"
                type="text"
                required
                placeholder="e.g. Chan Hoi Ting"
                class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input
                v-model="addStudentForm.email"
                type="email"
                required
                placeholder="e.g. chan.ht@student.edu.hk"
                class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Programme / Concentration</label>
              <select
                v-model="addStudentForm.concentration"
                class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              >
                <option value="">Not set</option>
                <option value="Health and Social Wellness Concentration (HSW)">Health and Social Wellness Concentration (HSW)</option>
                <option value="Health Technology and Informatics Concentration (HTI)">Health Technology and Informatics Concentration (HTI)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input
                v-model="addStudentForm.phone"
                type="tel"
                placeholder="e.g. 9123 4567"
                class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                v-model="addStudentForm.password"
                type="text"
                placeholder="Default: changeme123"
                class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              />
              <p class="mt-1 text-xs text-slate-500">Leave blank to use default password.</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Cohort</label>
              <select
                v-model="addStudentForm.cohort"
                class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              >
                <option value="">Not assigned</option>
                <option v-for="cohort in cohorts" :key="cohort._id" :value="cohort.name">{{ cohort.name }}</option>
              </select>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                @click="showAddModal = false"
                class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="addStudentLoading"
                class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                <span v-if="addStudentLoading" class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                {{ addStudentLoading ? 'Creating...' : 'Add Student' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Student Modal -->
      <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/40" @click="showEditModal = false" />
        <div class="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl mx-4">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-semibold text-slate-900">Edit Student</h3>
            <button
              @click="showEditModal = false"
              class="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>

          <div v-if="editStudentError" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ editStudentError }}
          </div>

          <form @submit.prevent="submitEditStudent" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
              <input
                v-model="editStudentForm.fullName"
                type="text"
                required
                class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input
                v-model="editStudentForm.email"
                type="email"
                required
                class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Programme / Concentration</label>
              <select
                v-model="editStudentForm.concentration"
                class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              >
                <option value="">Not set</option>
                <option value="Health and Social Wellness Concentration (HSW)">Health and Social Wellness Concentration (HSW)</option>
                <option value="Health Technology and Informatics Concentration (HTI)">Health Technology and Informatics Concentration (HTI)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Pathway</label>
              <select
                v-model="editStudentForm.pathway"
                class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              >
                <option value="">Not set</option>
                <option value="Research-Based">Research-Based</option>
                <option value="Solution-Based">Solution-Based</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input
                v-model="editStudentForm.phone"
                type="tel"
                class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Cohort</label>
              <select
                v-model="editStudentForm.cohort"
                class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              >
                <option value="">Not assigned</option>
                <option v-for="cohort in cohorts" :key="cohort._id" :value="cohort.name">{{ cohort.name }}</option>
              </select>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                @click="showEditModal = false"
                class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="editStudentLoading"
                class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                <span v-if="editStudentLoading" class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                {{ editStudentLoading ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Cohort Modal -->
      <div v-if="showAddCohortModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/40" @click="showAddCohortModal = false" />
        <div class="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl mx-4">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-semibold text-slate-900">Add New Cohort</h3>
            <button @click="showAddCohortModal = false" class="inline-flex items-center justify-center rounded-md p-1 text-slate-400 hover:text-slate-600">
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
          <div v-if="cohortError" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ cohortError }}</div>
          <form @submit.prevent="submitAddCohort" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Cohort Name *</label>
              <input v-model="cohortForm.name" type="text" required placeholder="e.g. 2024-2025" class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Academic Year *</label>
              <input v-model="cohortForm.academicYear" type="text" required placeholder="e.g. 2024/2025" class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea v-model="cohortForm.description" placeholder="Optional description" rows="3" class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select v-model="cohortForm.status" class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60">
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" @click="showAddCohortModal = false" class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" :disabled="cohortLoading" class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
                <span v-if="cohortLoading" class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                {{ cohortLoading ? 'Creating...' : 'Create Cohort' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Cohort Modal -->
      <div v-if="showEditCohortModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/40" @click="showEditCohortModal = false" />
        <div class="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl mx-4">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-semibold text-slate-900">Edit Cohort</h3>
            <button @click="showEditCohortModal = false" class="inline-flex items-center justify-center rounded-md p-1 text-slate-400 hover:text-slate-600">
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
          <div v-if="cohortError" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ cohortError }}</div>
          <form @submit.prevent="submitEditCohort" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Cohort Name *</label>
              <input v-model="cohortForm.name" type="text" required class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Academic Year *</label>
              <input v-model="cohortForm.academicYear" type="text" required class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea v-model="cohortForm.description" rows="3" class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select v-model="cohortForm.status" class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60">
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" @click="showEditCohortModal = false" class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" :disabled="cohortLoading" class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
                <span v-if="cohortLoading" class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                {{ cohortLoading ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- View Cohort Modal -->
      <div v-if="showViewCohortModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/40" @click="showViewCohortModal = false" />
        <div class="relative z-10 w-full max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl mx-4 max-h-[80vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-5 sticky top-0 bg-white pb-4 border-b">
            <div>
              <h3 class="text-lg font-semibold text-slate-900">{{ viewCohortData?.name }}</h3>
              <p class="text-sm text-slate-500">Academic Year: {{ viewCohortData?.academicYear }}</p>
            </div>
            <button @click="showViewCohortModal = false" class="inline-flex items-center justify-center rounded-md p-1 text-slate-400 hover:text-slate-600">
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
          
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-slate-500">Status</p>
                <p class="font-medium">{{ viewCohortData?.status }}</p>
              </div>
              <div>
                <p class="text-slate-500">Total Students</p>
                <p class="font-medium">{{ viewCohortStudents.length }}</p>
              </div>
              <div v-if="viewCohortData?.description" class="col-span-2">
                <p class="text-slate-500">Description</p>
                <p class="font-medium">{{ viewCohortData.description }}</p>
              </div>
            </div>

            <div class="border-t pt-4">
              <h4 class="font-semibold text-slate-900 mb-3">Students in this Cohort</h4>
              <div v-if="viewCohortStudents.length === 0" class="text-center py-6 text-slate-500">
                No students in this cohort yet
              </div>
              <div v-else class="overflow-x-auto">
                <table class="min-w-full text-xs">
                  <thead class="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th scope="col" class="px-4 py-3 text-left font-medium">Name</th>
                      <th scope="col" class="px-4 py-3 text-left font-medium">Email</th>
                      <th scope="col" class="px-4 py-3 text-left font-medium">Programme</th>
                      <th scope="col" class="px-4 py-3 text-left font-medium">Pathway</th>
                      <th scope="col" class="px-4 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200">
                    <tr v-for="student in viewCohortStudents" :key="student.id" class="hover:bg-slate-50">
                      <td class="px-4 py-3">
                        <p class="font-medium text-slate-900">{{ student.name }}</p>
                      </td>
                      <td class="px-4 py-3">
                        <p class="text-slate-600">{{ student.email }}</p>
                      </td>
                      <td class="px-4 py-3">
                        <p class="text-slate-600">{{ student.programme }}</p>
                      </td>
                      <td class="px-4 py-3">
                        <span v-if="student.pathway" class="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-blue-700">
                          {{ student.pathway }}
                        </span>
                        <span v-else class="text-slate-400">—</span>
                      </td>
                      <td class="px-4 py-3">
                        <span :class="[
                          'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs',
                          student.status === 'Active'
                            ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700'
                            : 'border-slate-500/50 bg-slate-50 text-slate-700'
                        ]">
                          <span class="h-1.5 w-1.5 rounded-full" :class="student.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'" />
                          {{ student.status }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t">
              <button @click="showViewCohortModal = false" class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Submissions Modal -->
      <div v-if="showSubmissionsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div class="rounded-lg bg-white shadow-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
          <div class="sticky top-0 border-b bg-white p-5">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-slate-900">Student Submissions</h2>
                <p v-if="selectedStudentSubmissions" class="mt-1 text-sm text-slate-500">
                  {{ selectedStudentSubmissions.studentName }}
                </p>
              </div>
              <button
                @click="showSubmissionsModal = false"
                class="text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>
          </div>

          <div class="p-5">
            <div v-if="submissionsLoading" class="flex items-center justify-center py-8">
              <div class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
            </div>

            <div v-else-if="selectedStudentSubmissions?.submissions?.length === 0" class="text-center py-8">
              <p class="text-sm text-slate-500">No submissions found</p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="sub in selectedStudentSubmissions?.submissions"
                :key="sub.id"
                class="border border-slate-200 rounded-lg p-4"
              >
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <h3 class="font-medium text-slate-900">{{ sub.phase }}</h3>
                    <p class="text-xs text-slate-500 mt-1">
                      Status: 
                      <span
                        :class="[
                          'font-medium',
                          sub.status === 'Submitted' ? 'text-emerald-600' :
                          sub.status === 'Overdue' ? 'text-red-600' :
                          sub.status === 'Not Submitted' ? 'text-slate-500' :
                          'text-blue-600'
                        ]"
                      >
                        {{ sub.status }}
                      </span>
                    </p>
                  </div>
                  <span v-if="sub.submittedAt" class="text-xs text-slate-500">
                    {{ new Date(sub.submittedAt).toLocaleDateString() }}
                  </span>
                </div>

                <div v-if="sub.files?.length > 0" class="mt-3 space-y-2">
                  <p class="text-xs font-medium text-slate-700">Submitted files:</p>
                  <div class="space-y-1">
                    <div
                      v-for="(file, idx) in sub.files"
                      :key="idx"
                      class="flex items-center justify-between bg-slate-50 rounded px-3 py-2 text-xs"
                    >
                      <span class="text-slate-700">{{ file.originalName }}</span>
                      <button
                        @click="downloadFile(file.filename, file.originalName, sub.phase)"
                        class="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>

                <div v-else-if="sub.status === 'Not Submitted'" class="mt-3 text-xs text-slate-500">
                  No files submitted
                </div>

                <div v-else-if="sub.declarationReason" class="mt-3 text-xs text-slate-600 bg-slate-50 p-2 rounded">
                  <p class="font-medium mb-1">Declaration reason:</p>
                  <p>{{ sub.declarationReason }}</p>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-5 border-t mt-5">
              <button
                @click="showSubmissionsModal = false"
                class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bulk Update Modal -->
      <div v-if="showBulkUpdateModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/40" @click="showBulkUpdateModal = false" />
        <div class="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl mx-4">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-semibold text-slate-900">Bulk Update Students</h3>
            <button @click="showBulkUpdateModal = false" class="inline-flex items-center justify-center rounded-md p-1 text-slate-400 hover:text-slate-600">
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
          
          <div v-if="bulkUpdateError" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ bulkUpdateError }}
          </div>

          <form @submit.prevent="submitBulkUpdate" class="space-y-4">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p class="text-sm font-medium text-blue-900">
                Updating {{ selectedStudents.size }} student{{ selectedStudents.size !== 1 ? 's' : '' }}
              </p>
              <p class="text-xs text-blue-700 mt-1">
                Select at least one field to update (you can also select "Not assigned" to clear a field)
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Cohort (Optional)</label>
              <select
                v-model="bulkUpdateForm.cohort"
                @change="bulkUpdateSelected.cohort = true"
                class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              >
                <option value="">-- Not assigned --</option>
                <option v-for="cohort in cohorts" :key="cohort._id" :value="cohort.name">
                  {{ cohort.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Pathway (Optional)</label>
              <select
                v-model="bulkUpdateForm.pathway"
                @change="bulkUpdateSelected.pathway = true"
                class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              >
                <option value="">-- Not assigned --</option>
                <option value="Research-Based">Research-Based</option>
                <option value="Solution-Based">Solution-Based</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Concentration / Programme (Optional)</label>
              <select
                v-model="bulkUpdateForm.concentration"
                @change="bulkUpdateSelected.concentration = true"
                class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              >
                <option value="">-- Not assigned --</option>
                <option value="Health and Social Wellness Concentration (HSW)">Health and Social Wellness Concentration (HSW)</option>
                <option value="Health Technology and Informatics Concentration (HTI)">Health Technology and Informatics Concentration (HTI)</option>
              </select>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                @click="showBulkUpdateModal = false"
                class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="bulkUpdateLoading"
                class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                <span v-if="bulkUpdateLoading" class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                {{ bulkUpdateLoading ? 'Updating...' : `Update ${selectedStudents.size} Student${selectedStudents.size !== 1 ? 's' : ''}` }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
</style>

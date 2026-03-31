<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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

const router = useRouter();
const sidebarOpen = ref(false);
const activeTab = ref('students'); // 'students' or 'cohorts'
const isLoading = ref(false);
const searchQuery = ref('');

interface Student {
  id: string;
  name: string;
  email: string;
  programme: string;
  pathway?: string;
  cohort: string;
  status: string;
}

const students = ref<Student[]>([]);

const cohorts = ref([
  {
    id: 1,
    name: '2024-2025',
    totalStudents: 150,
    academicYear: '2024/2025',
    status: 'Active',
  },
  {
    id: 2,
    name: '2023-2024',
    totalStudents: 148,
    academicYear: '2023/2024',
    status: 'Active',
  },
  {
    id: 3,
    name: '2022-2023',
    totalStudents: 142,
    academicYear: '2022/2023',
    status: 'Archived',
  },
]);

// Add Student Modal
const showAddModal = ref(false);
const addStudentForm = ref({
  fullName: '',
  email: '',
  concentration: '',
  phone: '',
  password: '',
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
});
const editStudentError = ref('');
const editStudentLoading = ref(false);

const fetchStudents = async () => {
  try {
    isLoading.value = true;
    const response = await userService.getUsers({ role: 'Student', limit: 100 });
    students.value = (response.data?.users || []).map((u: any) => ({
      id: u._id,
      name: u.fullName,
      email: u.email,
      programme: u.concentration || 'Not set',
      pathway: u.pathway || '',
      cohort: u.createdAt ? new Date(u.createdAt).getFullYear() + '-' + (new Date(u.createdAt).getFullYear() + 1) : 'Unknown',
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
});

const filteredStudents = computed(() => {
  if (!searchQuery.value.trim()) return students.value;
  const q = searchQuery.value.toLowerCase();
  return students.value.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.email.toLowerCase().includes(q) ||
    s.programme.toLowerCase().includes(q) ||
    s.cohort.toLowerCase().includes(q)
  );
});

const handleBack = () => {
  router.push('/admin');
};

const handleAddStudent = () => {
  addStudentForm.value = { fullName: '', email: '', concentration: '', phone: '', password: '' };
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

const handleAddCohort = () => {
  console.log('Add cohort');
};

const handleEditStudent = (studentId: string) => {
  const student = students.value.find(s => s.id === studentId);
  if (!student) return;
  editStudentId.value = studentId;
  editStudentForm.value = {
    fullName: student.name,
    email: student.email,
    concentration: student.programme === 'Not set' ? '' : student.programme,
    pathway: student.pathway || '',
    phone: '',
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
      concentration: editStudentForm.value.concentration.trim() || undefined,
      pathway: editStudentForm.value.pathway.trim() || undefined,
      phone: editStudentForm.value.phone.trim() || undefined,
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

const handleEditCohort = (cohortId: number) => {
  console.log('Edit cohort', cohortId);
};

const handleDeleteCohort = (cohortId: number) => {
  console.log('Delete cohort', cohortId);
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
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-xs">
            <thead class="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
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
                  Cohort
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
              <tr v-for="student in filteredStudents" :key="student.id" class="hover:bg-slate-50">
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
              <tr v-for="cohort in cohorts" :key="cohort.id" class="hover:bg-slate-50">
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
                      @click="handleEditCohort(cohort.id)"
                      class="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      @click="handleDeleteCohort(cohort.id)"
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
              <input
                v-model="addStudentForm.concentration"
                type="text"
                placeholder="e.g. BSocSc Geography"
                class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              />
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
              <input
                v-model="editStudentForm.concentration"
                type="text"
                class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              />
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
    </main>
  </div>
</template>

<style scoped>
</style>

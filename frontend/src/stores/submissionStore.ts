import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import submissionService, {
  type SubmissionPhase,
} from '../services/submissionService'

export const useSubmissionStore = defineStore('submission', () => {
  // State
  const phases = ref<SubmissionPhase[]>([])
  const selectedPhase = ref<SubmissionPhase | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const uploadProgress = ref(0)

  // Computed
  const submittedCount = computed(() => phases.value.filter(p => p.status === 'Submitted').length)
  const pendingCount = computed(() => phases.value.filter(p => p.status === 'Not Submitted').length)
  const overdueCount = computed(() => phases.value.filter(p => p.status === 'Overdue').length)
  const declaredCount = computed(() => phases.value.filter(p => p.status === 'Declared Not Needed').length)

  const submissionProgress = computed(() => {
    if (phases.value.length === 0) return 0
    return Math.round(
      ((submittedCount.value + declaredCount.value) / phases.value.length) * 100
    )
  })

  // Actions
  async function fetchSubmissionPhases() {
    loading.value = true
    error.value = null
    try {
      const data = await submissionService.getSubmissionPhases()
      phases.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch phases'
      console.error('Error fetching phases:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchSubmissionPhase(phase: string) {
    loading.value = true
    error.value = null
    try {
      const data = await submissionService.getSubmissionPhase(phase)
      selectedPhase.value = data
      // Update in phases array too
      const idx = phases.value.findIndex(p => p.phase === phase)
      if (idx !== -1) {
        phases.value[idx] = data
      }
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch phase'
      console.error('Error fetching phase:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function uploadFile(phase: string, file: File) {
    loading.value = true
    error.value = null
    uploadProgress.value = 0
    try {
      const updated = await submissionService.uploadSubmissionFile(phase, file, progress => {
        uploadProgress.value = progress
      })
      // Update local state
      const idx = phases.value.findIndex(p => p.phase === phase)
      if (idx !== -1) {
        phases.value[idx] = updated
      }
      if (selectedPhase.value?.phase === phase) {
        selectedPhase.value = updated
      }
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'File upload failed'
      console.error('Error uploading file:', err)
      throw err
    } finally {
      loading.value = false
      uploadProgress.value = 0
    }
  }

  async function submitDeclaration(phase: string, reason: string) {
    loading.value = true
    error.value = null
    try {
      const updated = await submissionService.submitDeclaration(phase, reason)
      const idx = phases.value.findIndex(p => p.phase === phase)
      if (idx !== -1) {
        phases.value[idx] = updated
      }
      if (selectedPhase.value?.phase === phase) {
        selectedPhase.value = updated
      }
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to submit declaration'
      console.error('Error submitting declaration:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function undoDeclaration(phase: string) {
    loading.value = true
    error.value = null
    try {
      const updated = await submissionService.undoDeclaration(phase)
      const idx = phases.value.findIndex(p => p.phase === phase)
      if (idx !== -1) {
        phases.value[idx] = updated
      }
      if (selectedPhase.value?.phase === phase) {
        selectedPhase.value = updated
      }
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to undo declaration'
      console.error('Error undoing declaration:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function triggerDownload(phase: string, filename: string, originalName: string) {
    try {
      const blob = await submissionService.downloadFile(phase, filename)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = originalName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to download file'
      console.error('Error downloading file:', err)
      throw err
    }
  }

  function setSelectedPhase(phase: SubmissionPhase | null) {
    selectedPhase.value = phase
  }

  function clearError() {
    error.value = null
  }

  function resetStore() {
    phases.value = []
    selectedPhase.value = null
    loading.value = false
    error.value = null
    uploadProgress.value = 0
  }

  return {
    // State
    phases,
    selectedPhase,
    loading,
    error,
    uploadProgress,

    // Computed
    submittedCount,
    pendingCount,
    overdueCount,
    declaredCount,
    submissionProgress,

    // Actions
    fetchSubmissionPhases,
    fetchSubmissionPhase,
    uploadFile,
    submitDeclaration,
    undoDeclaration,
    triggerDownload,
    setSelectedPhase,
    clearError,
    resetStore,
  }
})

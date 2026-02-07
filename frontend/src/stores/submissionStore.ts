import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import submissionService, {
  type SubmissionPhase,
  type UploadedFile,
  type Declaration,
  type SubmissionComment,
} from '../services/submissionService'

export const useSubmissionStore = defineStore('submission', () => {
  // State
  const phases = ref<SubmissionPhase[]>([])
  const selectedPhase = ref<SubmissionPhase | null>(null)
  const files = ref<UploadedFile[]>([])
  const declarations = ref<Declaration[]>([])
  const feedback = ref<SubmissionComment[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const uploadProgress = ref(0)
  const submissionStats = ref({
    totalPhases: 0,
    submitted: 0,
    pending: 0,
    overdue: 0,
    declared: 0,
    submissionRate: 0,
  })

  // Computed properties
  const submittedCount = computed(() => phases.value.filter(p => p.status === 'submitted').length)
  const pendingCount = computed(() => phases.value.filter(p => p.status === 'not-submitted').length)
  const overdueCount = computed(() => phases.value.filter(p => p.status === 'overdue').length)
  const declaredCount = computed(() => phases.value.filter(p => p.status === 'declared').length)

  const submissionProgress = computed(() => {
    if (phases.value.length === 0) return 0
    return Math.round(
      ((submittedCount.value + declaredCount.value) / phases.value.length) * 100
    )
  })

  const allFilesSize = computed(() => {
    return files.value.reduce((total, file) => total + file.fileSize, 0)
  })

  const allFilesSizeFormatted = computed(() => {
    const mb = allFilesSize.value / 1024 / 1024
    if (mb > 1) return `${mb.toFixed(2)} MB`
    const kb = allFilesSize.value / 1024
    if (kb > 1) return `${kb.toFixed(2)} KB`
    return `${allFilesSize.value} B`
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

  async function fetchSubmissionPhase(phaseId: string) {
    loading.value = true
    error.value = null

    try {
      const phase = await submissionService.getSubmissionPhase(phaseId)
      selectedPhase.value = phase

      // Update in phases array
      const index = phases.value.findIndex(p => p.id === phaseId)
      if (index !== -1) {
        phases.value[index] = phase
      }

      return phase
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch phase'
      console.error('Error fetching phase:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function uploadFile(phaseId: string, file: File) {
    loading.value = true
    error.value = null
    uploadProgress.value = 0

    try {
      const uploaded = await submissionService.uploadSubmissionFile(phaseId, file, progress => {
        uploadProgress.value = progress
      })

      files.value.push(uploaded)

      // Update phase status
      const phase = selectedPhase.value
      if (phase && phase.id === phaseId) {
        phase.status = 'submitted'
        phase.submittedAt = new Date().toISOString()
      }

      return uploaded
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'File upload failed'
      console.error('Error uploading file:', err)
      throw err
    } finally {
      loading.value = false
      uploadProgress.value = 0
    }
  }

  async function fetchSubmissionFiles(phaseId: string) {
    loading.value = true
    error.value = null

    try {
      const data = await submissionService.getSubmissionFiles(phaseId)
      files.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch files'
      console.error('Error fetching files:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteFile(phaseId: string, fileId: string) {
    loading.value = true
    error.value = null

    try {
      await submissionService.deleteSubmissionFile(phaseId, fileId)
      files.value = files.value.filter(f => f.id !== fileId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete file'
      console.error('Error deleting file:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function submitDeclaration(phaseId: string, reason: string, justification: string) {
    loading.value = true
    error.value = null

    try {
      const declaration = await submissionService.submitDeclaration(phaseId, reason, justification)
      declarations.value.push(declaration)

      // Update phase status
      const phase = selectedPhase.value
      if (phase && phase.id === phaseId) {
        phase.status = 'declared'
      }

      const phaseIndex = phases.value.findIndex(p => p.id === phaseId)
      if (phaseIndex !== -1) {
        phases.value[phaseIndex].status = 'declared'
      }

      return declaration
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to submit declaration'
      console.error('Error submitting declaration:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchDeclarations(phaseId: string) {
    loading.value = true
    error.value = null

    try {
      const data = await submissionService.getDeclarations(phaseId)
      declarations.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch declarations'
      console.error('Error fetching declarations:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchFeedback(phaseId: string) {
    loading.value = true
    error.value = null

    try {
      const data = await submissionService.getFeedback(phaseId)
      feedback.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch feedback'
      console.error('Error fetching feedback:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function postComment(phaseId: string, content: string) {
    loading.value = true
    error.value = null

    try {
      const comment = await submissionService.postComment(phaseId, content)
      feedback.value.push(comment)
      return comment
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to post comment'
      console.error('Error posting comment:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchSubmissionStats() {
    try {
      const stats = await submissionService.getSubmissionStats()
      submissionStats.value = stats
      return stats
    } catch (err) {
      console.error('Error fetching submission stats:', err)
    }
  }

  async function downloadFile(phaseId: string, fileId: string, fileName: string) {
    try {
      const blob = await submissionService.downloadFile(phaseId, fileId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
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
    files.value = []
    declarations.value = []
    feedback.value = []
    loading.value = false
    error.value = null
    uploadProgress.value = 0
  }

  return {
    // State
    phases,
    selectedPhase,
    files,
    declarations,
    feedback,
    loading,
    error,
    uploadProgress,
    submissionStats,

    // Computed
    submittedCount,
    pendingCount,
    overdueCount,
    declaredCount,
    submissionProgress,
    allFilesSize,
    allFilesSizeFormatted,

    // Actions
    fetchSubmissionPhases,
    fetchSubmissionPhase,
    uploadFile,
    fetchSubmissionFiles,
    deleteFile,
    submitDeclaration,
    fetchDeclarations,
    fetchFeedback,
    postComment,
    fetchSubmissionStats,
    downloadFile,
    setSelectedPhase,
    clearError,
    resetStore,
  }
})

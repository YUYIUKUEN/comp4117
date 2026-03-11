import httpClient from './httpClient'

export interface SubmissionFile {
  _id?: string
  filename: string
  originalName: string
  mimetype: string
  size: number
  uploadedAt: string
  url: string
}

export interface SubmissionPhase {
  _id: string
  student_id: string
  topic_id: any
  phase: string
  status: string
  submittedAt?: string
  files: SubmissionFile[]
  declarationReason?: string
  declaredAt?: string
  dueDate: string
  createdAt: string
  updatedAt: string
}

export interface UploadedFile {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: string
  url?: string
}

export interface Declaration {
  id: string
  phaseId: string
  reason: string
  justification: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface SubmissionComment {
  id: string
  author: string
  role: 'student' | 'supervisor'
  content: string
  createdAt: string
}

/**
 * Get all submissions for the current student
 */
export async function getSubmissionPhases(): Promise<SubmissionPhase[]> {
  try {
    const response = await httpClient.get('/submissions/my')
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch submissions:', error)
    throw new Error('Unable to load submissions')
  }
}

/**
 * Get a specific submission by phase name (e.g. "Initial Statement")
 */
export async function getSubmissionPhase(phase: string): Promise<SubmissionPhase> {
  try {
    const response = await httpClient.get(`/submissions/${encodeURIComponent(phase)}`)
    return response.data.data
  } catch (error) {
    console.error(`Failed to fetch submission for phase ${phase}:`, error)
    throw new Error('Unable to load submission details')
  }
}

/**
 * Upload a file for a submission phase (phase name, e.g. "Initial Statement")
 */
export async function uploadSubmissionFile(
  phase: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<SubmissionPhase> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await httpClient.post(
      `/submissions/${encodeURIComponent(phase)}/submit`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: event => {
          if (event.total) {
            const progress = Math.round((event.loaded / event.total) * 100)
            onProgress?.(progress)
          }
        },
      }
    )
    return response.data.data
  } catch (error) {
    console.error(`Failed to upload file for phase ${phase}:`, error)
    throw new Error('File upload failed')
  }
}

/**
 * Submit a declaration (document not needed) for a phase
 */
export async function submitDeclaration(
  phase: string,
  reason: string,
  _justification?: string
): Promise<SubmissionPhase> {
  try {
    const response = await httpClient.post(
      `/submissions/${encodeURIComponent(phase)}/declare-not-needed`,
      { reason }
    )
    return response.data.data
  } catch (error) {
    console.error(`Failed to submit declaration for phase ${phase}:`, error)
    throw new Error('Declaration submission failed')
  }
}

/**
 * Undo/revert a declaration for a phase
 */
export async function undoDeclaration(phase: string): Promise<SubmissionPhase> {
  try {
    const response = await httpClient.post(
      `/submissions/${encodeURIComponent(phase)}/undo-declaration`,
      {}
    )
    return response.data.data
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to undo declaration'
    console.error(`Failed to undo declaration for phase ${phase}:`, error)
    throw new Error(message)
  }
}

/**
 * Download a submitted file
 */
export async function downloadFile(phase: string, filename: string): Promise<Blob> {
  try {
    const response = await httpClient.get(
      `/submissions/${encodeURIComponent(phase)}/files/${encodeURIComponent(filename)}`,
      { responseType: 'blob' }
    )
    return response.data
  } catch (error) {
    console.error(`Failed to download file ${filename}:`, error)
    throw new Error('File download failed')
  }
}

/**
 * Delete a submitted file
 */
export async function deleteSubmissionFile(phase: string, filename: string): Promise<{ success: boolean }> {
  try {
    const response = await httpClient.delete(
      `/submissions/${encodeURIComponent(phase)}/files/${encodeURIComponent(filename)}`
    )
    return response.data.data
  } catch (error) {
    console.error(`Failed to delete file ${filename}:`, error)
    throw new Error('File deletion failed')
  }
}

/**
 * Download a student submission file (supervisor access)
 */
export async function downloadSupervisorFile(studentId: string, phase: string, filename: string): Promise<Blob> {
  try {
    const response = await httpClient.get(
      `/submissions/supervisor/student/${encodeURIComponent(studentId)}/${encodeURIComponent(phase)}/files/${encodeURIComponent(filename)}`,
      { responseType: 'blob' }
    )
    return response.data
  } catch (error) {
    console.error(`Failed to download file ${filename}:`, error)
    throw new Error('File download failed')
  }
}

/**
 * Get submission statistics (supervisor)
 */
export async function getSubmissionStats(): Promise<any> {
  try {
    const response = await httpClient.get('/submissions/supervisor/statistics')
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch submission stats:', error)
    throw new Error('Unable to load submission statistics')
  }
}

/**
 * Get a single submission by ID (supervisor)
 */
export async function getSupervisorSubmissionById(submissionId: string): Promise<any> {
  const response = await httpClient.get(`/submissions/supervisor/by-id/${submissionId}`)
  return response.data.data
}

export default {
  getSubmissionPhases,
  getSubmissionPhase,
  uploadSubmissionFile,
  submitDeclaration,
  undoDeclaration,
  downloadFile,
  deleteSubmissionFile,
  downloadSupervisorFile,
  getSubmissionStats,
  getSupervisorSubmissionById,
}

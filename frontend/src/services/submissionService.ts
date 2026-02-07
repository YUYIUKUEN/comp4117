import axios from 'axios'

export interface SubmissionPhase {
  id: string
  name: string
  description: string
  dueDate: string
  status: 'not-submitted' | 'submitted' | 'overdue' | 'declared'
  submittedAt?: string
  feedback?: string
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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

const httpClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add JWT token to requests
httpClient.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Get all submission phases for the current student
 */
export async function getSubmissionPhases(): Promise<SubmissionPhase[]> {
  try {
    const response = await httpClient.get<{ data: SubmissionPhase[] }>('/submissions/phases')
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch submission phases:', error)
    throw new Error('Unable to load submission phases')
  }
}

/**
 * Get a specific submission phase
 */
export async function getSubmissionPhase(phaseId: string): Promise<SubmissionPhase> {
  try {
    const response = await httpClient.get<{ data: SubmissionPhase }>(
      `/submissions/phases/${phaseId}`
    )
    return response.data.data
  } catch (error) {
    console.error(`Failed to fetch submission phase ${phaseId}:`, error)
    throw new Error('Unable to load submission phase details')
  }
}

/**
 * Upload a file for a submission phase
 */
export async function uploadSubmissionFile(
  phaseId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadedFile> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await httpClient.post<{ data: UploadedFile }>(
      `/submissions/phases/${phaseId}/upload`,
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
    console.error(`Failed to upload file for phase ${phaseId}:`, error)
    throw new Error('File upload failed')
  }
}

/**
 * Get files uploaded for a submission phase
 */
export async function getSubmissionFiles(phaseId: string): Promise<UploadedFile[]> {
  try {
    const response = await httpClient.get<{ data: UploadedFile[] }>(
      `/submissions/phases/${phaseId}/files`
    )
    return response.data.data
  } catch (error) {
    console.error(`Failed to fetch files for phase ${phaseId}:`, error)
    throw new Error('Unable to load submitted files')
  }
}

/**
 * Delete a submitted file
 */
export async function deleteSubmissionFile(phaseId: string, fileId: string): Promise<void> {
  try {
    await httpClient.delete(`/submissions/phases/${phaseId}/files/${fileId}`)
  } catch (error) {
    console.error(`Failed to delete file ${fileId}:`, error)
    throw new Error('Failed to delete file')
  }
}

/**
 * Submit a declaration (document not needed)
 */
export async function submitDeclaration(
  phaseId: string,
  reason: string,
  justification: string
): Promise<Declaration> {
  try {
    const response = await httpClient.post<{ data: Declaration }>(
      `/submissions/phases/${phaseId}/declare`,
      {
        reason,
        justification,
      }
    )
    return response.data.data
  } catch (error) {
    console.error(`Failed to submit declaration for phase ${phaseId}:`, error)
    throw new Error('Declaration submission failed')
  }
}

/**
 * Get declaration history for a phase
 */
export async function getDeclarations(phaseId: string): Promise<Declaration[]> {
  try {
    const response = await httpClient.get<{ data: Declaration[] }>(
      `/submissions/phases/${phaseId}/declarations`
    )
    return response.data.data
  } catch (error) {
    console.error(`Failed to fetch declarations for phase ${phaseId}:`, error)
    throw new Error('Unable to load declarations')
  }
}

/**
 * Get supervisor feedback for a phase
 */
export async function getFeedback(phaseId: string): Promise<SubmissionComment[]> {
  try {
    const response = await httpClient.get<{ data: SubmissionComment[] }>(
      `/submissions/phases/${phaseId}/feedback`
    )
    return response.data.data
  } catch (error) {
    console.error(`Failed to fetch feedback for phase ${phaseId}:`, error)
    throw new Error('Unable to load feedback')
  }
}

/**
 * Post a comment on a submission
 */
export async function postComment(phaseId: string, content: string): Promise<SubmissionComment> {
  try {
    const response = await httpClient.post<{ data: SubmissionComment }>(
      `/submissions/phases/${phaseId}/comments`,
      { content }
    )
    return response.data.data
  } catch (error) {
    console.error(`Failed to post comment for phase ${phaseId}:`, error)
    throw new Error('Failed to post comment')
  }
}

/**
 * Poll for status updates on a submission
 */
export async function pollSubmissionStatus(phaseId: string, maxAttempts = 10): Promise<SubmissionPhase> {
  let attempts = 0

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      attempts++

      try {
        const phase = await getSubmissionPhase(phaseId)

        if (phase.status !== 'not-submitted' || attempts >= maxAttempts) {
          clearInterval(interval)
          resolve(phase)
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          clearInterval(interval)
          reject(error)
        }
      }
    }, 2000) // Poll every 2 seconds
  })
}

/**
 * Download a submitted file
 */
export async function downloadFile(phaseId: string, fileId: string): Promise<Blob> {
  try {
    const response = await httpClient.get<Blob>(
      `/submissions/phases/${phaseId}/files/${fileId}/download`,
      {
        responseType: 'blob',
      }
    )
    return response.data
  } catch (error) {
    console.error(`Failed to download file ${fileId}:`, error)
    throw new Error('File download failed')
  }
}

/**
 * Get submission statistics
 */
export async function getSubmissionStats(): Promise<{
  totalPhases: number
  submitted: number
  pending: number
  overdue: number
  declared: number
  submissionRate: number
}> {
  try {
    const response = await httpClient.get<{
      data: {
        totalPhases: number
        submitted: number
        pending: number
        overdue: number
        declared: number
        submissionRate: number
      }
    }>('/submissions/stats')
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch submission stats:', error)
    throw new Error('Unable to load submission statistics')
  }
}

export default {
  getSubmissionPhases,
  getSubmissionPhase,
  uploadSubmissionFile,
  getSubmissionFiles,
  deleteSubmissionFile,
  submitDeclaration,
  getDeclarations,
  getFeedback,
  postComment,
  pollSubmissionStatus,
  downloadFile,
  getSubmissionStats,
}

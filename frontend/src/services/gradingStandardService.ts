import httpClient from './httpClient'

export interface RubricItem {
  title: string
  description?: string
  minScore?: number
  maxScore?: number
  levels?: Array<{ name: string; description?: string; points?: number }>
}

export interface GradingStandard {
  _id: string
  submissionType: string
  gradingSystem: 'point-range' | 'letter-grade' | 'custom'
  pointRange?: { min: number; max: number; step?: number }
  letterGrades?: string[]
  customOptions?: string[]
  description?: string
  dueDate?: string | null
  enabled: boolean
  createdBy?: string
  createdAt: string
  updatedAt: string
  // New fields
  templateName?: string | null
  rubricItems?: RubricItem[]
  hkbuGradingScale?: 'hkbu-standard' | 'hkbu-honors' | 'custom' | null
  gradeRangeMapping?: Array<{ grade: string; minPoints: number; maxPoints: number }>
}

export interface GradingStandardInput {
  submissionType: string
  gradingSystem: 'point-range' | 'letter-grade' | 'custom'
  pointRange?: { min: number; max: number; step?: number }
  letterGrades?: string[]
  customOptions?: string[]
  description?: string
  dueDate?: string | null
  enabled?: boolean
  // New fields
  templateName?: string | null
  rubricItems?: RubricItem[]
  hkbuGradingScale?: 'hkbu-standard' | 'hkbu-honors' | 'custom' | null
  gradeRangeMapping?: Array<{ grade: string; minPoints: number; maxPoints: number }>
}

export default {
  async getAll(enabledOnly = false): Promise<GradingStandard[]> {
    const params = enabledOnly ? { enabledOnly: 'true' } : {}
    const response = await httpClient.get('/grading-standards', { params })
    return response.data.data
  },

  async getById(id: string): Promise<GradingStandard> {
    const response = await httpClient.get(`/grading-standards/${id}`)
    return response.data.data
  },

  async create(data: GradingStandardInput): Promise<GradingStandard> {
    const response = await httpClient.post('/grading-standards', data)
    return response.data.data
  },

  async update(id: string, data: Partial<GradingStandardInput>): Promise<GradingStandard> {
    const response = await httpClient.put(`/grading-standards/${id}`, data)
    return response.data.data
  },

  async delete(id: string): Promise<void> {
    await httpClient.delete(`/grading-standards/${id}`)
  },

  async getBySubmissionType(submissionType: string): Promise<GradingStandard | null> {
    const all = await this.getAll(true)
    return all.find((s) => s.submissionType === submissionType) || null
  },
}

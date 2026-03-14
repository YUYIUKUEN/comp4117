import httpClient from './httpClient'

export interface RubricLevel {
  name: string
  description?: string
  points?: number
}

export interface RubricItem {
  title: string
  description?: string
  minScore?: number
  maxScore?: number
  levels?: RubricLevel[]
}

export interface RubricTemplate {
  _id: string
  name: string
  description?: string
  rubricItems?: RubricItem[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface RubricTemplateInput {
  name: string
  description?: string
  rubricItems?: RubricItem[]
  isDefault?: boolean
}

export default {
  async getAll(): Promise<RubricTemplate[]> {
    const response = await httpClient.get('/rubric-templates')
    return response.data.data
  },

  async getById(id: string): Promise<RubricTemplate> {
    const response = await httpClient.get(`/rubric-templates/${id}`)
    return response.data.data
  },

  async create(data: RubricTemplateInput): Promise<RubricTemplate> {
    const response = await httpClient.post('/rubric-templates', data)
    return response.data.data
  },

  async update(id: string, data: Partial<RubricTemplateInput>): Promise<RubricTemplate> {
    const response = await httpClient.put(`/rubric-templates/${id}`, data)
    return response.data.data
  },

  async delete(id: string): Promise<void> {
    await httpClient.delete(`/rubric-templates/${id}`)
  },
}

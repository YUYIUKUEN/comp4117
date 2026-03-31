import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import topicService from '@/services/topicService'

interface Topic {
  _id: string
  title: string
  description: string
  concentration: string
  pathway?: 'Research-Based' | 'Solution-Based'
  keywords: string[]
  supervisorName: string
  status: string
  maxStudents?: number
  currentApplications?: number
}

interface Filters {
  search: string
  concentration: string
  pathway: string
  page: number
  limit: number
}

export const useTopicStore = defineStore('topic', () => {
  const topics = ref<Topic[]>([])
  const selectedTopic = ref<Topic | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const filters = ref<Filters>({
    search: '',
    concentration: '',
    pathway: '',
    page: 1,
    limit: 10
  })

  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  })

  const concentrations = computed(() => {
    const unique = new Set<string>()
    topics.value.forEach(topic => {
      if (topic.concentration) {
        unique.add(topic.concentration)
      }
    })
    return Array.from(unique).sort()
  })

  const fetchTopics = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await topicService.getTopics({
        page: filters.value.page,
        limit: filters.value.limit,
        search: filters.value.search,
        concentration: filters.value.concentration,
        status: 'Active',
        pathway: filters.value.pathway
      })
      // Response has structure: { data: { topics: [...], pagination: {...} }, status: 200 }
      const resData = response as any
      topics.value = resData.data?.topics || resData.topics || []
      pagination.value = resData.data?.pagination || resData.pagination || { page: 1, limit: 10, total: 0, pages: 1 }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch topics'
      topics.value = []
    } finally {
      loading.value = false
    }
  }

  const fetchTopicById = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await topicService.getTopicById(id)
      // API returns { data: { ...topic }, status: 200 } — unwrap the nested data
      const topic = (response as any).data || response
      // Map supervisor_id.fullName to supervisorName for template compatibility
      if (topic.supervisor_id && typeof topic.supervisor_id === 'object') {
        topic.supervisorName = topic.supervisor_id.fullName || ''
      }
      selectedTopic.value = topic
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch topic'
      selectedTopic.value = null
    } finally {
      loading.value = false
    }
  }

  const searchTopics = async (searchTerm: string) => {
    filters.value.search = searchTerm
    filters.value.page = 1
    await fetchTopics()
  }

  const setConcentrationFilter = async (concentration: string) => {
    filters.value.concentration = concentration
    filters.value.page = 1
    await fetchTopics()
  }

  const setPathwayFilter = async (pathway: string) => {
    filters.value.pathway = pathway
    filters.value.page = 1
    await fetchTopics()
  }

  const setStatusFilter = async (status: string) => {
    // Status filter deprecated, kept for backward compatibility
    filters.value.page = 1
    await fetchTopics()
  }

  const setPage = async (page: number) => {
    filters.value.page = page
    await fetchTopics()
  }

  const applyForTopic = async (topicId: string) => {
    error.value = null
    try {
      const response = await topicService.applyForTopic(topicId)
      // Update local topic if it's the selected one
      if (selectedTopic.value?._id === topicId) {
        if (selectedTopic.value.currentApplications !== undefined) {
          selectedTopic.value.currentApplications += 1
        }
      }
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to apply for topic'
      throw err
    }
  }

  const resetFilters = async () => {
    filters.value = {
      search: '',
      concentration: '',
      pathway: '',
      page: 1,
      limit: 10
    }
    await fetchTopics()
  }

  const clearError = () => {
    error.value = null
  }

  const setSelectedTopic = (topic: Topic | null) => {
    selectedTopic.value = topic
  }

  return {
    // State
    topics,
    selectedTopic,
    loading,
    error,
    filters,
    pagination,
    concentrations,
    // Actions
    fetchTopics,
    fetchTopicById,
    searchTopics,
    setConcentrationFilter,
    setPathwayFilter,
    setStatusFilter,
    setPage,
    applyForTopic,
    resetFilters,
    clearError,
    setSelectedTopic
  }
})

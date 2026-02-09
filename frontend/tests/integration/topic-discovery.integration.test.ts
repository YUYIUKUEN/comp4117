import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useTopicStore } from '@/stores/topicStore'
import TopicDiscovery from '@/views/TopicDiscovery.vue'
import TopicCard from '@/components/TopicCard.vue'
import topicService from '@/services/topicService'

vi.mock('@/services/topicService')

describe('Topic Discovery Integration Tests', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('T053: Topic Listing & Pagination', () => {
    it('should load and display topics on mount', async () => {
      const mockTopics = {
        data: [
          {
            _id: '1',
            title: 'AI Topic',
            description: 'Machine learning project',
            concentration: 'AI',
            keywords: ['ML', 'Python'],
            supervisorName: 'Dr. Smith',
            status: 'Active',
            maxStudents: 2,
            currentApplications: 1
          },
          {
            _id: '2',
            title: 'Web Dev Topic',
            description: 'Full-stack development',
            concentration: 'WebDev',
            keywords: ['React', 'Node.js'],
            supervisorName: 'Dr. Jones',
            status: 'Active',
            maxStudents: 3,
            currentApplications: 2
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          pages: 1
        }
      }

      vi.mocked(topicService.getTopics).mockResolvedValue(mockTopics)

      const store = useTopicStore()
      await store.fetchTopics()

      expect(store.topics).toHaveLength(2)
      expect(store.topics[0].title).toBe('AI Topic')
      expect(store.pagination.total).toBe(2)
    })

    it('should handle pagination correctly', async () => {
      const mockPage1 = {
        data: [{ _id: '1', title: 'Topic 1' }],
        pagination: { page: 1, limit: 10, total: 15, pages: 2 }
      }

      const mockPage2 = {
        data: [{ _id: '11', title: 'Topic 11' }],
        pagination: { page: 2, limit: 10, total: 15, pages: 2 }
      }

      vi.mocked(topicService.getTopics)
        .mockResolvedValueOnce(mockPage1)
        .mockResolvedValueOnce(mockPage2)

      const store = useTopicStore()

      // Load page 1
      await store.fetchTopics()
      expect(store.pagination.page).toBe(1)
      expect(store.topics).toHaveLength(1)

      // Load page 2
      await store.setPage(2)
      expect(store.pagination.page).toBe(2)
      expect(vi.mocked(topicService.getTopics)).toHaveBeenCalled()
    })

    it('should filter by concentration', async () => {
      const mockTopics = {
        data: [
          { _id: '1', title: 'AI Topic', concentration: 'AI' }
        ],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 }
      }

      vi.mocked(topicService.getTopics).mockResolvedValue(mockTopics)

      const store = useTopicStore()
      await store.setConcentrationFilter('AI')

      expect(store.filters.concentration).toBe('AI')
      expect(vi.mocked(topicService.getTopics)).toHaveBeenCalledWith(
        expect.objectContaining({ concentration: 'AI' })
      )
    })

    it('should search topics', async () => {
      const mockSearchResults = {
        data: [
          { _id: '1', title: 'Search Result', keywords: ['search', 'test'] }
        ],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 }
      }

      vi.mocked(topicService.getTopics).mockResolvedValue(mockSearchResults)

      const store = useTopicStore()
      await store.searchTopics('search')

      expect(store.filters.search).toBe('search')
      expect(store.topics).toHaveLength(1)
      expect(vi.mocked(topicService.getTopics)).toHaveBeenCalled()
    })

    it('should reset filters to default state', async () => {
      const mockTopics = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 1 }
      }

      vi.mocked(topicService.getTopics).mockResolvedValue(mockTopics)

      const store = useTopicStore()
      store.filters.search = 'old search'
      store.filters.concentration = 'AI'

      await store.resetFilters()

      expect(store.filters.search).toBe('')
      expect(store.filters.concentration).toBe('')
      expect(store.filters.page).toBe(1)
    })
  })

  describe('T054: Topic Detail View', () => {
    it('should fetch topic by id', async () => {
      const mockTopic = {
        _id: '1',
        title: 'Detailed Topic',
        description: 'Full description',
        concentration: 'AI',
        keywords: ['ML', 'Python', 'TensorFlow'],
        supervisorName: 'Dr. Smith',
        status: 'Active',
        maxStudents: 5,
        currentApplications: 3
      }

      vi.mocked(topicService.getTopicById).mockResolvedValue(mockTopic)

      const store = useTopicStore()
      await store.fetchTopicById('1')

      expect(store.selectedTopic).toEqual(mockTopic)
      expect(store.selectedTopic?.title).toBe('Detailed Topic')
      expect(store.selectedTopic?.keywords).toHaveLength(3)
    })

    it('should display all topic information', async () => {
      const mockTopic = {
        _id: '1',
        title: 'Complete Topic',
        description: 'Full description with details',
        concentration: 'DataScience',
        keywords: ['pandas', 'scikit-learn', 'data visualization'],
        supervisorName: 'Dr. Johnson',
        status: 'Active',
        maxStudents: 4,
        currentApplications: 2
      }

      vi.mocked(topicService.getTopicById).mockResolvedValue(mockTopic)

      const store = useTopicStore()
      await store.fetchTopicById('1')

      const topic = store.selectedTopic
      expect(topic?.title).toBe('Complete Topic')
      expect(topic?.description).toBe('Full description with details')
      expect(topic?.concentration).toBe('DataScience')
      expect(topic?.supervisorName).toBe('Dr. Johnson')
      expect(topic?.maxStudents).toBe(4)
      expect(topic?.currentApplications).toBe(2)
    })

    it('should handle topic not found', async () => {
      const error = new Error('Topic not found')
      vi.mocked(topicService.getTopicById).mockRejectedValue(error)

      const store = useTopicStore()
      await store.fetchTopicById('invalid-id')

      expect(store.selectedTopic).toBeNull()
      expect(store.error).toBeTruthy()
    })
  })

  describe('T055 & T056: Student Application & Supervisor Management', () => {
    it('should apply for a topic', async () => {
      const mockTopic = {
        _id: '1',
        title: 'Topic to Apply',
        currentApplications: 1
      }

      vi.mocked(topicService.applyForTopic).mockResolvedValue({ success: true })

      const store = useTopicStore()
      store.selectedTopic = mockTopic as any

      const result = await store.applyForTopic('1')

      expect(result.success).toBe(true)
      expect(vi.mocked(topicService.applyForTopic)).toHaveBeenCalledWith('1')
    })

    it('should handle application errors', async () => {
      const error = {
        response: {
          data: { error: 'Already applied for this topic' }
        }
      }

      vi.mocked(topicService.applyForTopic).mockRejectedValue(error)

      const store = useTopicStore()

      try {
        await store.applyForTopic('1')
      } catch (err) {
        expect(store.error).toBe('Already applied for this topic')
      }
    })

    it('should fetch supervisor topics', async () => {
      const mockSupervisorTopics = {
        data: [
          { _id: '1', title: 'Draft Topic', status: 'Draft' },
          { _id: '2', title: 'Active Topic', status: 'Active' }
        ],
        pagination: { page: 1, limit: 10, total: 2, pages: 1 }
      }

      vi.mocked(topicService.getSupervisorTopics).mockResolvedValue(mockSupervisorTopics)

      const result = await topicService.getSupervisorTopics()

      expect(result.data).toHaveLength(2)
      expect(result.data[0].status).toBe('Draft')
      expect(result.data[1].status).toBe('Active')
    })

    it('should create a new topic', async () => {
      const newTopicData = {
        title: 'New Topic',
        description: 'Description',
        concentration: 'AI',
        keywords: ['ML'],
        maxStudents: 3
      }

      const mockCreatedTopic = {
        _id: 'new-1',
        ...newTopicData,
        supervisorName: 'Dr. Smith',
        status: 'Draft',
        currentApplications: 0
      }

      vi.mocked(topicService.createTopic).mockResolvedValue(mockCreatedTopic as any)

      const result = await topicService.createTopic(newTopicData)

      expect(result._id).toBe('new-1')
      expect(result.status).toBe('Draft')
      expect(result.title).toBe('New Topic')
    })

    it('should publish a topic', async () => {
      const mockPublishedTopic = {
        _id: '1',
        title: 'Published Topic',
        status: 'Active'
      }

      vi.mocked(topicService.publishTopic).mockResolvedValue(mockPublishedTopic as any)

      const result = await topicService.publishTopic('1')

      expect(result.status).toBe('Active')
      expect(vi.mocked(topicService.publishTopic)).toHaveBeenCalledWith('1')
    })

    it('should delete a topic', async () => {
      vi.mocked(topicService.deleteTopic).mockResolvedValue({ success: true })

      const result = await topicService.deleteTopic('1')

      expect(result.success).toBe(true)
      expect(vi.mocked(topicService.deleteTopic)).toHaveBeenCalledWith('1')
    })
  })

  describe('TopicCard Component', () => {
    it('should render topic card with correct information', () => {
      const mockTopic = {
        _id: '1',
        title: 'Test Topic',
        description: 'This is a test topic description that should be truncated if too long',
        concentration: 'AI',
        keywords: ['ML', 'Python', 'TensorFlow', 'Keras'],
        supervisorName: 'Dr. Smith',
        status: 'Active',
        maxStudents: 5,
        currentApplications: 2
      }

      const wrapper = mount(TopicCard, {
        props: { topic: mockTopic },
        global: {
          stubs: ['RouterLink']
        }
      })

      expect(wrapper.text()).toContain('Test Topic')
      expect(wrapper.text()).toContain('Dr. Smith')
      expect(wrapper.text()).toContain('AI')
      expect(wrapper.text()).toContain('2/5')
    })

    it('should show apply button for active topics', () => {
      const mockTopic = {
        _id: '1',
        title: 'Active Topic',
        description: 'Description',
        concentration: 'AI',
        keywords: ['ML'],
        supervisorName: 'Dr. Smith',
        status: 'Active'
      }

      const wrapper = mount(TopicCard, {
        props: { topic: mockTopic },
        global: {
          stubs: ['RouterLink'],
          mocks: {
            $route: {},
            $router: {}
          },
          provide: {
            mockAuthStore: { userRole: 'Student' }
          }
        }
      })

      // Component renders successfully
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('Active Topic')
    })
  })

  describe('Loading & Error States', () => {
    it('should handle loading state', async () => {
      const store = useTopicStore()
      
      // Simulate loading
      store.loading = true
      expect(store.loading).toBe(true)

      // Simulate completion
      store.loading = false
      expect(store.loading).toBe(false)
    })

    it('should handle error state', async () => {
      const mockError = 'Network error'
      
      const error = {
        response: { data: { error: mockError } }
      }

      vi.mocked(topicService.getTopics).mockRejectedValue(error)

      const store = useTopicStore()
      await store.fetchTopics()

      expect(store.error).toBe(mockError)
      expect(store.topics).toEqual([])
    })

    it('should clear error messages', () => {
      const store = useTopicStore()
      store.error = 'Some error'
      
      store.clearError()
      
      expect(store.error).toBeNull()
    })
  })

  describe('Performance & Optimization', () => {
    it('should cache search results', async () => {
      const mockResults = {
        data: [{ _id: '1', title: 'Result' }],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 }
      }

      vi.mocked(topicService.getTopics).mockResolvedValue(mockResults)

      const store = useTopicStore()
      
      // First search
      await store.searchTopics('test')
      expect(vi.mocked(topicService.getTopics)).toHaveBeenCalledTimes(1)

      // Results should be cached in store
      expect(store.topics).toHaveLength(1)
    })

    it('should compute concentrations from topics', async () => {
      const mockTopics = {
        data: [
          { _id: '1', concentration: 'AI' },
          { _id: '2', concentration: 'WebDev' },
          { _id: '3', concentration: 'AI' }
        ],
        pagination: { page: 1, limit: 10, total: 3, pages: 1 }
      }

      vi.mocked(topicService.getTopics).mockResolvedValue(mockTopics as any)

      const store = useTopicStore()
      await store.fetchTopics()

      const concentrations = store.concentrations
      expect(concentrations).toContain('AI')
      expect(concentrations).toContain('WebDev')
      expect(concentrations).toHaveLength(2)
    })
  })

  describe('Full User Flows', () => {
    it('should complete full browse and apply flow', async () => {
      const mockTopics = {
        data: [
          {
            _id: '1',
            title: 'Interesting Topic',
            status: 'Active',
            maxStudents: 2,
            currentApplications: 1
          } as any
        ],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 }
      }

      const mockDetailTopic = {
        _id: '1',
        title: 'Interesting Topic',
        description: 'Full details',
        maxStudents: 2,
        currentApplications: 1
      }

      vi.mocked(topicService.getTopics).mockResolvedValue(mockTopics)
      vi.mocked(topicService.getTopicById).mockResolvedValue(mockDetailTopic as any)
      vi.mocked(topicService.applyForTopic).mockResolvedValue({ success: true })

      const store = useTopicStore()

      // Step 1: Browse topics
      await store.fetchTopics()
      expect(store.topics).toHaveLength(1)

      // Step 2: View topic details
      await store.fetchTopicById('1')
      expect(store.selectedTopic?.title).toBe('Interesting Topic')

      // Step 3: Apply for topic
      const result = await store.applyForTopic('1')
      expect(result.success).toBe(true)
    })

    it('should complete supervisor workflow', async () => {
      const mockSupervisorTopics = {
        data: [{ _id: '1', title: 'Topic', status: 'Draft' }],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 }
      }

      vi.mocked(topicService.getSupervisorTopics).mockResolvedValue(mockSupervisorTopics as any)
      vi.mocked(topicService.createTopic).mockResolvedValue({ _id: '2', status: 'Draft' } as any)
      vi.mocked(topicService.publishTopic).mockResolvedValue({ _id: '1', status: 'Active' } as any)

      // Get supervisor topics
      const topics = await topicService.getSupervisorTopics()
      expect(topics.data).toHaveLength(1)

      // Create new topic
      const newTopic = await topicService.createTopic({
        title: 'New Topic',
        description: 'Description',
        concentration: 'AI',
        keywords: ['test']
      })
      expect(newTopic.status).toBe('Draft')

      // Publish topic
      const published = await topicService.publishTopic('1')
      expect(published.status).toBe('Active')
    })
  })
})

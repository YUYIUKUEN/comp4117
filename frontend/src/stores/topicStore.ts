import { defineStore } from 'pinia';
import { ref } from 'vue';

interface Topic {
  id: string;
  title: string;
  description: string;
  supervisor: string;
}

interface Filters {
  search?: string;
  concentration?: string;
}

export const useTopicStore = defineStore('topic', () => {
  const topics = ref<Topic[]>([]);
  const selectedTopic = ref<Topic | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref<Filters>({});

  const setTopics = (newTopics: Topic[]) => {
    topics.value = newTopics;
  };

  const setSelectedTopic = (topic: Topic | null) => {
    selectedTopic.value = topic;
  };

  const updateFilters = (newFilters: Filters) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  const fetchTopics = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Placeholder for API integration
      // const response = await apiClient.get('/topics', { params: filters.value });
      // topics.value = response.data;
      topics.value = [];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch topics';
    } finally {
      loading.value = false;
    }
  };

  return {
    topics,
    selectedTopic,
    loading,
    error,
    filters,
    setTopics,
    setSelectedTopic,
    updateFilters,
    fetchTopics
  };
});

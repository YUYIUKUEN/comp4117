import client from './httpClient';

interface Topic {
  id: string;
  title: string;
  description: string;
  supervisor: string;
}

const topicService = {
  getTopics() {
    return client.get<Topic[]>('/topics');
  },
  getTopic(id: string) {
    return client.get<Topic>(`/topics/${id}`);
  },
  createTopic(data: Omit<Topic, 'id'>) {
    return client.post<Topic>('/topics', data);
  },
  updateTopic(id: string, data: Partial<Topic>) {
    return client.patch<Topic>(`/topics/${id}`, data);
  },
  deleteTopic(id: string) {
    return client.delete(`/topics/${id}`);
  }
};

export default topicService;

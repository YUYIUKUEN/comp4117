import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TopicManagementWidget from '../TopicManagementWidget.vue'

describe('TopicManagementWidget', () => {
  it('renders topic information', () => {
    const topic = {
      _id: '1',
      title: 'Machine Learning',
      description: 'Learn ML fundamentals',
      capacity: 5,
      applications: 3,
    }

    const wrapper = mount(TopicManagementWidget, {
      props: { topic },
    })

    expect(wrapper.text()).toContain('Machine Learning')
    expect(wrapper.text()).toContain('Learn ML fundamentals')
  })

  it('displays application count', () => {
    const topic = {
      _id: '1',
      title: 'Machine Learning',
      description: 'Learn ML fundamentals',
      capacity: 5,
      applications: 3,
    }

    const wrapper = mount(TopicManagementWidget, {
      props: { topic },
    })

    expect(wrapper.text()).toContain('3/5')
  })

  it('displays progress bar', () => {
    const topic = {
      _id: '1',
      title: 'Machine Learning',
      description: 'Learn ML fundamentals',
      capacity: 5,
      applications: 3,
    }

    const wrapper = mount(TopicManagementWidget, {
      props: { topic },
    })

    expect(wrapper.find('.progress-bar').exists()).toBe(true)
  })

  it('renders action buttons', () => {
    const topic = {
      _id: '1',
      title: 'Machine Learning',
      description: 'Learn ML fundamentals',
      capacity: 5,
      applications: 3,
    }

    const wrapper = mount(TopicManagementWidget, {
      props: { topic },
    })

    const buttons = wrapper.findAll('.btn-secondary')
    expect(buttons.length).toBeGreaterThan(0)
  })
})

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ActivityLogWidget from '../ActivityLogWidget.vue'

describe('ActivityLogWidget', () => {
  it('renders empty state when no activities', () => {
    const wrapper = mount(ActivityLogWidget, {
      props: { activities: [] },
    })

    expect(wrapper.text()).toContain('No activities recorded')
  })

  it('renders list of activities', () => {
    const activities = [
      {
        _id: '1',
        description: 'Assignment submitted',
        createdAt: new Date().toISOString(),
      },
    ]

    const wrapper = mount(ActivityLogWidget, {
      props: { activities },
    })

    expect(wrapper.text()).toContain('Assignment submitted')
  })

  it('displays activity timeline dots', () => {
    const activities = [
      {
        _id: '1',
        description: 'Assignment submitted',
        createdAt: new Date().toISOString(),
      },
    ]

    const wrapper = mount(ActivityLogWidget, {
      props: { activities },
    })

    expect(wrapper.find('.activity-dot').exists()).toBe(true)
  })

  it('formats activity timestamps correctly', () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const activities = [
      {
        _id: '1',
        description: 'Assignment submitted',
        createdAt: oneHourAgo.toISOString(),
      },
    ]

    const wrapper = mount(ActivityLogWidget, {
      props: { activities },
    })

    expect(wrapper.text()).toContain('ago')
  })

  it('displays multiple activities', () => {
    const activities = [
      {
        _id: '1',
        description: 'Activity 1',
        createdAt: new Date().toISOString(),
      },
      {
        _id: '2',
        description: 'Activity 2',
        createdAt: new Date().toISOString(),
      },
    ]

    const wrapper = mount(ActivityLogWidget, {
      props: { activities },
    })

    expect(wrapper.findAll('.activity-entry')).toHaveLength(2)
  })
})

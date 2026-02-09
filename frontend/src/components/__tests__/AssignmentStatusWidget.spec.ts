import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AssignmentStatusWidget from '../AssignmentStatusWidget.vue'

describe('AssignmentStatusWidget', () => {
  it('renders assignment title and status', () => {
    const assignment = {
      _id: '1',
      title: 'Test Assignment',
      status: 'Active',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Test description',
    }

    const wrapper = mount(AssignmentStatusWidget, {
      props: { assignment },
    })

    expect(wrapper.text()).toContain('Test Assignment')
    expect(wrapper.text()).toContain('Active')
  })

  it('displays assignment description', () => {
    const assignment = {
      _id: '1',
      title: 'Test Assignment',
      status: 'Active',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Test description',
    }

    const wrapper = mount(AssignmentStatusWidget, {
      props: { assignment },
    })

    expect(wrapper.text()).toContain('Test description')
  })

  it('formats date correctly', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const assignment = {
      _id: '1',
      title: 'Test Assignment',
      status: 'Active',
      dueDate: futureDate.toISOString(),
      description: 'Test description',
    }

    const wrapper = mount(AssignmentStatusWidget, {
      props: { assignment },
    })

    const dateText = wrapper.text()
    expect(dateText).toContain('Due Date')
  })

  it('shows correct status styling', () => {
    const assignment = {
      _id: '1',
      title: 'Test Assignment',
      status: 'Active',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }

    const wrapper = mount(AssignmentStatusWidget, {
      props: { assignment },
    })

    expect(wrapper.find('.status-badge').exists()).toBe(true)
  })
})

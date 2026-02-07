import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ApplicationsWidget from '../ApplicationsWidget.vue'

describe('ApplicationsWidget', () => {
  it('renders empty state when no applications', () => {
    const wrapper = mount(ApplicationsWidget, {
      props: { applications: [] },
    })

    expect(wrapper.text()).toContain('No applications')
  })

  it('renders list of applications', () => {
    const applications = [
      {
        _id: '1',
        studentName: 'John Doe',
        topicTitle: 'Machine Learning',
        status: 'pending',
        submittedDate: new Date().toISOString(),
      },
    ]

    const wrapper = mount(ApplicationsWidget, {
      props: { applications },
    })

    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('Machine Learning')
  })

  it('displays application status badge', () => {
    const applications = [
      {
        _id: '1',
        studentName: 'John Doe',
        topicTitle: 'Machine Learning',
        status: 'pending',
        submittedDate: new Date().toISOString(),
      },
    ]

    const wrapper = mount(ApplicationsWidget, {
      props: { applications },
    })

    expect(wrapper.text()).toContain('pending')
  })

  it('renders approve and reject buttons', () => {
    const applications = [
      {
        _id: '1',
        studentName: 'John Doe',
        topicTitle: 'Machine Learning',
        status: 'pending',
        submittedDate: new Date().toISOString(),
      },
    ]

    const wrapper = mount(ApplicationsWidget, {
      props: { applications },
    })

    const buttons = wrapper.findAll('.btn-small')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })
})

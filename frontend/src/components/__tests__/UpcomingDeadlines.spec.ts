import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UpcomingDeadlines from '../UpcomingDeadlines.vue'

describe('UpcomingDeadlines', () => {
  it('renders empty state when no deadlines', () => {
    const wrapper = mount(UpcomingDeadlines, {
      props: { deadlines: [] },
    })

    expect(wrapper.text()).toContain('No upcoming deadlines')
  })

  it('renders list of deadlines', () => {
    const deadlines = [
      {
        _id: '1',
        title: 'Assignment 1',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'assignment',
      },
      {
        _id: '2',
        title: 'Project 1',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'project',
      },
    ]

    const wrapper = mount(UpcomingDeadlines, {
      props: { deadlines },
    })

    expect(wrapper.text()).toContain('Assignment 1')
    expect(wrapper.text()).toContain('Project 1')
  })

  it('sorts deadlines by due date', () => {
    const futureDate1 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const futureDate2 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

    const deadlines = [
      {
        _id: '1',
        title: 'Assignment 1',
        dueDate: futureDate1.toISOString(),
        type: 'assignment',
      },
      {
        _id: '2',
        title: 'Project 1',
        dueDate: futureDate2.toISOString(),
        type: 'project',
      },
    ]

    const wrapper = mount(UpcomingDeadlines, {
      props: { deadlines },
    })

    const items = wrapper.findAll('.deadline-item')
    expect(items.length).toBeGreaterThanOrEqual(2)
    expect(items[0]?.text()).toContain('Project 1')
    expect(items[1]?.text()).toContain('Assignment 1')
  })

  it('displays deadline type badge', () => {
    const deadlines = [
      {
        _id: '1',
        title: 'Assignment 1',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'assignment',
      },
    ]

    const wrapper = mount(UpcomingDeadlines, {
      props: { deadlines },
    })

    expect(wrapper.text()).toContain('assignment')
  })
})

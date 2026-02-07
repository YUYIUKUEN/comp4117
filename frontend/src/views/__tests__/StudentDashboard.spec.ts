import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import StudentDashboard from '../StudentDashboard.vue'

describe('StudentDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard header', async () => {
    const wrapper = mount(StudentDashboard)
    await flushPromises()

    expect(wrapper.text()).toContain('Student Dashboard')
    expect(wrapper.text()).toContain('Welcome')
  })

  it('displays loading state initially', () => {
    const wrapper = mount(StudentDashboard)

    expect(wrapper.text()).toContain('Loading dashboard')
  })

  it('renders dashboard sections after loading', async () => {
    const wrapper = mount(StudentDashboard)
    await flushPromises()

    await new Promise(resolve => setTimeout(resolve, 600))

    expect(wrapper.text()).toContain('Your Assignments')
    expect(wrapper.text()).toContain('Upcoming Deadlines')
    expect(wrapper.text()).toContain('Recent Activity')
    expect(wrapper.text()).toContain('Submission Status')
  })

  it('displays quick actions menu', async () => {
    const wrapper = mount(StudentDashboard)
    await flushPromises()

    expect(wrapper.text()).toContain('View Submissions')
    expect(wrapper.text()).toContain('Browse Topics')
  })

  it('displays assignment widgets', async () => {
    const wrapper = mount(StudentDashboard)
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 600))

    expect(wrapper.find('.assignment-status-widget').exists()).toBe(true)
  })

  it('displays submission statistics', async () => {
    const wrapper = mount(StudentDashboard)
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 600))

    expect(wrapper.text()).toContain('Total Submissions')
    expect(wrapper.text()).toContain('Submitted')
  })
})

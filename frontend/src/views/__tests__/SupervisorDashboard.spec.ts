import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SupervisorDashboard from '../SupervisorDashboard.vue'

describe('SupervisorDashboard', () => {
  it('renders supervisor dashboard header', async () => {
    const wrapper = mount(SupervisorDashboard)
    await flushPromises()

    expect(wrapper.text()).toContain('Supervisor Dashboard')
  })

  it('displays loading state', () => {
    const wrapper = mount(SupervisorDashboard)

    expect(wrapper.text()).toContain('Loading dashboard')
  })

  it('renders dashboard sections after loading', async () => {
    const wrapper = mount(SupervisorDashboard)
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 600))

    expect(wrapper.text()).toContain('Your Topics')
    expect(wrapper.text()).toContain('Applications')
    expect(wrapper.text()).toContain('Feedback Tracking')
    expect(wrapper.text()).toContain('Recent Activity')
    expect(wrapper.text()).toContain('Statistics')
  })

  it('displays supervisor quick actions', async () => {
    const wrapper = mount(SupervisorDashboard)
    await flushPromises()

    expect(wrapper.text()).toContain('Create Topic')
    expect(wrapper.text()).toContain('Manage Applications')
  })

  it('displays statistics cards', async () => {
    const wrapper = mount(SupervisorDashboard)
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 600))

    expect(wrapper.text()).toContain('Total Topics')
    expect(wrapper.text()).toContain('Pending Applications')
    expect(wrapper.text()).toContain('Active Students')
  })
})

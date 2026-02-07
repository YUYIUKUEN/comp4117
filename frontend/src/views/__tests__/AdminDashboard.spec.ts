import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AdminDashboard from '../AdminDashboard.vue'

describe('AdminDashboard', () => {
  it('renders admin dashboard header', async () => {
    const wrapper = mount(AdminDashboard)
    await flushPromises()

    expect(wrapper.text()).toContain('Admin Dashboard')
    expect(wrapper.text()).toContain('System Overview')
  })

  it('displays loading state', () => {
    const wrapper = mount(AdminDashboard)

    expect(wrapper.text()).toContain('Loading dashboard')
  })

  it('renders all sections after loading', async () => {
    const wrapper = mount(AdminDashboard)
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 600))

    expect(wrapper.text()).toContain('System Statistics')
    expect(wrapper.text()).toContain('User Management')
    expect(wrapper.text()).toContain('System Activity')
    expect(wrapper.text()).toContain('Topic Moderation')
  })

  it('displays admin quick actions', async () => {
    const wrapper = mount(AdminDashboard)
    await flushPromises()

    expect(wrapper.text()).toContain('Manage Users')
    expect(wrapper.text()).toContain('Moderate Topics')
    expect(wrapper.text()).toContain('View Reports')
  })

  it('displays system statistics', async () => {
    const wrapper = mount(AdminDashboard)
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 600))

    expect(wrapper.text()).toContain('Total Users')
    expect(wrapper.text()).toContain('Total Topics')
    expect(wrapper.text()).toContain('Total Submissions')
    expect(wrapper.text()).toContain('Active Users')
  })
})

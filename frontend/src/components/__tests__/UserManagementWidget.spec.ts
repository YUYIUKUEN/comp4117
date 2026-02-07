import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UserManagementWidget from '../UserManagementWidget.vue'

describe('UserManagementWidget', () => {
  it('renders empty state when no users', () => {
    const wrapper = mount(UserManagementWidget, {
      props: { users: [] },
    })

    expect(wrapper.text()).toContain('No users')
  })

  it('renders list of users', () => {
    const users = [
      {
        _id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'student',
        createdAt: new Date().toISOString(),
        status: 'active',
      },
    ]

    const wrapper = mount(UserManagementWidget, {
      props: { users },
    })

    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('john@example.com')
  })

  it('displays user role badge', () => {
    const users = [
      {
        _id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'student',
        createdAt: new Date().toISOString(),
        status: 'active',
      },
    ]

    const wrapper = mount(UserManagementWidget, {
      props: { users },
    })

    expect(wrapper.text()).toContain('student')
  })

  it('displays user status badge', () => {
    const users = [
      {
        _id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'student',
        createdAt: new Date().toISOString(),
        status: 'active',
      },
    ]

    const wrapper = mount(UserManagementWidget, {
      props: { users },
    })

    expect(wrapper.text()).toContain('active')
  })

  it('renders action buttons', () => {
    const users = [
      {
        _id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'student',
        createdAt: new Date().toISOString(),
        status: 'active',
      },
    ]

    const wrapper = mount(UserManagementWidget, {
      props: { users },
    })

    expect(wrapper.findAll('.btn-action').length).toBeGreaterThan(0)
  })
})

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SystemStatsWidget from '../SystemStatsWidget.vue'

describe('SystemStatsWidget', () => {
  it('renders all system statistics', () => {
    const stats = {
      totalUsers: 42,
      totalTopics: 15,
      totalSubmissions: 87,
      activeUsers: 28,
    }

    const wrapper = mount(SystemStatsWidget, {
      props: { stats },
    })

    expect(wrapper.text()).toContain('Total Users')
    expect(wrapper.text()).toContain('42')
    expect(wrapper.text()).toContain('Total Topics')
    expect(wrapper.text()).toContain('15')
  })

  it('displays statistics values correctly', () => {
    const stats = {
      totalUsers: 100,
      totalTopics: 50,
      totalSubmissions: 200,
      activeUsers: 75,
    }

    const wrapper = mount(SystemStatsWidget, {
      props: { stats },
    })

    expect(wrapper.text()).toContain('100')
    expect(wrapper.text()).toContain('50')
    expect(wrapper.text()).toContain('200')
    expect(wrapper.text()).toContain('75')
  })

  it('renders stat cards', () => {
    const stats = {
      totalUsers: 42,
      totalTopics: 15,
      totalSubmissions: 87,
      activeUsers: 28,
    }

    const wrapper = mount(SystemStatsWidget, {
      props: { stats },
    })

    expect(wrapper.findAll('.stat-card')).toHaveLength(4)
  })
})

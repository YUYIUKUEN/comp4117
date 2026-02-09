import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuickActionsMenu from '../QuickActionsMenu.vue'

describe('QuickActionsMenu', () => {
  it('renders action buttons', () => {
    const actions = [
      { id: 'action1', label: 'Action 1', icon: 'icon1' },
      { id: 'action2', label: 'Action 2', icon: 'icon2' },
    ]

    const wrapper = mount(QuickActionsMenu, {
      props: { actions },
    })

    expect(wrapper.text()).toContain('Action 1')
    expect(wrapper.text()).toContain('Action 2')
  })

  it('emits action event when button clicked', async () => {
    const actions = [
      { id: 'action1', label: 'Action 1', icon: 'icon1' },
    ]

    const wrapper = mount(QuickActionsMenu, {
      props: { actions },
    })

    await wrapper.find('.action-button').trigger('click')

    expect(wrapper.emitted('action')).toBeTruthy()
    expect(wrapper.emitted('action')?.[0]).toEqual(['action1'])
  })

  it('renders empty menu with no actions', () => {
    const wrapper = mount(QuickActionsMenu, {
      props: { actions: [] },
    })

    expect(wrapper.findAll('.action-button')).toHaveLength(0)
  })

  it('displays icons and labels correctly', () => {
    const actions = [
      { id: 'action1', label: 'View Submissions', icon: 'clipboard-list' },
    ]

    const wrapper = mount(QuickActionsMenu, {
      props: { actions },
    })

    expect(wrapper.text()).toContain('clipboard-list')
    expect(wrapper.text()).toContain('View Submissions')
  })
})

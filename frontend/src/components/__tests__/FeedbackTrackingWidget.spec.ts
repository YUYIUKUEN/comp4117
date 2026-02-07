import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FeedbackTrackingWidget from '../FeedbackTrackingWidget.vue'

describe('FeedbackTrackingWidget', () => {
  it('renders empty state when no feedbacks', () => {
    const wrapper = mount(FeedbackTrackingWidget, {
      props: { feedbacks: [] },
    })

    expect(wrapper.text()).toContain('No feedback records')
  })

  it('renders list of feedbacks', () => {
    const feedbacks = [
      {
        _id: '1',
        studentName: 'John Doe',
        content: 'Good progress on milestone 1',
        status: 'submitted',
        createdAt: new Date().toISOString(),
      },
    ]

    const wrapper = mount(FeedbackTrackingWidget, {
      props: { feedbacks },
    })

    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('Good progress on milestone 1')
  })

  it('displays feedback status badge', () => {
    const feedbacks = [
      {
        _id: '1',
        studentName: 'John Doe',
        content: 'Good progress',
        status: 'submitted',
        createdAt: new Date().toISOString(),
      },
    ]

    const wrapper = mount(FeedbackTrackingWidget, {
      props: { feedbacks },
    })

    expect(wrapper.text()).toContain('submitted')
  })

  it('formats feedback timestamp', () => {
    const feedbacks = [
      {
        _id: '1',
        studentName: 'John Doe',
        content: 'Good progress',
        status: 'submitted',
        createdAt: new Date().toISOString(),
      },
    ]

    const wrapper = mount(FeedbackTrackingWidget, {
      props: { feedbacks },
    })

    expect(wrapper.find('.timestamp').exists()).toBe(true)
  })
})

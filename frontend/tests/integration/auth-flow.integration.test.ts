import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import ForgotPassword from '@/views/ForgotPassword.vue'
import { useAuthStore } from '@/stores/authStore'
import authService from '@/services/authService'
import registrationService from '@/services/registrationService'
import passwordResetService from '@/services/passwordResetService'

// Mock services
vi.mock('@/services/authService')
vi.mock('@/services/registrationService')
vi.mock('@/services/passwordResetService')

describe('Authentication UI Integration Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Login Component', () => {
    it('should initialize with empty form', () => {
      const wrapper = mount(Login, {
        global: {
          plugins: [createPinia(), createRouter({
            history: createMemoryHistory(),
            routes: []
          })]
        }
      })

      expect(wrapper.find('input[type="email"]').element.value).toBe('')
      expect(wrapper.find('input[type="password"]').element.value).toBe('')
    })

    it('should validate email on blur', async () => {
      const wrapper = mount(Login, {
        global: {
          plugins: [createPinia(), createRouter({
            history: createMemoryHistory(),
            routes: []
          })]
        }
      })

      const emailInput = wrapper.find('input[type="email"]')
      await emailInput.setValue('invalidemail')
      await emailInput.trigger('blur')

      expect(wrapper.text()).toContain('valid email')
    })

    it('should show error for password less than 8 characters', async () => {
      const wrapper = mount(Login, {
        global: {
          plugins: [createPinia(), createRouter({
            history: createMemoryHistory(),
            routes: []
          })]
        }
      })

      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.find('input[type="password"]').setValue('1234567')
      await wrapper.find('form').trigger('submit')

      expect(wrapper.text()).toContain('at least 8 characters')
    })

    it('should call authService on successful login', async () => {
      const mockLogin = vi.mocked(authService.login).mockResolvedValue({
        user: { id: '1', email: 'test@example.com', fullName: 'Test User', role: 'Student' },
        token: 'test-token'
      })

      const wrapper = mount(Login, {
        global: {
          plugins: [createPinia(), createRouter({
            history: createMemoryHistory(),
            routes: [{
              path: '/dashboard-student',
              component: { template: '<div>Dashboard</div>' }
            }]
          })]
        }
      })

      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.find('input[type="password"]').setValue('password123')
      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  describe('Register Component', () => {
    it('should initialize with empty form', () => {
      const wrapper = mount(Register, {
        global: {
          plugins: [createPinia(), createRouter({
            history: createMemoryHistory(),
            routes: []
          })]
        }
      })

      const inputs = wrapper.findAll('input')
      inputs.forEach(input => {
        if (input.element.type !== 'submit') {
          expect(input.element.value).toBe('')
        }
      })
    })

    it('should validate email format', async () => {
      const wrapper = mount(Register, {
        global: {
          plugins: [createPinia(), createRouter({
            history: createMemoryHistory(),
            routes: []
          })]
        }
      })

      const emailInput = wrapper.find('input[type="email"]')
      await emailInput.setValue('invalidemail')
      await emailInput.trigger('blur')

      expect(wrapper.text()).toContain('valid email')
    })

    it('should validate password confirmation', async () => {
      const wrapper = mount(Register, {
        global: {
          plugins: [createPinia(), createRouter({
            history: createMemoryHistory(),
            routes: []
          })]
        }
      })

      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('John Doe') // fullName
      await inputs[1].setValue('john@university.edu') // email
      await inputs[2].setValue('newpassword') // password
      await inputs[3].setValue('differentpassword') // confirmPassword

      await wrapper.find('form').trigger('submit')

      expect(wrapper.text()).toContain('do not match')
    })

    it('should require all fields', async () => {
      const wrapper = mount(Register, {
        global: {
          plugins: [createPinia(), createRouter({
            history: createMemoryHistory(),
            routes: []
          })]
        }
      })

      await wrapper.find('form').trigger('submit')

      expect(wrapper.text()).toContain('required')
    })

    it('should call registrationService.register on successful submission', async () => {
      const mockRegister = vi.mocked(registrationService.register).mockResolvedValue({
        user: { id: '1', email: 'john@example.com', fullName: 'John Doe', role: 'Student' },
        token: 'test-token'
      })

      const wrapper = mount(Register, {
        global: {
          plugins: [createPinia(), createRouter({
            history: createMemoryHistory(),
            routes: [{
              path: '/verify-email',
              component: { template: '<div>Verify</div>' }
            }]
          })]
        }
      })

      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('John Doe')
      await inputs[1].setValue('john@university.edu')
      await wrapper.find('select').setValue('Student')
      await inputs[2].setValue('password123')
      await inputs[3].setValue('password123')

      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      expect(mockRegister).toHaveBeenCalled()
    })
  })

  describe('ForgotPassword Component', () => {
    it('should initialize with empty email field', () => {
      const wrapper = mount(ForgotPassword, {
        global: {
          plugins: [createPinia(), createRouter({
            history: createMemoryHistory(),
            routes: []
          })]
        }
      })

      expect(wrapper.find('input[type="email"]').element.value).toBe('')
    })

    it('should validate email field', async () => {
      const wrapper = mount(ForgotPassword, {
        global: {
          plugins: [createPinia(), createRouter({
            history: createMemoryHistory(),
            routes: []
          })]
        }
      })

      const emailInput = wrapper.find('input[type="email"]')
      await emailInput.setValue('invalidemail')
      await emailInput.trigger('blur')

      expect(wrapper.text()).toContain('valid email')
    })

    it('should call passwordResetService on submission', async () => {
      const mockReset = vi.mocked(passwordResetService.requestReset).mockResolvedValue({
        success: true,
        message: 'Reset link sent'
      })

      const wrapper = mount(ForgotPassword, {
        global: {
          plugins: [createPinia(), createRouter({
            history: createMemoryHistory(),
            routes: []
          })]
        }
      })

      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      expect(mockReset).toHaveBeenCalledWith('test@example.com')
    })

    it('should show success message after reset request', async () => {
      vi.mocked(passwordResetService.requestReset).mockResolvedValue({
        success: true,
        message: 'Reset link sent'
      })

      const wrapper = mount(ForgotPassword, {
        global: {
          plugins: [createPinia(), createRouter({
            history: createMemoryHistory(),
            routes: []
          })]
        }
      })

      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Check Your Email')
    })
  })

  describe('Auth Store Integration', () => {
    it('should persist auth state to localStorage', () => {
      const store = useAuthStore()
      const user = { id: '1', email: 'test@example.com', fullName: 'Test', role: 'Student' }
      
      store.setAuth(user, 'test-token')

      expect(localStorage.getItem('authToken')).toBeTruthy()
      expect(localStorage.getItem('user')).toBeTruthy()
      expect(store.isAuthenticated).toBe(true)
      expect(store.userRole).toBe('Student')
    })

    it('should clear auth state on logout', () => {
      const store = useAuthStore()
      const user = { id: '1', email: 'test@example.com', fullName: 'Test', role: 'Student' }
      
      store.setAuth(user, 'test-token')
      expect(store.isAuthenticated).toBe(true)

      store.clearAuth()
      expect(store.isAuthenticated).toBe(false)
      expect(localStorage.getItem('authToken')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })

    it('should restore auth state from localStorage', () => {
      const store = useAuthStore()
      const user = { id: '1', email: 'test@example.com', fullName: 'Test', role: 'Student' }
      
      store.setAuth(user, 'test-token')
      
      const newStore = useAuthStore()
      newStore.loadAuthFromStorage()

      expect(newStore.isAuthenticated).toBe(true)
      expect(newStore.userRole).toBe('Student')
    })
  })
})

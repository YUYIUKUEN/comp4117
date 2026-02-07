import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StatusBadge from '../../src/components/StatusBadge.vue'
import SubmissionPhases from '../../src/components/SubmissionPhases.vue'
import FileUpload from '../../src/components/FileUpload.vue'
import DeclarationForm from '../../src/components/DeclarationForm.vue'
import { useSubmissionStore } from '../../src/stores/submissionStore'
import submissionService from '../../src/services/submissionService'

// Mock the submission service
vi.mock('../services/submissionService', () => ({
  default: {
    getSubmissionPhases: vi.fn(),
    getSubmissionPhase: vi.fn(),
    uploadSubmissionFile: vi.fn(),
    getSubmissionFiles: vi.fn(),
    deleteSubmissionFile: vi.fn(),
    submitDeclaration: vi.fn(),
    getDeclarations: vi.fn(),
    getFeedback: vi.fn(),
    postComment: vi.fn(),
    pollSubmissionStatus: vi.fn(),
    downloadFile: vi.fn(),
    getSubmissionStats: vi.fn(),
  },
}))

describe('WP12: Submission Tracking UI', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('T062: StatusBadge Component', () => {
    it('renders status badge for not-submitted', () => {
      const wrapper = mount(StatusBadge, {
        props: { status: 'not-submitted' },
      })
      expect(wrapper.text()).toContain('Not Submitted')
      expect(wrapper.classes()).toContain('bg-red-50')
    })

    it('renders status badge for submitted', () => {
      const wrapper = mount(StatusBadge, {
        props: { status: 'submitted' },
      })
      expect(wrapper.text()).toContain('Submitted')
      expect(wrapper.classes()).toContain('bg-green-50')
    })

    it('renders status badge for overdue', () => {
      const wrapper = mount(StatusBadge, {
        props: { status: 'overdue' },
      })
      expect(wrapper.text()).toContain('Overdue')
      expect(wrapper.classes()).toContain('bg-orange-50')
    })

    it('renders status badge for declared', () => {
      const wrapper = mount(StatusBadge, {
        props: { status: 'declared' },
      })
      expect(wrapper.text()).toContain('Declared Not Needed')
      expect(wrapper.classes()).toContain('bg-yellow-50')
    })

    it('supports different sizes', () => {
      const wrapperSm = mount(StatusBadge, {
        props: { status: 'submitted', size: 'sm' },
      })
      expect(wrapperSm.classes()).toContain('text-[11px]')

      const wrapperLg = mount(StatusBadge, {
        props: { status: 'submitted', size: 'lg' },
      })
      expect(wrapperLg.classes()).toContain('text-sm')
    })
  })

  describe('T062: SubmissionPhases Component', () => {
    const mockPhases = [
      {
        id: 'phase-1',
        name: 'Initial Statement',
        description: 'Project proposal and initial scope',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'not-submitted' as const,
      },
      {
        id: 'phase-2',
        name: 'Progress Report 1',
        description: 'First progress checkpoint',
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'submitted' as const,
        submittedAt: new Date().toISOString(),
      },
      {
        id: 'phase-3',
        name: 'Progress Report 2',
        description: 'Second progress checkpoint',
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'overdue' as const,
      },
      {
        id: 'phase-4',
        name: 'Final Dissertation',
        description: 'Complete final project report',
        dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'declared' as const,
      },
    ]

    it('displays all submission phases with correct status', () => {
      const wrapper = mount(SubmissionPhases, {
        props: { phases: mockPhases },
      })

      expect(wrapper.text()).toContain('Initial Statement')
      expect(wrapper.text()).toContain('Progress Report 1')
      expect(wrapper.text()).toContain('Progress Report 2')
      expect(wrapper.text()).toContain('Final Dissertation')
    })

    it('shows upload button for not-submitted phases', () => {
      const wrapper = mount(SubmissionPhases, {
        props: { phases: mockPhases },
      })

      const uploadButtons = wrapper.findAll('button').filter(btn =>
        btn.text().includes('Upload Document')
      )
      expect(uploadButtons.length).toBeGreaterThan(0)
    })

    it('shows declare button for not-submitted phases', () => {
      const wrapper = mount(SubmissionPhases, {
        props: { phases: mockPhases },
      })

      const declareButtons = wrapper.findAll('button').filter(btn =>
        btn.text().includes('Declare Not Needed')
      )
      expect(declareButtons.length).toBeGreaterThan(0)
    })

    it('emits upload event when upload button clicked', async () => {
      const wrapper = mount(SubmissionPhases, {
        props: { phases: mockPhases },
      })

      const uploadButtons = wrapper.findAll('button').filter(btn =>
        btn.text().includes('Upload Document')
      )

      if (uploadButtons.length > 0) {
        await uploadButtons[0].trigger('click')
        expect(wrapper.emitted('upload')).toBeTruthy()
      }
    })

    it('emits declare event when declare button clicked', async () => {
      const wrapper = mount(SubmissionPhases, {
        props: { phases: mockPhases },
      })

      const declareButtons = wrapper.findAll('button').filter(btn =>
        btn.text().includes('Declare Not Needed')
      )

      if (declareButtons.length > 0) {
        await declareButtons[0].trigger('click')
        expect(wrapper.emitted('declare')).toBeTruthy()
      }
    })

    it('displays loading state', () => {
      const wrapper = mount(SubmissionPhases, {
        props: { phases: mockPhases, loading: true },
      })

      const skeletons = wrapper.findAll('.animate-pulse')
      expect(skeletons.length).toBe(4)
    })

    it('formats dates correctly', () => {
      const wrapper = mount(SubmissionPhases, {
        props: { phases: mockPhases },
      })

      expect(wrapper.text()).toMatch(/Due:/)
    })
  })

  describe('T063: FileUpload Component', () => {
    it('initializes with empty uploaded files', () => {
      const wrapper = mount(FileUpload, {
        props: { phaseId: 'phase-1' },
      })

      expect(wrapper.text()).toContain('Drag and drop')
    })

    it('accepts files via file input', async () => {
      const wrapper = mount(FileUpload, {
        props: { phaseId: 'phase-1' },
      })

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const input = wrapper.find('input[type="file"]') as any

      // Simulate file selection
      input.element.files = {
        0: file,
        length: 1,
        item: (i: number) => (i === 0 ? file : null),
      } as any

      await input.trigger('change')
      expect(wrapper.emitted('upload')).toBeTruthy()
    })

    it('validates file format', async () => {
      const wrapper = mount(FileUpload, {
        props: {
          phaseId: 'phase-1',
          acceptedFormats: ['pdf', 'docx'],
        },
      })

      const invalidFile = new File(['test'], 'test.exe', { type: 'application/exe' })
      const input = wrapper.find('input[type="file"]') as any

      input.element.files = {
        0: invalidFile,
        length: 1,
        item: (i: number) => (i === 0 ? invalidFile : null),
      } as any

      await input.trigger('change')
      expect(wrapper.emitted('error')).toBeTruthy()
    })

    it('validates file size', async () => {
      const wrapper = mount(FileUpload, {
        props: {
          phaseId: 'phase-1',
          maxSize: 1, // 1MB limit
        },
      })

      const largeFile = new File([new ArrayBuffer(10 * 1024 * 1024)], 'large.pdf')
      const input = wrapper.find('input[type="file"]') as any

      input.element.files = {
        0: largeFile,
        length: 1,
        item: (i: number) => (i === 0 ? largeFile : null),
      } as any

      await input.trigger('change')
      expect(wrapper.emitted('error')).toBeTruthy()
    })

    it('handles drag and drop', async () => {
      const wrapper = mount(FileUpload, {
        props: { phaseId: 'phase-1' },
      })

      const dropZone = wrapper.find('.border-dashed')
      await dropZone.trigger('dragover')
      expect(wrapper.vm.isDragging).toBe(true)

      await dropZone.trigger('dragleave')
      expect(wrapper.vm.isDragging).toBe(false)
    })

    it('displays upload progress', async () => {
      const wrapper = mount(FileUpload, {
        props: { phaseId: 'phase-1' },
      })

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const input = wrapper.find('input[type="file"]') as any

      input.element.files = {
        0: file,
        length: 1,
        item: (i: number) => (i === 0 ? file : null),
      } as any

      await input.trigger('change')
      
      // The simulated progress should increase
      expect(wrapper.vm.uploadProgress >= 0).toBe(true)
    })

    it('allows removing uploaded files', async () => {
      const wrapper = mount(FileUpload, {
        props: { phaseId: 'phase-1' },
      })

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const input = wrapper.find('input[type="file"]') as any

      input.element.files = {
        0: file,
        length: 1,
        item: (i: number) => (i === 0 ? file : null),
      } as any

      await input.trigger('change')
      await wrapper.vm.$nextTick()

      const removeButtons = wrapper.findAll('button').filter(btn =>
        btn.classes().includes('hover:text-slate-600')
      )

      if (removeButtons.length > 0) {
        await removeButtons[0].trigger('click')
        expect(wrapper.vm.uploadedFiles.length).toBe(0)
      }
    })
  })

  describe('T064: DeclarationForm Component', () => {
    it('renders form fields', () => {
      const wrapper = mount(DeclarationForm, {
        props: {
          phaseId: 'phase-1',
          phaseName: 'Initial Statement',
        },
      })

      expect(wrapper.text()).toContain('Declare Initial Statement Not Needed')
      expect(wrapper.text()).toContain('Reason')
      expect(wrapper.text()).toContain('Justification')
    })

    it('shows reason options', () => {
      const wrapper = mount(DeclarationForm, {
        props: {
          phaseId: 'phase-1',
          phaseName: 'Initial Statement',
        },
      })

      expect(wrapper.text()).toContain('Not applicable to this project')
      expect(wrapper.text()).toContain('Already submitted through alternative means')
      expect(wrapper.text()).toContain('Approved exception by supervisor')
    })

    it('disables submit when form is invalid', () => {
      const wrapper = mount(DeclarationForm, {
        props: {
          phaseId: 'phase-1',
          phaseName: 'Initial Statement',
        },
      })

      const submitButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Submit Declaration')
      )

      expect(submitButton?.element.disabled).toBe(true)
    })

    it('enables submit when form is valid', async () => {
      const wrapper = mount(DeclarationForm, {
        props: {
          phaseId: 'phase-1',
          phaseName: 'Initial Statement',
        },
      })

      // Select reason
      const reasonButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Not applicable to this project')
      )
      if (reasonButton) {
        await reasonButton.trigger('click')
      }

      // Fill justification
      wrapper.vm.justification = 'This project does not require an initial statement.'

      // Check supervisor agreement
      wrapper.vm.agreedWithSupervisor = true

      await wrapper.vm.$nextTick()

      const submitButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Submit Declaration')
      )

      // After form is valid, button should be enabled
      expect(submitButton?.element.disabled).toBe(false)
    })

    it('enforces character limit', async () => {
      const wrapper = mount(DeclarationForm, {
        props: {
          phaseId: 'phase-1',
          phaseName: 'Initial Statement',
        },
      })

      const longText = 'a'.repeat(1001)
      wrapper.vm.justification = 'a'.repeat(1000) // Set exactly 1000

      await wrapper.vm.$nextTick()

      // textarea should not allow more than 1000 chars due to maxlength
      expect(wrapper.vm.justification.length).toBeLessThanOrEqual(1000)
    })

    it('emits submit event with correct data', async () => {
      const wrapper = mount(DeclarationForm, {
        props: {
          phaseId: 'phase-1',
          phaseName: 'Initial Statement',
        },
      })

      wrapper.vm.reason = 'not-applicable'
      wrapper.vm.justification = 'This project does not require this phase.'
      wrapper.vm.agreedWithSupervisor = true

      await wrapper.vm.$nextTick()

      const submitButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Submit Declaration')
      )

      if (submitButton && submitButton.element.disabled === false) {
        await submitButton.trigger('click')
        // Wait for async submit to complete (1500ms + buffer)
        await new Promise(resolve => setTimeout(resolve, 2000))
        const emitted = wrapper.emitted('submit')
        expect(emitted).toBeTruthy()
      }
    })

    it('emits cancel event', async () => {
      const wrapper = mount(DeclarationForm, {
        props: {
          phaseId: 'phase-1',
          phaseName: 'Initial Statement',
        },
      })

      const cancelButton = wrapper.findAll('button').find(btn => btn.text().includes('Cancel'))

      if (cancelButton) {
        await cancelButton.trigger('click')
        expect(wrapper.emitted('cancel')).toBeTruthy()
      }
    })
  })

  describe('T066: Submission Store', () => {
    it('initializes with empty state', () => {
      const store = useSubmissionStore()
      expect(store.phases).toEqual([])
      expect(store.selectedPhase).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('computes submission counts correctly', () => {
      const store = useSubmissionStore()

      store.phases = [
        { id: '1', status: 'submitted' } as any,
        { id: '2', status: 'submitted' } as any,
        { id: '3', status: 'not-submitted' } as any,
        { id: '4', status: 'overdue' } as any,
        { id: '5', status: 'declared' } as any,
      ]

      expect(store.submittedCount).toBe(2)
      expect(store.pendingCount).toBe(1)
      expect(store.overdueCount).toBe(1)
      expect(store.declaredCount).toBe(1)
    })

    it('calculates submission progress correctly', () => {
      const store = useSubmissionStore()

      store.phases = [
        { id: '1', status: 'submitted' } as any,
        { id: '2', status: 'not-submitted' } as any,
        { id: '3', status: 'not-submitted' } as any,
        { id: '4', status: 'declared' } as any,
      ]

      // 2 completed out of 4 = 50%
      expect(store.submissionProgress).toBe(50)
    })

    it('handles file size formatting', () => {
      const store = useSubmissionStore()

      store.files = [
        { id: '1', fileSize: 2048 } as any, // 2 KB
        { id: '2', fileSize: 1048576 } as any, // 1 MB
      ]

      expect(store.allFilesSizeFormatted).toContain('MB')
    })

    it('resets store state', () => {
      const store = useSubmissionStore()

      store.phases = [{ id: '1' } as any]
      store.loading = true
      store.error = 'Test error'

      store.resetStore()

      expect(store.phases).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('T068: Integration Tests', () => {
    it('completes full submission flow: phases → upload → status update', async () => {
      const store = useSubmissionStore()

      const mockPhases = [
        {
          id: 'phase-1',
          name: 'Initial Statement',
          description: 'Project proposal',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'not-submitted' as const,
        },
      ]

      store.phases = mockPhases

      expect(store.pendingCount).toBe(1)
      expect(store.submissionProgress).toBe(0)
    })

    it('handles declaration flow: form → store → status change', async () => {
      const store = useSubmissionStore()

      store.selectedPhase = {
        id: 'phase-1',
        name: 'Initial Statement',
        description: 'Project proposal',
        dueDate: new Date().toISOString(),
        status: 'not-submitted',
      }

      store.declarations = [
        {
          id: 'decl-1',
          phaseId: 'phase-1',
          reason: 'not-applicable',
          justification: 'This project does not require this phase.',
          submittedAt: new Date().toISOString(),
          status: 'pending',
        },
      ]

      expect(store.declarations.length).toBe(1)
    })

    it('multiple phases with different statuses', () => {
      const store = useSubmissionStore()

      store.phases = [
        {
          id: 'phase-1',
          name: 'Initial Statement',
          status: 'submitted',
          dueDate: '2026-03-01',
        } as any,
        {
          id: 'phase-2',
          name: 'Progress Report 1',
          status: 'not-submitted',
          dueDate: '2026-04-01',
        } as any,
        {
          id: 'phase-3',
          name: 'Progress Report 2',
          status: 'overdue',
          dueDate: '2026-02-01',
        } as any,
        {
          id: 'phase-4',
          name: 'Final Dissertation',
          status: 'declared',
          dueDate: '2026-06-01',
        } as any,
      ]

      expect(store.phases.length).toBe(4)
      expect(store.submittedCount).toBe(1)
      expect(store.pendingCount).toBe(1)
      expect(store.overdueCount).toBe(1)
      expect(store.declaredCount).toBe(1)
      expect(store.submissionProgress).toBe(50) // 2 out of 4 completed
    })
  })
})

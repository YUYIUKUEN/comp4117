import { ref, computed } from 'vue'

export interface GradingStandard {
  id: string
  submissionType: string
  gradingSystem: 'point-range' | 'letter-grade' | 'custom'
  pointRange?: {
    min: number
    max: number
  }
  letterGrades?: string[] // ['A', 'B', 'C', 'D', 'F']
  customOptions?: string[] // Custom grading options
  description: string
  enabled: boolean
}

const gradingStandards = ref<GradingStandard[]>([
  {
    id: 'gs-001',
    submissionType: 'Progress Report',
    gradingSystem: 'point-range',
    pointRange: { min: 0, max: 100 },
    description: 'Standard progress report grading using points',
    enabled: true,
  },
  {
    id: 'gs-002',
    submissionType: 'Final Presentation',
    gradingSystem: 'letter-grade',
    letterGrades: ['A', 'B', 'C', 'D', 'F'],
    description: 'Presentation grading using letter grades',
    enabled: true,
  },
  {
    id: 'gs-003',
    submissionType: 'Final Report',
    gradingSystem: 'point-range',
    pointRange: { min: 0, max: 100 },
    description: 'Final report grading using points',
    enabled: true,
  },
  {
    id: 'gs-004',
    submissionType: 'Proposal Review',
    gradingSystem: 'custom',
    customOptions: ['Approved', 'Approved with Revision', 'Rejected'],
    description: 'Custom approval-based grading',
    enabled: true,
  },
])

export const useGradingStandards = () => {
  const getStandardForSubmissionType = (submissionType: string) => {
    return computed(() =>
      gradingStandards.value.find(
        (gs) => gs.submissionType === submissionType && gs.enabled
      )
    )
  }

  const getEnabledStandards = computed(() =>
    gradingStandards.value.filter((gs) => gs.enabled)
  )

  const addGradingStandard = (standard: Omit<GradingStandard, 'id'>) => {
    const newStandard: GradingStandard = {
      ...standard,
      id: `gs-${Date.now()}`,
    }
    gradingStandards.value.push(newStandard)
    return newStandard
  }

  const updateGradingStandard = (id: string, updates: Partial<GradingStandard>) => {
    const index = gradingStandards.value.findIndex((gs) => gs.id === id)
    if (index !== -1) {
      gradingStandards.value[index] = {
        ...gradingStandards.value[index],
        ...updates,
      }
    }
  }

  const deleteGradingStandard = (id: string) => {
    const index = gradingStandards.value.findIndex((gs) => gs.id === id)
    if (index !== -1) {
      gradingStandards.value.splice(index, 1)
    }
  }

  const toggleGradingStandard = (id: string) => {
    const standard = gradingStandards.value.find((gs) => gs.id === id)
    if (standard) {
      standard.enabled = !standard.enabled
    }
  }

  return {
    gradingStandards,
    getStandardForSubmissionType,
    getEnabledStandards,
    addGradingStandard,
    updateGradingStandard,
    deleteGradingStandard,
    toggleGradingStandard,
  }
}

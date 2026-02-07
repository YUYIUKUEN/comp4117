<script setup lang="ts">
import { computed } from 'vue'

export interface Props {
  status: 'not-submitted' | 'submitted' | 'overdue' | 'declared'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const statusConfig = {
  'not-submitted': {
    label: 'Not Submitted',
    color: 'bg-red-50 border-red-200 text-red-700',
    dot: 'bg-red-400',
    icon: '◉',
  },
  submitted: {
    label: 'Submitted',
    color: 'bg-green-50 border-green-200 text-green-700',
    dot: 'bg-green-400',
    icon: '✓',
  },
  overdue: {
    label: 'Overdue',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    dot: 'bg-orange-400',
    icon: '!',
  },
  declared: {
    label: 'Declared Not Needed',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    dot: 'bg-yellow-400',
    icon: '~',
  },
}

const config = computed(() => statusConfig[props.status])

const sizeClass = computed(() => {
  const sizes = {
    sm: 'px-2 py-1 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }
  return sizes[props.size]
})
</script>

<template>
  <span
    :class="`inline-flex items-center gap-1 rounded-full border ${config.color} font-medium ${sizeClass}`"
  >
    <span :class="`h-1.5 w-1.5 rounded-full ${config.dot}`"></span>
    {{ config.label }}
  </span>
</template>

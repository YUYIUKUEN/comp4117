<template>
  <button :class="buttonClasses">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false
});

const buttonClasses = computed(() => ({
  'btn': true,
  'btn-primary': props.variant === 'primary',
  'btn-secondary': props.variant === 'secondary',
  'btn-danger': props.variant === 'danger',
  'btn-sm': props.size === 'sm',
  'btn-md': props.size === 'md',
  'btn-lg': props.size === 'lg',
  'btn-disabled': props.disabled
}));
</script>

<style scoped>
.btn {
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  font-family: inherit;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(.btn-disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(.btn-disabled) {
  background: #7f8c8d;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(.btn-disabled) {
  background: #c0392b;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn-md {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

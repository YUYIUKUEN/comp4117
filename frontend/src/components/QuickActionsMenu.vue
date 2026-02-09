<template>
  <div class="quick-actions-menu">
    <button
      v-for="action in actions"
      :key="action.id"
      class="action-button"
      @click="handleAction(action.id)"
    >
      <span class="icon">{{ action.icon }}</span>
      <span class="label">{{ action.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Action {
  id: string
  label: string
  icon: string
}

interface Props {
  actions?: Action[]
}

withDefaults(defineProps<Props>(), {
  actions: () => [],
})

const emit = defineEmits<{
  action: [id: string]
}>()

const handleAction = (id: string) => {
  emit('action', id)
}
</script>

<style scoped>
.quick-actions-menu {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.action-button:hover {
  background-color: #1d4ed8;
}

.action-button:active {
  background-color: #1e40af;
}

.icon {
  font-size: 1rem;
}

.label {
  font-size: 0.875rem;
}

@media (max-width: 640px) {
  .quick-actions-menu {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }
}
</style>

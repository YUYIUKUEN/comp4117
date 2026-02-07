<template>
  <div class="card" :class="{ 'card-hover': hoverable }">
    <div class="card-header" v-if="$slots.header">
      <slot name="header" />
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div class="card-footer" v-if="$slots.footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  hoverable?: boolean;
}

withDefaults(defineProps<Props>(), {
  hoverable: false
});
</script>

<style scoped>
.card {
  background: white;
  border-radius: 8px;
  border: 1px solid #ecf0f1;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-hover:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #ecf0f1;
  background: #f8f9fa;
}

.card-body {
  padding: 1.5rem;
}

.card-footer {
  padding: 1.5rem;
  border-top: 1px solid #ecf0f1;
  background: #f8f9fa;
}
</style>

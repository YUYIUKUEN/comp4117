<template>
  <div class="user-management-widget">
    <div v-if="users.length === 0" class="empty-state">
      <p>No users</p>
    </div>
    <div v-else class="users-list">
      <div v-for="user in users" :key="user._id" class="user-item">
        <div class="user-info">
          <h4 class="user-name">{{ user.name }}</h4>
          <p class="user-email">{{ user.email }}</p>
        </div>
        <div class="user-meta">
          <span :class="['role-badge', user.role]">{{ user.role }}</span>
          <span :class="['status-badge', user.status]">{{ user.status }}</span>
        </div>
        <div class="user-actions">
          <button class="btn-action">Edit</button>
          <button class="btn-action danger">Deactivate</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface User {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
  status: string
}

interface Props {
  users?: User[]
}

withDefaults(defineProps<Props>(), {
  users: () => [],
})
</script>

<style scoped>
.user-management-widget {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 1rem;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-item {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

.user-info {
  flex: 1;
}

.user-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.user-email {
  margin: 0.25rem 0 0 0;
  font-size: 0.85rem;
  color: #999;
}

.user-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.role-badge,
.status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-weight: 500;
}

.role-badge {
  background-color: #e0e7ff;
  color: #3730a3;
}

.role-badge.supervisor {
  background-color: #dbeafe;
  color: #0c4a6e;
}

.status-badge {
  background-color: #dcfce7;
  color: #15803d;
}

.status-badge.inactive {
  background-color: #fee2e2;
  color: #991b1b;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-action:hover {
  background-color: #e5e7eb;
}

.btn-action.danger {
  background-color: #fee2e2;
  color: #991b1b;
  border-color: #fecaca;
}

.btn-action.danger:hover {
  background-color: #fecaca;
}
</style>

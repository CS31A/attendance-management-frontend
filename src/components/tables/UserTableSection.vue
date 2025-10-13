<template>
    <div class="table-section">
      <div class="table-header">
        <div class="table-title">
          <svg class="table-icon" :class="role.toLowerCase()" fill="currentColor" viewBox="0 0 24 24">
            <path :d="getRoleIcon(role)" />
          </svg>
          <h2>{{ title }} ({{ users.length }})</h2>
        </div>
      </div>
      
      <UserTable 
        :users="users" 
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </template>
  
  <script setup>
  import UserTable from './UserTable.vue'
  
  defineProps({
    users: {
      type: Array,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true
    }
  })
  
  defineEmits(['edit', 'delete'])
  
  const getRoleIcon = (role) => {
    const icons = {
      Teacher: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
      Student: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222'
    }
    return icons[role] || ''
  }
  </script>
  
  <style scoped>
  .table-section {
    margin-bottom: 2rem;
    animation: fadeIn 0.8s ease-out;
  }
  
  .table-header {
    margin-bottom: 1rem;
  }
  
  .table-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: white;
  }
  
  .table-icon {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  .table-icon.teacher {
    color: #3b82f6;
  }
  
  .table-icon.student {
    color: #16a34a;
  }
  
  .table-title h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  </style>
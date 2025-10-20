<template>
    <div class="table-wrapper">
      <!-- Desktop Table -->
      <table class="users-table">
        <thead>
          <tr>
            <th class="th-avatar">Avatar</th>
            <th class="th-name">Name</th>
            <th class="th-email">Email</th>
            <th class="th-section">Section</th>
            <th class="th-joined">Joined</th>
            <th class="th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" class="user-row">
            <td class="td-avatar">
              <div class="avatar-circle" :class="user?.role?.toLowerCase() || 'default'">
                <svg class="avatar-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path :d="getRoleIcon(user?.role || '')" />
                </svg>
              </div>
            </td>
            <td class="td-name">
              <div class="name-cell">
                <span class="user-name">{{ getUserName(user) }}</span>
              </div>
            </td>
            <td class="td-email">
              <div class="email-cell">
                <svg class="email-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <span class="email-text">{{ user?.email || 'N/A' }}</span>
              </div>
            </td>
            <td class="td-section">
              <div class="section-cell">
                <span class="section-text">{{ getUserSection(user) }}</span>
              </div>
            </td>
            <td class="td-joined">
              <div class="joined-cell">
                <svg class="date-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span class="date-text">{{ user?.createdAt || 'N/A' }}</span>
              </div>
            </td>
            <td class="td-actions">
              <div class="action-buttons">
                <button class="btn-edit" @click="$emit('edit', user)" title="Edit User">
                  <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button class="btn-delete" @click="$emit('delete', user.id)" title="Delete User">
                  <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Mobile Cards -->
      <div class="mobile-cards">
        <div v-for="user in users" :key="user.id" class="mobile-card">
          <div class="mobile-card-header">
            <div class="mobile-card-avatar" :class="user?.role?.toLowerCase() || 'default'">
              <svg class="avatar-icon" fill="currentColor" viewBox="0 0 24 24">
                <path :d="getRoleIcon(user?.role || '')" />
              </svg>
            </div>
            <div class="mobile-card-info">
              <div class="mobile-card-name">{{ getUserName(user) }}</div>
              <div class="mobile-card-email">{{ user?.email || 'N/A' }}</div>
            </div>
          </div>
          
          <div class="mobile-card-details">
            <div class="mobile-card-detail">
              <div class="mobile-card-detail-label">Role</div>
              <div class="mobile-card-detail-value">{{ user?.role || 'N/A' }}</div>
            </div>
            <div class="mobile-card-detail">
              <div class="mobile-card-detail-label">Section</div>
              <div class="mobile-card-detail-value">{{ getUserSection(user) }}</div>
            </div>
            <div class="mobile-card-detail">
              <div class="mobile-card-detail-label">Joined</div>
              <div class="mobile-card-detail-value">{{ user?.createdAt || 'N/A' }}</div>
            </div>
          </div>
          
          <div class="mobile-card-actions">
            <button class="mobile-card-btn edit" @click="$emit('edit', user)" title="Edit User">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button class="mobile-card-btn delete" @click="$emit('delete', user.id)" title="Delete User">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    users: {
      type: Array,
      required: true
    }
  })
  
  defineEmits(['edit', 'delete'])
  
  // Get role icon
  const getRoleIcon = (role) => {
    const icons = {
      Instructor: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
      Student: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222'
    }
    return icons[role] || ''
  }

  // Get user name - handle different possible field names
  const getUserName = (user) => {
    // Try different possible field name combinations
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    if (user.firstname && user.lastname) {
      return `${user.firstname} ${user.lastname}`
    }
    if (user.name) {
      return user.name
    }
    if (user.fullName) {
      return user.fullName
    }
    // Fallback to email if no name found
    return user.email || 'Unknown User'
  }

  // Get user section - handle different possible field names
  const getUserSection = (user) => {
    if (user.sectionId) {
      return user.sectionId
    }
    if (user.section) {
      return user.section
    }
    if (user.sectionName) {
      return user.sectionName
    }
    return '-'
  }
  </script>
  
<style scoped>
.table-wrapper {
  overflow-x: auto;
}

/* Users Table */
.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

/* Table Header */
.users-table thead {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
}

.users-table th {
  padding: 1rem 1.5rem;
  text-align: left;
  font-weight: 600;
  color: white;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.th-avatar {
  width: 80px;
  text-align: center;
}

.th-name {
  min-width: 200px;
}

.th-email {
  min-width: 250px;
}

.th-section {
  width: 100px;
  text-align: center;
}

.th-joined {
  width: 140px;
}

.th-actions {
  width: 120px;
  text-align: center;
}

/* Table Body */
.users-table tbody tr {
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s ease;
}

.users-table tbody tr:hover {
  background: #f1f5f9;
  transform: scale(1.01);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.users-table tbody tr:last-child {
  border-bottom: none;
}

.users-table td {
  padding: 1rem 1.5rem;
  vertical-align: middle;
}

/* Avatar Column */
.td-avatar {
  text-align: center;
}

.avatar-circle {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.avatar-circle.instructor {
  background: #dbeafe;
  color: #3b82f6;
}

.avatar-circle.student {
  background: #dcfce7;
  color: #16a34a;
}

.avatar-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Name Column */
.td-name {
  min-width: 200px;
}

.name-cell {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
}

/* Email Column */
.td-email {
  min-width: 250px;
}

.email-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.email-icon {
  width: 1rem;
  height: 1rem;
  color: #6b7280;
  flex-shrink: 0;
}

.email-text {
  color: #4b5563;
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Section Column */
.td-section {
  text-align: center;
}

.section-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-text {
  color: #4b5563;
  font-size: 0.875rem;
  font-weight: 500;
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  min-width: 2rem;
  text-align: center;
}

/* Joined Column */
.td-joined {
  width: 140px;
}

.joined-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-icon {
  width: 1rem;
  height: 1rem;
  color: #6b7280;
  flex-shrink: 0;
}

.date-text {
  color: #4b5563;
  font-size: 0.875rem;
}

/* Actions Column */
.td-actions {
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.btn-edit,
.btn-delete {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-edit {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-edit:hover {
  background: #e5e7eb;
  color: #374151;
  transform: translateY(-1px);
}

.btn-delete {
  background: #fef2f2;
  color: #dc2626;
}

.btn-delete:hover {
  background: #fecaca;
  color: #b91c1c;
  transform: translateY(-1px);
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .users-table th,
  .users-table td {
    padding: 0.875rem 1.25rem;
  }
  
  .th-name {
    min-width: 180px;
  }
  
  .th-email {
    min-width: 220px;
  }
}

@media (max-width: 968px) {
  .users-table th,
  .users-table td {
    padding: 0.75rem 1rem;
  }
  
  .th-name {
    min-width: 160px;
  }
  
  .th-email {
    min-width: 200px;
  }
  
  .th-section {
    width: 80px;
  }
  
  .th-joined {
    width: 120px;
  }
  
  .th-actions {
    width: 100px;
  }
}

@media (max-width: 768px) {
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .users-table {
    min-width: 600px;
  }

  .users-table th,
  .users-table td {
    padding: 0.75rem 0.875rem;
  }
  
  .th-name {
    min-width: 140px;
  }
  
  .th-email {
    min-width: 180px;
  }
  
  .th-section {
    width: 70px;
  }
  
  .th-joined {
    width: 100px;
  }
  
  .th-actions {
    width: 90px;
  }
  
  .user-name {
    font-size: 0.8rem;
  }
  
  .email-text {
    font-size: 0.8rem;
  }
  
  .section-text {
    font-size: 0.75rem;
    padding: 0.125rem 0.375rem;
  }
  
  .date-text {
    font-size: 0.75rem;
  }
  
  .btn-edit,
  .btn-delete {
    padding: 0.375rem;
  }
  
  .btn-icon {
    width: 0.875rem;
    height: 0.875rem;
  }
}

@media (max-width: 640px) {
  /* Table styles for screens that still show table */
  .users-table {
    min-width: 500px;
  }
  
  .users-table th,
  .users-table td {
    padding: 0.625rem 0.75rem;
  }
  
  .th-name {
    min-width: 120px;
  }
  
  .th-email {
    min-width: 160px;
  }
  
  .th-section {
    width: 60px;
  }
  
  .th-joined {
    width: 80px;
  }
  
  .th-actions {
    width: 80px;
  }
  
  .avatar-circle {
    width: 2rem;
    height: 2rem;
  }
  
  .avatar-icon {
    width: 1rem;
    height: 1rem;
  }
  
  .user-name {
    font-size: 0.75rem;
  }
  
  .email-text {
    font-size: 0.75rem;
  }
  
  .section-text {
    font-size: 0.7rem;
    padding: 0.125rem 0.25rem;
  }
  
  .date-text {
    font-size: 0.7rem;
  }
  
  .btn-edit,
  .btn-delete {
    padding: 0.25rem;
  }
  
  .btn-icon {
    width: 0.75rem;
    height: 0.75rem;
  }
}

@media (max-width: 480px) {
  .users-table {
    min-width: 450px;
  }
  
  .users-table th,
  .users-table td {
    padding: 0.5rem 0.625rem;
  }
  
  .th-name {
    min-width: 100px;
  }
  
  .th-email {
    min-width: 140px;
  }
  
  .th-section {
    width: 50px;
  }
  
  .th-joined {
    width: 70px;
  }
  
  .th-actions {
    width: 70px;
  }
  
  .avatar-circle {
    width: 1.75rem;
    height: 1.75rem;
  }
  
  .avatar-icon {
    width: 0.875rem;
    height: 0.875rem;
  }
  
  .user-name {
    font-size: 0.7rem;
  }
  
  .email-text {
    font-size: 0.7rem;
  }
  
  .section-text {
    font-size: 0.65rem;
    padding: 0.125rem 0.25rem;
  }
  
  .date-text {
    font-size: 0.65rem;
  }
  
  .btn-edit,
  .btn-delete {
    padding: 0.25rem;
  }
  
  .btn-icon {
    width: 0.625rem;
    height: 0.625rem;
  }
}

/* Tablet Layout - Keep table with horizontal scroll */
@media (max-width: 768px) and (min-width: 641px) {
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .users-table {
    min-width: 600px;
  }
  
  .mobile-cards {
    display: none;
  }
}

/* Mobile Card Layout for Mobile Screens */
@media (max-width: 640px) {
  .table-wrapper {
    overflow: visible;
  }
  
  .users-table {
    display: none;
  }
  
  .mobile-cards {
    display: block;
  }
}

.mobile-cards {
  display: none;
}

.mobile-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.mobile-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.mobile-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.mobile-card-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mobile-card-avatar.instructor {
  background: #dbeafe;
  color: #3b82f6;
}

.mobile-card-avatar.student {
  background: #dcfce7;
  color: #16a34a;
}

.mobile-card-info {
  flex: 1;
  min-width: 0;
}

.mobile-card-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.mobile-card-email {
  color: #6b7280;
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-card-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.mobile-card-detail {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.mobile-card-detail-label {
  font-size: 0.7rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.mobile-card-detail-value {
  font-size: 0.8rem;
  color: #374151;
  font-weight: 500;
}

.mobile-card-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.mobile-card-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-card-btn.edit {
  background: #f3f4f6;
  color: #6b7280;
}

.mobile-card-btn.edit:hover {
  background: #e5e7eb;
  color: #374151;
}

.mobile-card-btn.delete {
  background: #fef2f2;
  color: #dc2626;
}

.mobile-card-btn.delete:hover {
  background: #fecaca;
  color: #b91c1c;
}

.mobile-card-btn svg {
  width: 1rem;
  height: 1rem;
}

/* Mobile Card Responsive Styles */
@media (max-width: 480px) {
  .mobile-card {
    padding: 0.875rem;
    margin-bottom: 0.875rem;
  }
  
  .mobile-card-header {
    gap: 0.625rem;
    margin-bottom: 0.625rem;
  }
  
  .mobile-card-avatar {
    width: 2.25rem;
    height: 2.25rem;
  }
  
  .mobile-card-name {
    font-size: 0.8rem;
  }
  
  .mobile-card-email {
    font-size: 0.7rem;
  }
  
  .mobile-card-details {
    gap: 0.625rem;
    margin-bottom: 0.625rem;
  }
  
  .mobile-card-detail-label {
    font-size: 0.65rem;
  }
  
  .mobile-card-detail-value {
    font-size: 0.75rem;
  }
  
  .mobile-card-actions {
    gap: 0.375rem;
  }
  
  .mobile-card-btn {
    padding: 0.375rem;
  }
  
  .mobile-card-btn svg {
    width: 0.875rem;
    height: 0.875rem;
  }
}

@media (max-width: 360px) {
  .mobile-card {
    padding: 0.75rem;
    margin-bottom: 0.75rem;
  }
  
  .mobile-card-header {
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .mobile-card-avatar {
    width: 2rem;
    height: 2rem;
  }
  
  .mobile-card-name {
    font-size: 0.75rem;
  }
  
  .mobile-card-email {
    font-size: 0.65rem;
  }
  
  .mobile-card-details {
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .mobile-card-detail-label {
    font-size: 0.6rem;
  }
  
  .mobile-card-detail-value {
    font-size: 0.7rem;
  }
  
  .mobile-card-actions {
    gap: 0.25rem;
  }
  
  .mobile-card-btn {
    padding: 0.25rem;
  }
  
  .mobile-card-btn svg {
    width: 0.75rem;
    height: 0.75rem;
  }
}
</style>
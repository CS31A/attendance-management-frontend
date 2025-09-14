<script setup>
</script>

<template>
  <div class="auth-checking">
    <div class="spinner"></div>
    <p>Checking authentication...</p>
  </div>
</template>

<style scoped>
.auth-checking {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  background-color: #f8fafc;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

p {
  font-family: 'Inter', sans-serif;
  color: #64748b;
  font-size: 16px;
  font-weight: 500;
}
</style>
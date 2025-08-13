<template>
  <div class="app">
    <Sidebar />
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script>  
import Sidebar from './components/sidebar.vue'

export default {
  components: { Sidebar }
}
</script>

<style>
.app {
  display: flex;
}
.main-content {
  margin-left: 250px;
  padding: 20px;
  width: 100%;
}
</style>

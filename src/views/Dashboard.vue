<script setup>
import { ref } from 'vue'

// Reactive data
const totalStudents = ref(30)
const presentToday = ref(25)
const recentLogs = ref([
  { name: 'Christian Sayson', time: '8:01 AM' },
  { name: 'Christina Cassandra', time: '8:05 AM' },
  { name: 'Jose Rizal', time: '8:10 AM' },
])
</script>

<template>
  <div class="dashboard">
    <h1 class="title">Dashboard</h1>

    <div class="summary-cards">
      <div class="card total">
        <h3>Total Students</h3>
        <p>30</p>
      </div>
      <div class="card present">
        <h3>Present Today</h3>
        <p>25</p>
      </div>
      <div class="card absent">
        <h3>Absent Today</h3>
        <p>5</p>
      </div>
    </div>

    <div class="recent-activity">
      <h2>Recent Attendance</h2>
      <ul>
        <li v-for="(log, index) in recentLogs" :key="index">
          {{ log.name }} - {{ log.time }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 20px;
}

.title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 20px;
}

.summary-cards {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 30px;
}

.card {
  flex: 1;
  min-width: 200px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-left: 5px solid #0f71d3;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.card h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #4b5563;
}

.card p {
  font-size: 24px;
  font-weight: bold;
  color: #111827;
}

.recent-activity h2 {
  font-size: 22px;
  margin-bottom: 10px;
}

.recent-activity ul {
  list-style: none;
  padding: 0;
}

.recent-activity li {
  background: #f3f4f6;
  margin-bottom: 8px;
  padding: 10px 15px;
  border-radius: 5px;
  font-size: 16px;
}
</style>

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const pinia = createPinia()
const app = createApp(App)

app.use(router)
app.use(pinia)

router.isReady().then(() => {
  app.mount('#app')
})

// Alternative approach - mount immediately but let App.vue handle auth initialization
// app.mount('#app')

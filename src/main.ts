import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/theme.css'
import './assets/base-styles.css'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)

router.isReady().then(() => {
  app.mount('#app')
})

// Alternative approach - mount immediately but let App.vue handle auth initialization
// app.mount('#app')

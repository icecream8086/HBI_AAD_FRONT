import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import store from './store'
import i18n from './i18n'
import { API } from './api'
import { installContractCheck } from './api/contract'
import './assets/themes/index.css'
import './assets/themes/light.css'
import './assets/themes/dark.css'
import './assets/themes/morandi.css'
import './assets/themes/forest.css'
import './assets/themes/ocean.css'
import './assets/themes/sakura.css'
import './assets/themes/gnu.css'
import './assets/themes/frutiger.css'

if (process.env.NODE_ENV === 'development') {
  installContractCheck(API)
}

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(i18n)
app.use(store)
app.use(router)
app.mount('#app')

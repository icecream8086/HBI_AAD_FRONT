import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import store from './store'
import i18n from './i18n'
import './assets/themes/index.css'
import './assets/themes/light.css'
import './assets/themes/dark.css'
import './assets/themes/morandi.css'
import './assets/themes/forest.css'
import './assets/themes/ocean.css'
import './assets/themes/sakura.css'
import './assets/themes/gnu.css'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(i18n)
app.use(store)
app.use(router)
app.mount('#app')

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

// 抑制无害的 ResizeObserver 良性警告
// 原理：浏览器在单帧内无法交付所有 resize 回调时抛出此错误，已丢弃部分通知来保护性能，实质无害
const isROError = (msg: unknown): boolean =>
  typeof msg === 'string' && msg.includes('ResizeObserver loop')

// 方案1：全局补丁 ResizeObserver，从源头捕获（最可靠）
const _RO = window.ResizeObserver
window.ResizeObserver = class PatchedRO extends _RO {
  constructor(callback: ResizeObserverCallback) {
    super((entries, observer) => {
      try { callback(entries, observer) } catch (e) {
        if (e instanceof Error && isROError(e.message)) return
        throw e
      }
    })
  }
}

// 方案2：window error 事件兜底
const suppressRO = (e: ErrorEvent | PromiseRejectionEvent) => {
  const msg = (e as ErrorEvent).message || (e as PromiseRejectionEvent).reason?.message || ''
  if (isROError(msg)) {
    e.preventDefault?.()
    e.stopPropagation?.()
    return true
  }
  return false
}
// capture 阶段监听，确保在 webpack-dev-server overlay 之前处理
window.addEventListener('error', (e) => { if (suppressRO(e)) e.stopImmediatePropagation() }, true)
window.addEventListener('unhandledrejection', (e) => { if (suppressRO(e)) e.preventDefault() })

// 方案3：Vue errorHandler 静音
app.config.errorHandler = (err: unknown) => {
  if (err instanceof Error && isROError(err.message)) return
  console.error(err)
}

// 方案4：Vue warnHandler 静音（vue-dev-server overlay 会走这里）
app.config.warnHandler = (msg: string) => {
  if (isROError(msg)) return
  console.warn(msg)
}

app.mount('#app')

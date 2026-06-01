import { createStore, createLogger, type Store } from 'vuex'
import authModule from './modules/auth'
import appModule from './modules/app'

export type VuexStore = Store<State>

const store: VuexStore = createStore<State>({
  modules: {
    auth: authModule,
    app: appModule,
  },
  plugins: process.env.NODE_ENV !== 'production' ? [createLogger()] : [],
})

export function useAppStore(): VuexStore {
  return store
}

export default store

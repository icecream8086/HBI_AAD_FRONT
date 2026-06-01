import { createStore, createLogger, type Store } from 'vuex'
import userModule from './modules/user'
import appModule from './modules/app'
import draftModule from './modules/draft'

export type VuexStore = Store<State>

const store: VuexStore = createStore<State>({
  modules: {
    user: userModule,
    app: appModule,
    draft: draftModule,
  },
  plugins: process.env.NODE_ENV !== 'production' ? [createLogger()] : [],
})

export function useStore(): VuexStore {
  return store
}

export default store

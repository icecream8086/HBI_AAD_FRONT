import { useStore as vuexUseStore } from 'vuex'
import type { Store } from 'vuex'

export function useStore(): Store<State> {
  return vuexUseStore()
}

export function useState() {
  const store = useStore()
  return store.state
}

export function useGetters() {
  const store = useStore()
  return store.getters
}

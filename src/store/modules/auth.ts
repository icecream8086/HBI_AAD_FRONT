import { Module } from 'vuex'

const state: AuthState = {
  token: localStorage.getItem('access_token') || null,
  currentUser: null,
  isLoggedIn: !!localStorage.getItem('access_token'),
}

const authModule: Module<AuthState, State> = {
  namespaced: true,
  state,
  mutations: {
    SET_TOKEN(s, token: string | null) {
      s.token = token
      s.isLoggedIn = !!token
      if (token) {
        localStorage.setItem('access_token', token)
      } else {
        localStorage.removeItem('access_token')
      }
    },
    SET_USER(s, user: User | null) {
      s.currentUser = user
    },
    CLEAR_AUTH(s) {
      s.token = null
      s.currentUser = null
      s.isLoggedIn = false
      localStorage.removeItem('access_token')
    },
  },
  actions: {
    setToken({ commit }, token: string) {
      commit('SET_TOKEN', token)
    },
    setUser({ commit }, user: User) {
      commit('SET_USER', user)
    },
    logout({ commit }) {
      commit('CLEAR_AUTH')
    },
  },
  getters: {
    isLoggedIn: (s) => s.isLoggedIn,
    currentUser: (s) => s.currentUser,
    isRoot: (s) => s.currentUser?.role === 'root',
    isOperator: (s) => s.currentUser?.role === 'root' || s.currentUser?.role === 'Operator',
  },
}

export default authModule

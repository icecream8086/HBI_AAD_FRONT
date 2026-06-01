import { Module } from 'vuex'

const state: AppState = {
  theme: localStorage.getItem('theme') || 'light',
  language: localStorage.getItem('language') || 'zh-CN',
  sidebarCollapsed: false,
}

type AppModuleState = typeof state

const appModule: Module<AppModuleState, State> = {
  namespaced: true,
  state,
  mutations: {
    SET_THEME(state, theme: string) {
      state.theme = theme
      localStorage.setItem('theme', theme)
    },
    SET_LANGUAGE(state, language: string) {
      state.language = language
      localStorage.setItem('language', language)
    },
    TOGGLE_SIDEBAR(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
  },
  actions: {
    setTheme({ commit }, theme: string) {
      commit('SET_THEME', theme)
    },
    setLanguage({ commit }, language: string) {
      commit('SET_LANGUAGE', language)
    },
    toggleSidebar({ commit }) {
      commit('TOGGLE_SIDEBAR')
    },
  },
}

export default appModule

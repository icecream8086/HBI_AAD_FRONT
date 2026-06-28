import type { Module } from 'vuex'
import type { ThemeId } from '../../assets/themes/registry'

export type LocaleId = 'zh-CN' | 'en'

const state = {
  theme: (localStorage.getItem('theme') || 'light') as ThemeId,
  language: (localStorage.getItem('language') || 'zh-CN') as LocaleId,
  sidebarCollapsed: false,
}

type AppModuleState = typeof state

const appModule: Module<AppModuleState, State> = {
  namespaced: true,
  state,
  mutations: {
    SET_THEME(state, theme: ThemeId) {
      state.theme = theme
      localStorage.setItem('theme', theme)
    },
    SET_LANGUAGE(state, language: LocaleId) {
      state.language = language
      localStorage.setItem('language', language)
    },
    TOGGLE_SIDEBAR(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
  },
  actions: {
    setTheme({ commit }, theme: ThemeId) {
      commit('SET_THEME', theme)
    },
    setLanguage({ commit }, language: LocaleId) {
      commit('SET_LANGUAGE', language)
    },
    toggleSidebar({ commit }) {
      commit('TOGGLE_SIDEBAR')
    },
  },
}

export default appModule

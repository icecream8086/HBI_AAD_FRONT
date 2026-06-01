import { Module } from 'vuex'

const state: DraftState = {
  items: {},
}

type DraftModuleState = typeof state

const draftModule: Module<DraftModuleState, State> = {
  namespaced: true,
  state,
  mutations: {
    SET_DRAFT(state, { key, value }: { key: string; value: unknown }) {
      state.items[key] = value
    },
    REMOVE_DRAFT(state, key: string) {
      delete state.items[key]
    },
    CLEAR_ALL_DRAFTS(state) {
      state.items = {}
    },
  },
  actions: {
    saveDraft({ commit }, payload: { key: string; value: unknown }) {
      commit('SET_DRAFT', payload)
    },
    removeDraft({ commit }, key: string) {
      commit('REMOVE_DRAFT', key)
    },
    clearAll({ commit }) {
      commit('CLEAR_ALL_DRAFTS')
    },
  },
  getters: {
    getDraft: (state) => (key: string) => state.items[key] ?? null,
  },
}

export default draftModule

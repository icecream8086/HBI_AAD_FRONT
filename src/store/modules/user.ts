import { Module } from 'vuex'

const state: UserState = {
  currentUser: null,
  role: null,
  permissions: [],
}

type UserModuleState = typeof state

const userModule: Module<UserModuleState, State> = {
  namespaced: true,
  state,
  mutations: {
    SET_USER(state, user: User) {
      state.currentUser = user
    },
    SET_ROLE(state, role: Role) {
      state.role = role
      state.permissions = role.permissions
    },
    SET_PERMISSIONS(state, permissions: string[]) {
      state.permissions = permissions
    },
    CLEAR_USER(state) {
      state.currentUser = null
      state.role = null
      state.permissions = []
    },
  },
  actions: {
    setUser({ commit }, user: User) {
      commit('SET_USER', user)
    },
    setRole({ commit }, role: Role) {
      commit('SET_ROLE', role)
    },
    logout({ commit }) {
      commit('CLEAR_USER')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    },
  },
  getters: {
    isLoggedIn: (state) => state.currentUser !== null,
    hasPermission: (state) => (permission: string) =>
      state.permissions.includes(permission),
  },
}

export default userModule

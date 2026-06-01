import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ path: '/login' }),
}))

describe('Login.vue', () => {
  it('renders successfully', async () => {
    const store = createStore<State>({
      modules: {
        auth: {
          namespaced: true,
          state: { token: null, currentUser: null, isLoggedIn: false },
          mutations: { SET_TOKEN: vi.fn(), SET_USER: vi.fn() },
        },
      },
    })

    const Login = await import('../../../src/views/Login.vue')
    const wrapper = shallowMount(Login.default, {
      global: {
        plugins: [store],
        stubs: {
          'el-card': { template: '<div><slot name="header" /><slot /></div>' },
          'el-tabs': { template: '<div><slot /></div>' },
          'el-tab-pane': { template: '<div><slot /></div>' },
          'el-form': { template: '<div><slot /></div>' },
          'el-form-item': { template: '<div><slot /></div>' },
          'el-input': { template: '<input />' },
          'el-button': { template: '<button><slot /></button>' },
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('HBI AAD')
  })
})

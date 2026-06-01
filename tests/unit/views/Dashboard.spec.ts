import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'

vi.mock('../../../src/api', () => ({
  api: {
    info: { infoGet: vi.fn() },
    sandboxes: { apiSandboxesGet: vi.fn() },
    templates: { apiTemplatesGet: vi.fn() },
    images: { apiImagesGet: vi.fn() },
    users: { apiUsersGet: vi.fn() },
    extract: vi.fn(),
  },
}))

describe('Dashboard.vue', () => {
  it('renders successfully', async () => {
    const store = createStore<State>({
      modules: {
        auth: {
          namespaced: true,
          state: { token: 'test', currentUser: null, isLoggedIn: true },
          getters: { isLoggedIn: () => true },
        },
      },
    })

    const Dashboard = await import('../../../src/views/Dashboard.vue')
    const wrapper = shallowMount(Dashboard.default, {
      global: {
        plugins: [store],
        stubs: {
          'el-row': { template: '<div><slot /></div>' },
          'el-col': { template: '<div><slot /></div>' },
          'el-card': { template: '<div><slot name="header" /><slot /></div>' },
          'el-descriptions': { template: '<div><slot /></div>' },
          'el-descriptions-item': { template: '<div><slot /></div>' },
          'el-tag': { template: '<span><slot /></span>' },
          'el-button': { template: '<button><slot /></button>' },
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
  })
})

import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import zhCN from '../../../src/i18n/locales/zh-CN'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': zhCN, en: {} },
})

describe('Profile.vue', () => {
  it('renders user info when logged in', async () => {
    const user: User = {
      id: 'u1',
      email: 'test@test.com',
      name: 'Test User',
      role: 'Viewer',
      createdAt: 1000,
      updatedAt: 1000,
      privateKeyEd25519: '',
    }

    const store = createStore<State>({
      modules: {
        auth: {
          namespaced: true,
          state: { token: 'test', currentUser: user, isLoggedIn: true },
        },
      },
    })

    const Profile = await import('../../../src/views/Profile.vue')
    const wrapper = shallowMount(Profile.default, {
      global: {
        plugins: [store, i18n],
        stubs: {
          'el-card': { template: '<div><slot /></div>' },
          'el-descriptions': { template: '<div><slot /></div>' },
          'el-descriptions-item': { template: '<div><slot /></div>' },
          'el-tag': { template: '<span><slot /></span>' },
          'el-dialog': { template: '<div><slot /></div>' },
          'el-form': { template: '<div><slot /></div>' },
          'el-form-item': { template: '<div><slot /></div>' },
          'el-input': { template: '<input />' },
          'el-button': { template: '<button><slot /></button>' },
          'el-empty': { template: '<div><slot /></div>' },
          'el-upload': { template: '<div><slot /></div>' },
          'el-avatar': { template: '<span><slot /></span>' },
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Test User')
    expect(wrapper.text()).toContain('test@test.com')
    expect(wrapper.text()).toContain('Viewer')
  })

  it('renders without crashing when no user', async () => {
    const store = createStore<State>({
      modules: {
        auth: {
          namespaced: true,
          state: { token: null, currentUser: null, isLoggedIn: false },
        },
      },
    })

    const Profile = await import('../../../src/views/Profile.vue')
    const wrapper = shallowMount(Profile.default, {
      global: {
        plugins: [store, i18n],
        stubs: {
          'el-card': { template: '<div><slot /></div>' },
          'el-descriptions': { template: '<div><slot /></div>' },
          'el-descriptions-item': { template: '<div><slot /></div>' },
          'el-tag': { template: '<span><slot /></span>' },
          'el-dialog': { template: '<div><slot /></div>' },
          'el-form': { template: '<div><slot /></div>' },
          'el-form-item': { template: '<div><slot /></div>' },
          'el-input': { template: '<input />' },
          'el-button': { template: '<button><slot /></button>' },
          'el-empty': { template: '<div><slot /></div>' },
          'el-upload': { template: '<div><slot /></div>' },
          'el-avatar': { template: '<span><slot /></span>' },
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
  })
})

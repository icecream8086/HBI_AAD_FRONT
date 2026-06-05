import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { createI18n } from 'vue-i18n'
import zhCN from '../../../src/i18n/locales/zh-CN'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': zhCN, en: {} },
})

const profileStubs = {
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
  'el-row': { template: '<div><slot /></div>' },
  'el-col': { template: '<div><slot /></div>' },
}

function makeStore(user: User | null) {
  return createStore<State>({
    modules: {
      auth: {
        namespaced: true,
        state: {
          token: user ? 'sess_test' : null,
          currentUser: user,
          isLoggedIn: !!user,
        },
      },
    },
  })
}

describe('Avatar — Profile.vue', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('shows user initial in avatar fallback when logged in', async () => {
    const user: User = { id: 'u1', email: '', name: 'Alice', role: 'Viewer', createdAt: 1000, updatedAt: 1000, privateKeyEd25519: '' }
    const Profile = await import('../../../src/views/Profile.vue')
    const wrapper = shallowMount(Profile.default, {
      global: { plugins: [makeStore(user), i18n], stubs: profileStubs },
    })
    expect(wrapper.text()).toContain('Alice')
  })

  it('shows "U" in avatar fallback when user has no name or email', async () => {
    const user: User = { id: 'u2', email: '', name: '', role: 'Viewer', createdAt: 1000, updatedAt: 1000, privateKeyEd25519: '' }
    const Profile = await import('../../../src/views/Profile.vue')
    const wrapper = shallowMount(Profile.default, {
      global: { plugins: [makeStore(user), i18n], stubs: profileStubs },
    })
    expect(wrapper.text()).toContain('U')
  })

  it('shows email initial in avatar when name is empty but email exists', async () => {
    const user: User = { id: 'u3', email: 'bob@test.com', name: '', role: 'Viewer', createdAt: 1000, updatedAt: 1000, privateKeyEd25519: '' }
    const Profile = await import('../../../src/views/Profile.vue')
    const wrapper = shallowMount(Profile.default, {
      global: { plugins: [makeStore(user), i18n], stubs: profileStubs },
    })
    expect(wrapper.text()).toContain('B')
  })

  it('attempts avatar fetch with auth token on mount', async () => {
    vi.stubGlobal('localStorage', { getItem: vi.fn((k: string) => k === 'access_token' ? 'sess_abc' : null) })
    const user: User = { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'Viewer', createdAt: 1000, updatedAt: 1000, privateKeyEd25519: '' }
    const Profile = await import('../../../src/views/Profile.vue')
    shallowMount(Profile.default, {
      global: { plugins: [makeStore(user), i18n], stubs: profileStubs },
    })
    expect(fetch).toHaveBeenCalled()
    const call = (fetch as any).mock.calls[0]
    expect(call[0]).toContain('/api/users/u1/avatar')
    expect(call[1]?.headers?.Authorization).toBe('Bearer sess_abc')
  })

  it('does not fetch avatar when user has no id', async () => {
    const Profile = await import('../../../src/views/Profile.vue')
    shallowMount(Profile.default, {
      global: { plugins: [makeStore(null), i18n], stubs: profileStubs },
    })
    expect(fetch).not.toHaveBeenCalled()
  })
})


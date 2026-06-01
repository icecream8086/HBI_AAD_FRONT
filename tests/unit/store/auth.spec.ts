import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('auth store module', () => {
  const mockStorage = new Map<string, string>()

  async function loadModule() {
    vi.resetModules()
    return (await import('../../../src/store/modules/auth')).default as any
  }

  beforeEach(() => {
    mockStorage.clear()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((k: string) => mockStorage.get(k) ?? null),
      setItem: vi.fn((k: string, v: string) => mockStorage.set(k, v)),
      removeItem: vi.fn((k: string) => mockStorage.delete(k)),
      clear: vi.fn(() => mockStorage.clear()),
    })
    vi.clearAllMocks()
  })

  describe('state', () => {
    it('initializes with defaults when localStorage empty', async () => {
      const mod = await loadModule()
      expect(mod.state.token).toBeNull()
      expect(mod.state.currentUser).toBeNull()
      expect(mod.state.isLoggedIn).toBe(false)
    })

    it('initializes with token from localStorage', async () => {
      mockStorage.set('access_token', 'sess_test123')
      const mod = await loadModule()
      expect(mod.state.token).toBe('sess_test123')
      expect(mod.state.isLoggedIn).toBe(true)
    })
  })

  describe('mutations', () => {
    it('SET_TOKEN sets token and isLoggedIn', async () => {
      const mod = await loadModule()
      const s = { token: null, currentUser: null, isLoggedIn: false }
      mod.mutations.SET_TOKEN(s, 'sess_new')
      expect(s.token).toBe('sess_new')
      expect(s.isLoggedIn).toBe(true)
    })

    it('SET_TOKEN with null clears token', async () => {
      const mod = await loadModule()
      const s = { token: 'sess_old', currentUser: null, isLoggedIn: true }
      mod.mutations.SET_TOKEN(s, null)
      expect(s.token).toBeNull()
      expect(s.isLoggedIn).toBe(false)
    })

    it('SET_USER sets current user', async () => {
      const mod = await loadModule()
      const s = { token: null, currentUser: null, isLoggedIn: false }
      const user: User = {
        id: 'u1', email: 'test@test.com', name: 'Test',
        role: 'Viewer', createdAt: 1000, updatedAt: 1000, privateKeyEd25519: '',
      }
      mod.mutations.SET_USER(s, user)
      expect(s.currentUser?.email).toBe('test@test.com')
    })

    it('CLEAR_AUTH resets entire auth state', async () => {
      const mod = await loadModule()
      const s = { token: 'sess_test', currentUser: { id: 'u1' } as User, isLoggedIn: true }
      mod.mutations.CLEAR_AUTH(s)
      expect(s.token).toBeNull()
      expect(s.currentUser).toBeNull()
      expect(s.isLoggedIn).toBe(false)
    })
  })

  describe('actions', () => {
    it('setToken commits SET_TOKEN', async () => {
      const mod = await loadModule()
      const commit = vi.fn()
      await mod.actions.setToken({ commit }, 'sess_test')
      expect(commit).toHaveBeenCalledWith('SET_TOKEN', 'sess_test')
    })

    it('logout commits CLEAR_AUTH', async () => {
      const mod = await loadModule()
      const commit = vi.fn()
      await mod.actions.logout({ commit })
      expect(commit).toHaveBeenCalledWith('CLEAR_AUTH')
    })
  })

  describe('getters', () => {
    it('isLoggedIn returns state value', async () => {
      const mod = await loadModule()
      expect(mod.getters.isLoggedIn({ isLoggedIn: true })).toBe(true)
      expect(mod.getters.isLoggedIn({ isLoggedIn: false })).toBe(false)
    })

    it('isOperator checks root or Operator role', async () => {
      const mod = await loadModule()
      expect(mod.getters.isOperator({ currentUser: { role: 'root' } as User })).toBe(true)
      expect(mod.getters.isOperator({ currentUser: { role: 'Operator' } as User })).toBe(true)
      expect(mod.getters.isOperator({ currentUser: { role: 'Viewer' } as User })).toBe(false)
      expect(mod.getters.isOperator({ currentUser: null })).toBe(false)
    })
  })
})

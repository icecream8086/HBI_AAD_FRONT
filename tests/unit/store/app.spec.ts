import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('app store module', () => {
  const mockStorage = new Map<string, string>()

  async function loadModule() {
    vi.resetModules()
    return (await import('../../../src/store/modules/app')).default as any
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
      expect(mod.state.theme).toBe('light')
      expect(mod.state.language).toBe('zh-CN')
      expect(mod.state.sidebarCollapsed).toBe(false)
    })

    it('initializes from localStorage when values exist', async () => {
      mockStorage.set('theme', 'dark')
      mockStorage.set('language', 'en-US')
      const mod = await loadModule()
      expect(mod.state.theme).toBe('dark')
      expect(mod.state.language).toBe('en-US')
    })
  })

  describe('mutations', () => {
    it('SET_THEME updates theme', async () => {
      const mod = await loadModule()
      const s = { ...mod.state }
      mod.mutations.SET_THEME(s, 'dark')
      expect(s.theme).toBe('dark')
    })

    it('SET_LANGUAGE updates language', async () => {
      const mod = await loadModule()
      const s = { ...mod.state }
      mod.mutations.SET_LANGUAGE(s, 'en-US')
      expect(s.language).toBe('en-US')
    })

    it('TOGGLE_SIDEBAR toggles state', async () => {
      const mod = await loadModule()
      const s = { ...mod.state, sidebarCollapsed: false }
      mod.mutations.TOGGLE_SIDEBAR(s)
      expect(s.sidebarCollapsed).toBe(true)
      mod.mutations.TOGGLE_SIDEBAR(s)
      expect(s.sidebarCollapsed).toBe(false)
    })
  })

  describe('actions', () => {
    it('setTheme commits SET_THEME', async () => {
      const mod = await loadModule()
      const commit = vi.fn()
      await mod.actions.setTheme({ commit }, 'dark')
      expect(commit).toHaveBeenCalledWith('SET_THEME', 'dark')
    })

    it('toggleSidebar commits TOGGLE_SIDEBAR', async () => {
      const mod = await loadModule()
      const commit = vi.fn()
      await mod.actions.toggleSidebar({ commit })
      expect(commit).toHaveBeenCalledWith('TOGGLE_SIDEBAR')
    })
  })
})

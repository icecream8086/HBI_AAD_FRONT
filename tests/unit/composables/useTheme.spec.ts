import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

describe('useTheme', () => {
  const mockStorage = new Map<string, string>()

  async function loadModule() {
    vi.resetModules()
    return await import('../../../src/composables/useTheme')
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

  it('defaults to light theme when no theme stored', async () => {
    const { useTheme } = await loadModule()
    const theme = useTheme()
    expect(theme.theme.value).toBe('light')
    expect(theme.isDark.value).toBe(false)
  })

  it('reads theme from localStorage', async () => {
    mockStorage.set('theme', 'dark')
    const { useTheme } = await loadModule()
    const theme = useTheme()
    expect(theme.theme.value).toBe('dark')
    expect(theme.isDark.value).toBe(true)
  })

  it('toggleTheme switches between light and dark', async () => {
    const { useTheme } = await loadModule()
    const theme = useTheme()

    expect(theme.theme.value).toBe('light')
    theme.toggleTheme()

    await nextTick()
    expect(theme.theme.value).toBe('dark')
    expect(theme.isDark.value).toBe(true)
  })

  it('setTheme sets specific theme', async () => {
    const { useTheme } = await loadModule()
    const theme = useTheme()

    theme.setTheme('dark')
    await nextTick()
    expect(theme.theme.value).toBe('dark')
    expect(theme.isDark.value).toBe(true)

    theme.setTheme('light')
    await nextTick()
    expect(theme.theme.value).toBe('light')
    expect(theme.isDark.value).toBe(false)
  })

  it('sets data-theme attribute on document', async () => {
    const { useTheme } = await loadModule()
    const theme = useTheme()
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    theme.setTheme('dark')
    await nextTick()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})

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
    expect(theme.currentTheme.value).toBe('light')
  })

  it('reads theme from localStorage', async () => {
    mockStorage.set('app-theme', 'dark')
    const { useTheme } = await loadModule()
    const theme = useTheme()
    expect(theme.currentTheme.value).toBe('dark')
  })

  it('setTheme sets specific theme and applies css class', async () => {
    const { useTheme } = await loadModule()
    const theme = useTheme()

    theme.setTheme('dark')
    await nextTick()
    expect(theme.currentTheme.value).toBe('dark')
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true)

    theme.setTheme('light')
    await nextTick()
    expect(theme.currentTheme.value).toBe('light')
    expect(document.documentElement.classList.contains('theme-light')).toBe(true)
  })

  it('toggleTheme cycles through themes', async () => {
    const { useTheme } = await loadModule()
    const theme = useTheme()

    const initial = theme.currentTheme.value
    theme.toggleTheme()
    await nextTick()
    expect(theme.currentTheme.value).not.toBe(initial)
  })
})

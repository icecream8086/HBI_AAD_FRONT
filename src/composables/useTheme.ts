import { ref, watch } from 'vue'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'
const currentTheme = ref<Theme>((localStorage.getItem(STORAGE_KEY) as Theme) || 'light')

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  currentTheme.value = theme
}

export function useTheme() {
  const isDark = ref(currentTheme.value === 'dark')

  function toggleTheme(): void {
    const next: Theme = currentTheme.value === 'light' ? 'dark' : 'light'
    applyTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  function setTheme(theme: Theme): void {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }

  watch(currentTheme, (val) => {
    isDark.value = val === 'dark'
  })

  applyTheme(currentTheme.value)

  return {
    theme: currentTheme,
    isDark,
    toggleTheme,
    setTheme,
  }
}

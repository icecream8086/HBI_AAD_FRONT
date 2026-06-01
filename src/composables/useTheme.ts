import { ref, watch, computed } from 'vue'
import { THEMES, DEFAULT_THEME, type ThemeDef } from '../assets/themes/registry'

const STORAGE_KEY = 'app-theme'

function loadTheme(): string {
  const saved = localStorage.getItem(STORAGE_KEY)
  return THEMES.find(t => t.id === saved) ? saved! : DEFAULT_THEME
}

function applyTheme(id: string): void {
  const html = document.documentElement
  html.className = html.className
    .split(' ')
    .filter(c => !c.startsWith('theme-'))
    .join(' ')
  html.classList.add(`theme-${id}`)
}

const currentTheme = ref(loadTheme())
applyTheme(currentTheme.value)

export function useTheme() {
  const currentInfo = computed<ThemeDef>(() =>
    THEMES.find(t => t.id === currentTheme.value) ?? THEMES[0]
  )

  function setTheme(id: string): void {
    if (THEMES.find(t => t.id === id)) {
      currentTheme.value = id
    }
  }

  function toggleTheme(): void {
    const idx = THEMES.findIndex(t => t.id === currentTheme.value)
    const next = (idx + 1) % THEMES.length
    currentTheme.value = THEMES[next].id
  }

  watch(currentTheme, (val) => {
    localStorage.setItem(STORAGE_KEY, val)
    applyTheme(val)
  })

  return { themes: THEMES, currentTheme, currentInfo, setTheme, toggleTheme }
}

export function useTheme() {
  const theme = 'light'
  document.documentElement.setAttribute('data-theme', 'light')
  return { theme, isDark: false }
}

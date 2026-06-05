export interface ThemeDef {
  id: string
  name: string
  icon: string
}

export const THEMES: ThemeDef[] = [
  { id: 'light',    name: '亮色',   icon: 'Sunny' },
  { id: 'dark',     name: '暗色',   icon: 'Moon' },
  { id: 'morandi',  name: '莫兰迪', icon: 'MagicStick' },
  { id: 'forest',   name: '森林',   icon: 'Star' },
  { id: 'ocean',    name: '海洋',   icon: 'Cloudy' },
  { id: 'sakura',   name: '樱花',   icon: 'ColdDrink' },
  { id: 'gnu',      name: 'GNU',     icon: 'Cpu' },
  { id: 'frutiger', name: 'Frutiger', icon: 'Cherry' },
]

export const DEFAULT_THEME = 'light'

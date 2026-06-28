interface AuthState {
  token: string | null
  currentUser: User | null
  isLoggedIn: boolean
}

type ThemeId = import('../assets/themes/registry').ThemeId

interface AppState {
  theme: ThemeId
  language: 'zh-CN' | 'en'
  sidebarCollapsed: boolean
}

interface State {
  auth: AuthState
  app: AppState
}

interface AuthState {
  token: string | null
  currentUser: User | null
  isLoggedIn: boolean
}

interface AppState {
  theme: string
  language: string
  sidebarCollapsed: boolean
}

interface State {
  auth: AuthState
  app: AppState
}

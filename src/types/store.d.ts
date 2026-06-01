interface UserState {
  currentUser: User | null
  role: Role | null
  permissions: string[]
}

interface AppState {
  theme: string
  language: string
  sidebarCollapsed: boolean
}

interface DraftState {
  items: Record<string, unknown>
}

interface State {
  user: UserState
  app: AppState
  draft: DraftState
}

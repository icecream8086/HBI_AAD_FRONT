type UserRole = 'root' | 'Operator' | 'Viewer' | 'wheel'

interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: number
  updatedAt: number
  privateKeyEd25519: string
}

interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest {
  email: string
  password: string
  name: string
  role?: UserRole
}

interface AuthResponse {
  token: string
  user: User
}

interface LoginInfo {
  exists: boolean
  methods: ('password' | 'no-password')[]
  policy?: LoginPolicy | null
}

interface LoginPolicy {
  enabled: boolean
  timeRanges: { start: string; end: string; days: number[] }[]
  allowedCIDRs: string[]
}

interface NoPasswordLoginRequest {
  email: string
  oneTimeKey: string
}

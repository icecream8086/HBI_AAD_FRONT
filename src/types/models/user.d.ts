interface User {
  id: string
  username: string
  realName: string
  email: string
  avatar?: string
  roleId: string
  hospitalId: string
  createdAt: string
}

interface Role {
  id: string
  name: string
  permissions: string[]
}

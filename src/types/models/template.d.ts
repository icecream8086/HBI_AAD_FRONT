type TemplateVisibility = 'public' | 'private'

interface SandboxTemplate {
  id: string
  name: string
  spec: TemplateSpec
  dependsOn?: string[]
  visibility: TemplateVisibility
  creatorId: string
  instanceLimit?: { fixed?: number; perSystem?: number; perUser?: number }
  resourceBinding?: { domain?: string; port?: number }
  createdAt: number
  updatedAt: number
}

interface TemplateSpec {
  containers: TemplateContainerSpec[]
  network?: NetworkSpec
  storage?: StorageSpec[]
  labels?: Record<string, string>
}

interface TemplateContainerSpec {
  name: string
  image: string
  command?: string[]
  env?: Record<string, string>
  ports?: { container: number; host?: number; protocol?: string }[]
  resources?: { cpu?: number; memory?: string }
  volumes?: { name: string; mountPath: string; subPath?: string }[]
}

interface CreateTemplateRequest {
  name: string
  spec: TemplateSpec
  dependsOn?: string[]
  visibility?: TemplateVisibility
  instanceLimit?: { fixed?: number; perSystem?: number; perUser?: number }
  resourceBinding?: { domain?: string; port?: number }
}

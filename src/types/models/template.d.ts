type TemplateVisibility = 'public' | 'private'
type ApiVersion = 'hbi-aad/v1' | 'hbi-aad/v2'
type TemplateKind = 'Container' | 'ContainerGroup'

interface PodResources {
  cpu: string
  memory: string
}

interface ServiceDef {
  image: string
  command?: string[]
  ports?: { containerPort: number; protocol: string }[]
  resources: PodResources
  dependsOn?: string[]
  env?: { name: string; value?: string }[]
}

interface PodSpec {
  name: string
  region: string
  resources: PodResources
  services: Record<string, ServiceDef>
}

interface SandboxTemplate {
  id: string
  name: string
  description?: string
  dependsOn?: string[]
  createdAt: number
  updatedAt: number
  creatorId?: string
  visibility?: TemplateVisibility
  userGroupIds?: string[]
  apiVersion?: ApiVersion
  kind?: TemplateKind
  podSpec?: PodSpec
  singleton?: boolean
  instanceLimit?: { type: 'fixed' | 'perUser' | 'perSystem'; max: number }
  resourceBinding?: { domain?: string; port?: number }
  container?: ContainerSpec
  healthChecks?: HealthCheckDef[]
  network?: TemplateNetworkSpec
  extensions?: TemplateExtensions
}

interface ContainerSpec {
  region: string
  zone?: string
  instanceId?: string
  account?: string
  restartPolicy?: string
  containers: ContainerDef[]
  initContainers?: ContainerDef[]
}

interface ContainerDef {
  name: string
  image: string
  command?: string[]
  args?: string[]
  env?: { name: string; value?: string; valueFrom?: string }[]
  ports?: { containerPort: number; protocol?: string }[]
  resources?: {
    requests?: { cpu?: number; memory?: number }
    limits?: { cpu?: number; memory?: number; gpu?: number; gpuType?: string }
  }
}

interface HealthCheckDef {
  name: string
  target: string
  type: 'liveness' | 'readiness' | 'startup'
  probe: ProbeSpec
  initialDelaySeconds?: number
  periodSeconds?: number
  timeoutSeconds?: number
  successThreshold?: number
  failureThreshold?: number
}

interface TemplateNetworkSpec {
  mode?: 'public' | 'private' | 'vpc'
  publicIp?: { allocate?: boolean; bandwidth?: number }
  vpc?: { id?: string; instanceId?: string; subnetIds?: string[]; securityGroupId?: string }
  ipAddress?: string
}

interface TemplateExtensions {
  storage?: TemplateStorage[]
  spotStrategy?: string
  providerOverrides?: Record<string, unknown>
  healthMaxRetries?: number
  autoStart?: boolean
  webTerminal?: boolean
  lifecycleHooks?: Record<string, unknown>
}

interface TemplateStorage {
  name: string
  type: 'oss' | 'nfs' | 'hostPath' | 'emptyDir'
  mountPath: string
  oss?: { bucket: string; path: string; readOnly?: boolean }
  nfs?: { server: string; path: string; readOnly?: boolean }
  hostPath?: { path: string }
  size?: number
  providerOverrides?: Record<string, unknown>
}

interface CreateTemplateRequest {
  name: string
  description?: string
  apiVersion?: ApiVersion
  kind?: TemplateKind
  podSpec?: PodSpec
  container?: ContainerSpec
  healthChecks?: HealthCheckDef[]
  network?: TemplateNetworkSpec
  extensions?: TemplateExtensions
  dependsOn?: string[]
}

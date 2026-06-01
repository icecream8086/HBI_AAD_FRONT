type SandboxStatus = 'Pending' | 'Scheduling' | 'Running' | 'Stopped' | 'Terminated' | 'Failed' | 'Deleted'

interface Sandbox {
  id: string
  config: CreateSandboxInput
  status: SandboxStatus
  providerId: string
  network?: string
  containers: ContainerInfo[]
  events: SandboxEvent[]
  createdAt: number
  updatedAt: number
}

interface CreateSandboxInput {
  containers: ContainerSpec[]
  network?: NetworkSpec
  storage?: StorageSpec[]
  labels?: Record<string, string>
}

interface ContainerSpec {
  name: string
  image: string
  command?: string[]
  env?: Record<string, string>
  ports?: { container: number; host?: number; protocol?: string }[]
  resources?: { cpu?: number; memory?: string }
  volumes?: { name: string; mountPath: string; subPath?: string }[]
}

interface NetworkSpec {
  dns?: string[]
  hostname?: string
}

interface StorageSpec {
  name: string
  type: 'nfs' | 'hostPath' | 'emptyDir'
  nfs?: { server: string; path: string }
  hostPath?: string
  size?: string
  mountPath: string
}

interface ContainerInfo {
  name: string
  containerId: string
  status: string
  image: string
  ports?: { container: number; host: number }[]
  startedAt?: number
}

interface SandboxEvent {
  type: string
  message: string
  timestamp: number
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'unknown'
  lastCheck: number
  message?: string
}

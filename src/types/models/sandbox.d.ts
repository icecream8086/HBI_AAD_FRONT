type SandboxStatus = 'Pending' | 'Scheduling' | 'Running' | 'Stopped' | 'Terminated' | 'Failed' | 'Deleted'

interface Sandbox {
  id: string
  config: CreateSandboxInput
  status: SandboxStatus
  providerId?: string
  network: NetworkInfo
  containers: ContainerRuntime[]
  conditions?: PodCondition[]
  events: ContainerEvent[]
  createdAt: number
  updatedAt: number
}

interface CreateSandboxInput {
  name: string
  description?: string
  region: string
  instanceId?: string
  resourceSpec: ResourceSpec
  spotStrategy: string
  restartPolicy: string
  initContainers?: InitContainerConfig[]
  containers: ContainerConfig[]
  volumes?: Volume[]
  network: SandboxNetworkConfig
  tags?: { key: string; value: string }[]
  account?: string
  healthMaxRetries?: number
  creatorId?: string
  providerOverrides?: Record<string, unknown>
}

interface ResourceSpec {
  cpu: number
  memory: number
  gpu?: number
  gpuType?: string
}

interface ContainerConfig {
  name: string
  image: string
  command?: string[]
  args?: string[]
  env?: { name: string; value?: string; valueFrom?: Record<string, unknown> }[]
  tty?: boolean
  stdin?: boolean
  imagePullPolicy?: 'Always' | 'IfNotPresent' | 'Never'
  resources?: ResourceRequirements
  volumeMounts?: VolumeMount[]
  ports?: { containerPort: number; hostPort?: number; protocol?: string }[]
  livenessProbe?: ProbeSpec
  readinessProbe?: ProbeSpec
  startupProbe?: ProbeSpec
  networkMode?: string
  providerOverrides?: Record<string, unknown>
}

interface InitContainerConfig extends ContainerConfig {
  restartPolicy?: 'Always' | 'OnFailure' | 'Never'
}

interface ContainerRuntime {
  name: string
  image: string
  cpu: number
  memory: number
  state: ContainerState
  volumeMounts: VolumeMount[]
  health?: { status: string; lastCheckedAt?: string; message?: string }
}

interface ContainerState {
  state: 'Running' | 'Waiting' | 'Terminated'
  startTime?: string
  ready: boolean
  restartCount: number
  message?: string
}

interface NetworkInfo {
  publicIp?: string
  privateIp?: string
  ipAddress?: string
  vpcId?: string
  subnetId?: string
  securityGroupId?: string
  eniId?: string
}

interface ContainerEvent {
  reason: string
  type: 'Normal' | 'Warning'
  message: string
  count: number
  lastTimestamp?: string
}

interface ContainerHealth {
  containerName: string
  status: string
  ready: boolean
  startedAt?: string
}

interface NetworkSpec {
  dns?: string[]
  hostname?: string
}

interface PodCondition {
  type: 'PodScheduled' | 'Initialized' | 'ContainersReady' | 'Ready'
  status: 'True' | 'False' | 'Unknown'
  lastTransitionTime?: string
  reason?: string
  message?: string
}

interface ResourceRequirements {
  requests?: { cpu: number; memory: number; gpu?: number }
  limits?: { cpu: number; memory: number; gpu?: number }
}

interface ProbeSpec {
  initialDelaySeconds?: number
  timeoutSeconds?: number
  periodSeconds?: number
  successThreshold?: number
  failureThreshold?: number
  httpGet?: { path: string; port: number; scheme?: string }
  exec?: { command: string[] }
  tcpSocket?: { port: number }
}

interface Volume {
  id: string
  name: string
  type: string
  nfs?: { server: string; path: string; readOnly: boolean }
  status?: string
  tags?: { key: string; value: string }[]
  createdAt?: number
  updatedAt?: number
}

interface VolumeMount {
  volumeId: string
  mountPath: string
  readOnly: boolean
  mountPropagation?: string
}

interface SandboxNetworkConfig {
  networkId?: string
  instanceId?: string
  subnetIds?: string[]
  securityGroupId?: string
  allocatePublicIp: boolean
  publicIpBandwidth?: number
  ipAddress?: string
}

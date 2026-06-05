type PodStatus = 'Pending' | 'Scheduling' | 'Running' | 'Stopped' | 'Terminated' | 'Failed' | 'Deleted'

interface PodInstance {
  id: string
  name?: string
  status: PodStatus
  providerId: string
  platform?: string
  region?: string
  containers: PodContainerRuntime[]
  network?: NetworkInfo
  conditions?: PodCondition[]
  events?: ContainerEvent[]
  createdAt: number
  updatedAt: number
}

interface PodContainerRuntime {
  name: string
  image: string
  state: string
  ready: boolean
  restartCount?: number
  startedAt?: string
}

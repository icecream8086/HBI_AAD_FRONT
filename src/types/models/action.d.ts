interface WorkflowDef {
  id: string
  name: string
  on: {
    manual?: boolean
    cron?: string
    push?: { branches?: string[] }
    http?: { signatureSecret?: string }
  }
  jobs: Record<string, JobDef>
  orgId?: string
  projectId?: string
  ownerId?: string
  createdAt: number
  updatedAt: number
}

interface JobDef {
  runsOn?: string
  needs?: string[]
  if?: string
  timeout?: number
  container?: {
    image: string
    resources?: { cpu?: number; memory?: number }
    ports?: { containerPort: number; protocol?: string }[]
  }
  containers?: { name: string; image: string; ports?: { containerPort: number; protocol?: string }[] }[]
  strategy?: { matrix: Record<string, unknown[]>; exclude?: Record<string, unknown>[] }
  steps: StepDef[]
  instanceId?: string
  region?: string
  approval?: { approvers: string[]; message?: string }
}

interface StepDef {
  name?: string
  run?: string
  uses?: string
  dns?: { action: 'upsert' | 'delete'; type: string; name: string; value: string; zoneId: string; proxied?: boolean }
  inputs?: Record<string, unknown>
  env?: Record<string, string>
  continueOnError?: boolean
  timeout?: number
}

type WorkflowRunStatus = 'Pending' | 'Running' | 'Success' | 'Failure' | 'Cancelled' | 'TimedOut'
type RunTrigger = 'manual' | 'cron' | 'http' | 'webhook' | 'shared_link'

interface WorkflowRun {
  id: string
  workflowId: string
  workflowName?: string
  status: WorkflowRunStatus
  trigger: RunTrigger
  jobRunRefs: { jobName: string; jobRunId: string }[]
  startedAt: number
  completedAt?: number
  error?: string
}

type JobRunStatus = 'Queued' | 'Running' | 'Success' | 'Failure' | 'Skipped' | 'Cancelled'

interface JobRun {
  jobName: string
  status: JobRunStatus
  sandboxId?: string
  stepRuns: { name: string; status: string; startedAt?: number; completedAt?: number; exitCode?: number; error?: string }[]
  startedAt?: number
  completedAt?: number
  error?: string
}

interface RunnerRegistration {
  id: string
  name: string
  status: 'online' | 'offline' | 'busy'
  labels?: Record<string, string>
  ip?: string
  version?: string
  lastHeartbeatAt?: number
  createdAt: number
}

interface ActionDef {
  id: string
  name: string
  version: string
  description?: string
  runs: { using: 'container' | 'node16'; image?: string; main?: string }
  inputs?: Record<string, { description?: string; required?: boolean; default?: unknown }>
  outputs?: Record<string, { description?: string }>
}

interface WorkflowSecret {
  id: string
  key: string
  workflowId: string
}

interface SharedLink {
  id: string
  workflowId: string
  name: string
  password?: string
  expiresAt?: number
  maxUses: number
  concurrentMax: number
  defaultTtlSeconds: number
  disabled?: boolean
  createdAt: number
}

interface ActionOrg {
  id: string
  name: string
  createdAt: number
}

interface ActionProject {
  id: string
  orgId: string
  name: string
  createdAt: number
}

interface ActionDashboard {
  totalRuns: number
  activeRuns: number
  successRate: number
  avgDurationMs: number
  runnersOnline: number
  byTrigger: Record<string, number>
  byStatus: Record<string, number>
}

interface ApprovalNode {
  id: string
  runId: string
  jobName: string
  approvers: string[]
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: number
}

interface RunDag {
  nodes: {
    jobName: string
    jobRunId: string
    status: string
    startedAt?: number
    completedAt?: number
  }[]
  edges: {
    from: string
    to: string
  }[]
}

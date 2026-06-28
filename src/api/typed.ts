// Typed API wrapper — same runtime as api, precise compile-time return types.
//
// Usage: import { api } from '@/api/typed'  (instead of from '@/api')
// Runtime: identical to raw api — zero overhead, pure type-level cast.
//
// 新增端点或修改返回类型时，TS 会强制在此处同步更新。

import { api as rawApi, type ApiResponse } from './index'

// 页面列表统一返回格式
interface PageResult<T> { items: T[]; total: number }

// ── 类型化 API 接口（唯一信源） ──

interface ApiTyped {
  // Auth
  auth: {
    register(data: RegisterRequest): Promise<AuthResponse>
    login(data: LoginRequest): Promise<AuthResponse>
    loginInfo(email: string): Promise<LoginInfo>
    noPasswordLogin(data: NoPasswordLoginRequest): Promise<AuthResponse>
    listSessions(): Promise<unknown[]>
    deleteSession(token: string): Promise<unknown>
    search(q: string): Promise<unknown>
  }

  // Info
  info: {
    get(): Promise<ServerInfo>
  }

  // Sandboxes
  sandboxes: {
    list(params?: Record<string, unknown>): Promise<{ items: Sandbox[]; nextCursor?: string }>
    get(id: string, params?: Record<string, unknown>): Promise<Sandbox>
    delete(id: string): Promise<unknown>
    stop(id: string): Promise<unknown>
    start(id: string): Promise<unknown>
    sync(id: string): Promise<unknown>
    health(id: string, params?: Record<string, unknown>): Promise<unknown>
    logs(id: string, params?: Record<string, unknown>): Promise<{ content: string; containerName?: string; timestamp?: number }>
  }

  // Pods (manual patch)
  pods: {
    list(params?: Record<string, unknown>): Promise<{ items: PodInstance[]; total?: number; nextCursor?: string }>
    get(providerId: string, params?: Record<string, unknown>): Promise<PodInstance>
    stop(providerId: string): Promise<unknown>
    delete(providerId: string): Promise<unknown>
    create(body?: object): Promise<unknown>
  }

  // Users
  users: {
    list(params?: Record<string, unknown>): Promise<PageResult<User>>
    get(id: string, params?: Record<string, unknown>): Promise<User>
    update(id: string, body?: object): Promise<unknown>
    delete(id: string): Promise<unknown>
    refresh(id: string, body?: object): Promise<unknown>
    search(params?: Record<string, unknown>): Promise<unknown>
    sessions: {
      list(params?: Record<string, unknown>): Promise<unknown>
      delete(token: string): Promise<unknown>
    }
    loginPolicy: {
      get(id: string, params?: Record<string, unknown>): Promise<unknown>
      update(id: string, body?: object): Promise<unknown>
      delete(id: string): Promise<unknown>
    }
    publicKey: {
      get(id: string, params?: Record<string, unknown>): Promise<unknown>
      update(id: string, body?: object): Promise<unknown>
      delete(id: string): Promise<unknown>
    }
    avatar: {
      get(id: string, params?: Record<string, unknown>): Promise<unknown>
      update(id: string, body?: object): Promise<unknown>
      delete(id: string): Promise<unknown>
    }
    supplementaryGroups: {
      list(id: string, params?: Record<string, unknown>): Promise<unknown>
      add(id: string, gid: string, body?: object): Promise<unknown>
      remove(id: string, gid: string): Promise<unknown>
    }
  }

  // Actions
  actions: {
    workflows: {
      list(params?: Record<string, unknown>): Promise<PageResult<WorkflowDef>>
      get(id: string, params?: Record<string, unknown>): Promise<WorkflowDef>
      create(body?: object): Promise<unknown>
      update(id: string, body?: object): Promise<unknown>
      delete(id: string): Promise<unknown>
      trigger(id: string, body?: object): Promise<unknown>
      http(id: string, body?: object): Promise<unknown>
      schedule(id: string, body?: object): Promise<unknown>
      secrets: {
        list(id: string, params?: Record<string, unknown>): Promise<unknown>
        create(id: string, body?: object): Promise<unknown>
      }
    }
    webhook: {
      create(body?: object): Promise<unknown>
    }
    runs: {
      list(params?: Record<string, unknown>): Promise<PageResult<WorkflowRun>>
      get(id: string, params?: Record<string, unknown>): Promise<WorkflowRun>
      cancel(id: string): Promise<unknown>
      rerun(id: string): Promise<unknown>
      jobs(id: string, params?: Record<string, unknown>): Promise<JobRun[]>
      dag(id: string, params?: Record<string, unknown>): Promise<RunDag>
      approvals: {
        list(id: string, params?: Record<string, unknown>): Promise<unknown>
        create(id: string, body?: object): Promise<unknown>
      }
    }
    jobs: {
      get(id: string, params?: Record<string, unknown>): Promise<JobRun>
      logs(id: string, params?: Record<string, unknown>): Promise<{ text: string }>
    }
    registry: {
      list(params?: Record<string, unknown>): Promise<PageResult<ActionDef>>
      create(body?: object): Promise<unknown>
    }
    orgs: {
      list(params?: Record<string, unknown>): Promise<PageResult<ActionOrg>>
      get(id: string, params?: Record<string, unknown>): Promise<ActionOrg>
      create(body?: object): Promise<unknown>
      addMember(id: string, body?: object): Promise<unknown>
    }
    projects: {
      list(params?: Record<string, unknown>): Promise<PageResult<ActionProject>>
      create(body?: object): Promise<unknown>
    }
    approvals: {
      decide(id: string, body?: object): Promise<unknown>
    }
    secrets: {
      delete(id: string): Promise<unknown>
    }
    sharedLinks: {
      list(params?: Record<string, unknown>): Promise<PageResult<SharedLink>>
      get(id: string, params?: Record<string, unknown>): Promise<SharedLink>
      create(body?: object): Promise<unknown>
      launch(id: string, body?: object): Promise<unknown>
      disable(id: string, body?: object): Promise<unknown>
    }
    runners: {
      list(params?: Record<string, unknown>): Promise<PageResult<RunnerRegistration>>
      get(id: string, params?: Record<string, unknown>): Promise<RunnerRegistration>
      drain(id: string, body?: object): Promise<unknown>
      heartbeat(body?: object): Promise<unknown>
    }
    workspace: {
      get(runId: string, jobName: string, params?: Record<string, unknown>): Promise<unknown>
    }
    dashboard: {
      stats(params?: Record<string, unknown>): Promise<ActionDashboard>
    }
    templates: {
      list(params?: Record<string, unknown>): Promise<PageResult<ActionTemplate>>
      get(id: string, params?: Record<string, unknown>): Promise<ActionTemplate>
    }
  }

  // Audit
  audit: {
    logs: {
      list(params?: Record<string, unknown>): Promise<{ entries?: unknown[]; items?: unknown[]; lines?: unknown[]; total: number; page?: number; pageSize?: number; hasNext?: boolean; nextCursor?: string }>
    }
    stats(): Promise<unknown>
  }

  // Container Secrets
  containerSecrets: {
    list(params?: Record<string, unknown>): Promise<PageResult<ContainerSecret>>
    get(id: string, params?: Record<string, unknown>): Promise<ContainerSecret>
    create(body?: object): Promise<unknown>
    update(id: string, body?: object): Promise<unknown>
    delete(id: string): Promise<unknown>
    upload(id: string, body?: object): Promise<unknown>
    download(id: string, params?: Record<string, unknown>): Promise<unknown>
    scopes: {
      get(id: string, params?: Record<string, unknown>): Promise<unknown>
      set(id: string, body?: object): Promise<unknown>
    }
    checkAccess(id: string, params?: Record<string, unknown>): Promise<unknown>
    publicKey(userId: string, params?: Record<string, unknown>): Promise<unknown>
  }

  // Events
  events: {
    getStatus(): Promise<{ running: boolean; paused: boolean; queueSize: number; processedCount: number; uptimeMs: number; config: { intervalMs: number; batchSize: number; autoStart: boolean; maxQueueSize: number } }>
    pending(): Promise<{ type: string; id: string }[]>
    start(): Promise<unknown>
    stop(): Promise<unknown>
    pause(): Promise<unknown>
    resume(): Promise<unknown>
    configure(body?: object): Promise<unknown>
    create(type: string, payload?: unknown): Promise<unknown>
  }

  // Images
  images: {
    list(params?: Record<string, unknown>): Promise<PageResult<ImageInfo>>
    get(id: string, params?: Record<string, unknown>): Promise<ImageInfo>
    delete(id: string): Promise<unknown>
    tag(id: string, body?: object): Promise<unknown>
    history(id: string, params?: Record<string, unknown>): Promise<unknown>
    pull(body?: object): Promise<unknown>
    search(params?: Record<string, unknown>): Promise<unknown>
    prune(body?: object): Promise<unknown>
    build(body?: object): Promise<unknown>
  }

  // Instances
  instances: {
    list(params?: Record<string, unknown>): Promise<PageResult<ComputeInstance>>
    get(id: string, params?: Record<string, unknown>): Promise<ComputeInstance>
    create(body?: object): Promise<unknown>
    update(id: string, body?: object): Promise<unknown>
    delete(id: string): Promise<unknown>
    heartbeat(id: string, body?: object): Promise<unknown>
    markStale(body?: object): Promise<unknown>
    registrationToken(body?: object): Promise<unknown>
    validateToken(body?: object): Promise<unknown>
    groups: {
      list(params?: Record<string, unknown>): Promise<PageResult<unknown>>
      get(id: string, params?: Record<string, unknown>): Promise<unknown>
      create(body?: object): Promise<unknown>
      delete(id: string): Promise<unknown>
    }
  }

  // Permissions
  permissions: {
    policies: {
      list(params?: Record<string, unknown>): Promise<PageResult<StoredPolicy>>
      get(id: string, params?: Record<string, unknown>): Promise<StoredPolicy>
      create(body?: object): Promise<unknown>
      update(id: string, body?: object): Promise<unknown>
      delete(id: string): Promise<unknown>
    }
    userGroups: {
      list(params?: Record<string, unknown>): Promise<PageResult<UserGroup>>
      get(id: string, params?: Record<string, unknown>): Promise<UserGroup>
      create(body?: object): Promise<unknown>
      update(id: string, body?: object): Promise<unknown>
      delete(id: string): Promise<unknown>
    }
    groups: {
      list(params?: Record<string, unknown>): Promise<PageResult<PermissionGroup>>
      get(id: string, params?: Record<string, unknown>): Promise<PermissionGroup>
      create(body?: object): Promise<unknown>
      update(id: string, body?: object): Promise<unknown>
      delete(id: string): Promise<unknown>
    }
    fromTemplate(templateId: string, body?: object): Promise<unknown>
    templates: {
      list(params?: Record<string, unknown>): Promise<PageResult<PermissionTemplate>>
      get(id: string, params?: Record<string, unknown>): Promise<PermissionTemplate>
    }
    userTemplates: {
      list(params?: Record<string, unknown>): Promise<PageResult<UserTemplate>>
      get(id: string, params?: Record<string, unknown>): Promise<UserTemplate>
      create(body?: object): Promise<unknown>
      update(id: string, body?: object): Promise<unknown>
      delete(id: string): Promise<unknown>
    }
    routeAcls: {
      list(params?: Record<string, unknown>): Promise<PageResult<RouteAcl>>
      get(id: string, params?: Record<string, unknown>): Promise<RouteAcl>
      create(body?: object): Promise<unknown>
      update(id: string, body?: object): Promise<unknown>
      delete(id: string): Promise<unknown>
    }
    invite(body?: object): Promise<unknown>
    invitations: {
      list(params?: Record<string, unknown>): Promise<PageResult<unknown>>
      accept(id: string, body?: object): Promise<unknown>
      reject(id: string, body?: object): Promise<unknown>
    }
    logPolicy: {
      get(): Promise<LogPolicy>
      update(body?: object): Promise<unknown>
    }
    caps: {
      user: {
        get(userId: string, params?: Record<string, unknown>): Promise<unknown>
        update(userId: string, body?: object): Promise<unknown>
      }
      group: {
        get(groupId: string, params?: Record<string, unknown>): Promise<unknown>
        update(groupId: string, body?: object): Promise<unknown>
      }
    }
    elevate: {
      create(body?: object): Promise<unknown>
      delete(userId: string): Promise<unknown>
    }
    elevations: {
      list(params?: Record<string, unknown>): Promise<PageResult<unknown>>
    }
    compare: {
      permGroups(idA: string, idB: string): Promise<unknown>
      userGroups(idA: string, idB: string): Promise<unknown>
    }
    check(body?: object): Promise<PermissionCheckResult>
  }

  // perm (convenience aliases)
  perm: {
    check(data: { userId: string; action: string; resource: string; ip?: string }): Promise<PermissionCheckResult>
    comparePermGroups(idA: string, idB: string): Promise<unknown>
    compareUserGroups(idA: string, idB: string): Promise<unknown>
    getLogPolicy(): Promise<LogPolicy>
    updateLogPolicy(data: Record<string, unknown>): Promise<unknown>
    getTemplates(): Promise<PermissionTemplate[]>
    invite(data: { groupId: string; inviteeId: string }): Promise<unknown>
    createUserGroup(data: { name: string; memberIds: string[]; adminIds?: string[]; dependsOn?: string[] }): Promise<unknown>
    updateUserGroup(id: string, data: { name: string; memberIds?: string[]; adminIds?: string[]; dependsOn?: string[] }): Promise<unknown>
  }

  // Platforms
  platforms: {
    list(params?: Record<string, unknown>): Promise<PageResult<unknown>>
    extensionFields(instanceId: string): Promise<ExtensionFieldGroup>
    regions(params?: { instanceId?: string; platform?: string }): Promise<{ platform: string; regions: { RegionId: string }[] }>
  }

  // Subnets
  subnets: {
    list(params?: Record<string, unknown>): Promise<PageResult<Subnet>>
    get(id: string, params?: Record<string, unknown>): Promise<Subnet>
    create(body?: object): Promise<unknown>
    update(id: string, body?: object): Promise<unknown>
    delete(id: string): Promise<unknown>
  }

  // Security Groups
  securityGroups: {
    list(params?: Record<string, unknown>): Promise<PageResult<SecurityGroup>>
    get(id: string, params?: Record<string, unknown>): Promise<SecurityGroup>
    create(body?: object): Promise<unknown>
    update(id: string, body?: object): Promise<unknown>
    delete(id: string): Promise<unknown>
  }

  // System Groups
  systemGroups: {
    list(params?: Record<string, unknown>): Promise<PageResult<SystemGroup>>
    get(id: string, params?: Record<string, unknown>): Promise<SystemGroup>
    create(body?: object): Promise<unknown>
    update(id: string, body?: object): Promise<unknown>
    delete(id: string): Promise<unknown>
  }

  // Templates
  templates: {
    list(params?: Record<string, unknown>): Promise<PageResult<SandboxTemplate>>
    get(id: string, params?: Record<string, unknown>): Promise<SandboxTemplate>
    create(body?: object): Promise<unknown>
    update(id: string, body?: object): Promise<unknown>
    delete(id: string): Promise<unknown>
    resolved(id: string, params?: Record<string, unknown>): Promise<unknown>
    apply(id: string, body?: object): Promise<unknown>
  }

  // Topology
  topology: {
    regions: {
      list(params?: Record<string, unknown>): Promise<unknown>
    }
    instances: {
      list(params?: Record<string, unknown>): Promise<PageResult<ComputeInstance>>
      get(id: string, params?: Record<string, unknown>): Promise<ComputeInstance>
      create(body?: object): Promise<unknown>
      update(id: string, body?: object): Promise<unknown>
      delete(id: string): Promise<unknown>
      heartbeat(id: string, body?: object): Promise<unknown>
    }
    buckets: {
      list(params?: Record<string, unknown>): Promise<PageResult<RegionBucket>>
      get(id: string, params?: Record<string, unknown>): Promise<RegionBucket>
      create(body?: object): Promise<unknown>
      update(id: string, body?: object): Promise<unknown>
      delete(id: string): Promise<unknown>
    }
    bucketPolicies: {
      list(bucketId: string, params?: Record<string, unknown>): Promise<unknown>
      create(bucketId: string, body?: object): Promise<unknown>
      get(id: string, params?: Record<string, unknown>): Promise<unknown>
      update(id: string, body?: object): Promise<unknown>
      delete(id: string): Promise<unknown>
    }
    images: {
      list(params?: Record<string, unknown>): Promise<PageResult<ImageRepository>>
      get(id: string, params?: Record<string, unknown>): Promise<ImageRepository>
      create(body?: object): Promise<unknown>
      update(id: string, body?: object): Promise<unknown>
      delete(id: string): Promise<unknown>
      pull(id: string, body?: object): Promise<unknown>
      tasks(id: string, params?: Record<string, unknown>): Promise<unknown>
    }
    pullTasks: {
      get(taskId: string, params?: Record<string, unknown>): Promise<PullTask>
    }
    volumes: {
      list(params?: Record<string, unknown>): Promise<PageResult<Volume>>
      get(id: string, params?: Record<string, unknown>): Promise<Volume>
      create(body?: object): Promise<unknown>
      update(id: string, body?: object): Promise<unknown>
      delete(id: string): Promise<unknown>
    }
    credentials: {
      list(params?: Record<string, unknown>): Promise<MaskedCredential[]>
      get(id: string, params?: Record<string, unknown>): Promise<MaskedCredential>
      create(body?: object): Promise<unknown>
      update(id: string, body?: object): Promise<unknown>
      delete(id: string): Promise<unknown>
    }
  }

  // Volumes (duplicate under topology, backward compat)
  volumes: {
    list(params?: Record<string, unknown>): Promise<PageResult<Volume>>
    get(id: string, params?: Record<string, unknown>): Promise<Volume>
    create(body?: object): Promise<unknown>
    update(id: string, body?: object): Promise<unknown>
    delete(id: string): Promise<unknown>
  }

  // Dev
  dev: {
    triggerTick(): Promise<unknown>
    migrateUserIndex(body?: object): Promise<unknown>
    sudo(body?: object): Promise<{ expiry: number }>
    openapi(): Promise<unknown>
  }

  // WebSocket
  ws: {
    notifications(params?: Record<string, unknown>): Promise<unknown>
  }

  // Extract helpers
  extract<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T>
  extractArray: typeof rawApi.extractArray
  extractItems: typeof rawApi.extractItems
  extractPage: typeof rawApi.extractPage
}

// 类型级 cast — 零运行时开销
export const api = rawApi as ApiTyped

// 重导出错误相关类型，方便视图使用
export { toAppError } from '../types/errors'
export type { AppError, ErrorConfig } from '../types/errors'

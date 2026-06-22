import globalAxios, { type AxiosPromise } from 'axios'
import { Configuration } from './generated/configuration'
import {
  AuditApi, ContainerSecretsApi, InfoApi, PermissionsApi,
  PlatformsApi, SandboxesApi, SystemGroupsApi, TemplatesApi, UsersApi,
} from './generated/api'

export interface ApiResponse<T> {
  success: boolean
  data: T
  error: null | { code: string; message: string }
}

function getToken(): string {
  return localStorage.getItem('access_token') || ''
}

export const API_BASE = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000'

const config = new Configuration({
  accessToken: getToken,
  basePath: API_BASE,
})

export const axios = globalAxios.create({ baseURL: API_BASE })

axios.interceptors.request.use((cfg) => {
  const token = getToken()
  if (token && cfg.headers) {
    cfg.headers.Authorization = `Bearer ${token}`
  }
  return cfg
})

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    if (status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/#/login'
    }
    if (status && status >= 500) {
      console.group(`[API 5xx] ${err.config?.method?.toUpperCase()} ${err.config?.url}`)
      console.log('请求体:', err.config?.data)
      console.log('响应体:', err.response?.data)
      console.groupEnd()
    }
    return Promise.reject(err)
  },
)

// Helper to unwrap { success, data, error } → data
function extract<T>(promise: AxiosPromise<object>): Promise<T> {
  return promise.then((res) => (res.data as ApiResponse<T>).data)
}

// Full API surface matching all http/ test files
export const api = {
  // ─── Generated API classes (CORS → 后端直连) ───
  audit: new AuditApi(config, undefined, axios),
  containerSecrets: new ContainerSecretsApi(config, undefined, axios),
  info: new InfoApi(config, undefined, axios),
  permissions: new PermissionsApi(config, undefined, axios),
  platforms: Object.assign(new PlatformsApi(config, undefined, axios), {
    extensionFields(instanceId: string) {
      return axios.get<ApiResponse<ExtensionFieldGroup>>('/api/platforms/extension-fields', { params: { instanceId } }).then(r => r.data.data)
    },
    regions(params: { instanceId?: string; platform?: string }) {
      return axios.get<ApiResponse<{ platform: string; regions: { RegionId: string }[] }>>('/api/platforms/regions', { params }).then(r => r.data.data)
    },
  }),
  sandboxes: new SandboxesApi(config, undefined, axios),
  pods: {
    list(params?: { status?: string; limit?: number; cursor?: string }) {
      return axios.get<ApiResponse<{ items: PodInstance[]; nextCursor?: string }>>('/api/sandboxes/pod', { params }).then(r => r.data.data)
    },
    get(providerId: string) {
      return axios.get<ApiResponse<PodInstance>>(`/api/sandboxes/pod/${providerId}`).then(r => r.data.data)
    },
    stop(providerId: string) {
      return axios.post(`/api/sandboxes/pod/${providerId}/stop`)
    },
    delete(providerId: string) {
      return axios.delete(`/api/sandboxes/pod/${providerId}`)
    },
    create(body: Record<string, unknown>) {
      return axios.post<ApiResponse<PodInstance>>('/api/sandboxes/pod', body).then(r => r.data.data)
    },
  },
  systemGroups: new SystemGroupsApi(config, undefined, axios),
  templates: new TemplatesApi(config, undefined, axios),
  users: new UsersApi(config, undefined, axios),

  // ─── Auth (auth.http) ───
  auth: {
    register(data: { name: string; email: string; password: string }) {
      return axios.post<ApiResponse<AuthResponse>>('/api/users/register', data).then(r => r.data.data)
    },
    login(data: { email: string; password: string }) {
      return axios.post<ApiResponse<AuthResponse>>('/api/users/login', data).then(r => r.data.data)
    },
    loginInfo(email: string) {
      return axios.get<ApiResponse<LoginInfo>>('/api/users/login-info', { params: { email } }).then(r => r.data.data)
    },
    noPasswordLogin(data: { email: string; oneTimeKey: string }) {
      return axios.post<ApiResponse<AuthResponse>>('/api/users/no-password-login', data).then(r => r.data.data)
    },
    // Sessions
    listSessions() {
      return axios.get('/api/users/sessions').then(r => (r.data as Record<string,unknown>).data as unknown[])
    },
    deleteSession(token: string) {
      return axios.delete(`/api/users/sessions/${token}`)
    },
    search(q: string) {
      return axios.get<ApiResponse<User | null>>('/api/users/search', { params: { q } }).then(r => r.data.data)
    },
  },

  // ─── Topology (topo.http) ───
  topology: {
    // Instances (core topology node — replaces old clusters)
    instances: {
      list(params?: { region?: string; platform?: string; status?: string; page?: number; limit?: number }) {
        return axios.get<ApiResponse<{ items: ComputeInstance[] }>>('/api/topology/instances', { params }).then(r => r.data.data)
      },
      get(id: string) {
        return axios.get<ApiResponse<ComputeInstance>>(`/api/topology/instances/${id}`).then(r => r.data.data)
      },
      create(body: CreateInstanceInput) {
        return axios.post<ApiResponse<ComputeInstance>>('/api/topology/instances', body).then(r => r.data.data)
      },
      update(id: string, body: UpdateInstanceInput) {
        return axios.put<ApiResponse<ComputeInstance>>(`/api/topology/instances/${id}`, body).then(r => r.data.data)
      },
      delete(id: string) {
        return axios.delete(`/api/topology/instances/${id}`)
      },
      heartbeat(id: string, body: HeartbeatBody) {
        return axios.post(`/api/topology/instances/${id}/heartbeat`, body)
      },
    },
    // Credentials
    credentials: {
      list(params?: { platform?: string }) {
        return axios.get<ApiResponse<{ items: MaskedCredential[] }>>('/api/topology/credentials', { params }).then(r => r.data.data.items)
      },
      get(id: string) {
        return axios.get<ApiResponse<MaskedCredential>>(`/api/topology/credentials/${id}`).then(r => r.data.data)
      },
      create(body: CreateCredentialInput) {
        return axios.post<ApiResponse<MaskedCredential>>('/api/topology/credentials', body).then(r => r.data.data)
      },
      update(id: string, body: UpdateCredentialInput) {
        return axios.put<ApiResponse<MaskedCredential>>(`/api/topology/credentials/${id}`, body).then(r => r.data.data)
      },
      delete(id: string) {
        return axios.delete(`/api/topology/credentials/${id}`)
      },
    },
    // Buckets
    buckets: {
      list(params?: { platform?: string; region?: string }) {
        return axios.get<ApiResponse<{ items: RegionBucket[] }>>('/api/topology/buckets', { params }).then(r => r.data.data.items)
      },
      get(id: string) {
        return axios.get<ApiResponse<RegionBucket>>(`/api/topology/buckets/${id}`).then(r => r.data.data)
      },
      create(body: CreateBucketInput) {
        return axios.post<ApiResponse<RegionBucket>>('/api/topology/buckets', body).then(r => r.data.data)
      },
      update(id: string, body: UpdateBucketInput) {
        return axios.put<ApiResponse<RegionBucket>>(`/api/topology/buckets/${id}`, body).then(r => r.data.data)
      },
      delete(id: string) {
        return axios.delete(`/api/topology/buckets/${id}`)
      },
      // S3 bucket policies
      policies: {
        list(bucketId: string) {
          return axios.get<ApiResponse<{ items: S3Policy[] }>>(`/api/topology/buckets/${bucketId}/policies`).then(r => r.data.data.items)
        },
        create(bucketId: string, body: { name: string; effect: string; actions: string[]; pathPrefix?: string }) {
          return axios.post<ApiResponse<S3Policy>>(`/api/topology/buckets/${bucketId}/policies`, body).then(r => r.data.data)
        },
      },
    },
    // S3 policies CRUD by ID
    bucketPolicies: {
      get(id: string) {
        return axios.get<ApiResponse<S3Policy>>(`/api/topology/policies/${id}`).then(r => r.data.data)
      },
      update(id: string, body: { name?: string; effect?: string; actions?: string[]; pathPrefix?: string }) {
        return axios.put<ApiResponse<S3Policy>>(`/api/topology/policies/${id}`, body).then(r => r.data.data)
      },
      delete(id: string) {
        return axios.delete(`/api/topology/policies/${id}`)
      },
    },
    // Volumes
    volumes: {
      list(params?: { page?: number; limit?: number }) {
        return axios.get<ApiResponse<{ items: Volume[] }>>('/api/volumes', { params }).then(r => r.data.data)
      },
      get(id: string) {
        return axios.get<ApiResponse<Volume>>(`/api/volumes/${id}`).then(r => r.data.data)
      },
      create(body: CreateVolumeInput) {
        return axios.post<ApiResponse<Volume>>('/api/volumes', body).then(r => r.data.data)
      },
      update(id: string, body: UpdateVolumeInput) {
        return axios.put<ApiResponse<Volume>>(`/api/volumes/${id}`, body).then(r => r.data.data)
      },
      delete(id: string) {
        return axios.delete(`/api/volumes/${id}`)
      },
    },
    // Image Repositories
    images: {
      list(params?: { instanceId?: string; platform?: string; status?: string }) {
        return axios.get<ApiResponse<{ items: ImageRepository[] }>>('/api/topology/images', { params }).then(r => r.data.data.items)
      },
      get(id: string) {
        return axios.get<ApiResponse<ImageRepository>>(`/api/topology/images/${id}`).then(r => r.data.data)
      },
      create(body: CreateImageInput) {
        return axios.post<ApiResponse<ImageRepository>>('/api/topology/images', body).then(r => r.data.data)
      },
      update(id: string, body: Partial<CreateImageInput>) {
        return axios.put<ApiResponse<ImageRepository>>(`/api/topology/images/${id}`, body).then(r => r.data.data)
      },
      delete(id: string) {
        return axios.delete(`/api/topology/images/${id}`)
      },
      pull(id: string) {
        return axios.post<ApiResponse<{ taskId: string }>>(`/api/topology/images/${id}/pull`).then(r => r.data.data)
      },
      tasks(id: string) {
        return axios.get<ApiResponse<{ items: PullTask[] }>>(`/api/topology/images/${id}/tasks`).then(r => r.data.data.items)
      },
    },
    pullTasks: {
      get(taskId: string) {
        return axios.get<ApiResponse<PullTask>>(`/api/topology/pull-tasks/${taskId}`).then(r => r.data.data)
      },
    },
  },

  // ─── Runtime Images ( /api/images , 对标 docker images ) ───
  images: {
    list(params?: { search?: string; limit?: number; instanceId?: string }) {
      return axios.get<ApiResponse<{ items: ImageInfo[] }>>('/api/images', { params }).then(r => r.data.data.items)
    },
    pull(body: ImagePullRequest) {
      return axios.post<ApiResponse<ImageInfo>>('/api/images/pull', body).then(r => r.data.data)
    },
    get(id: string) {
      return axios.get<ApiResponse<ImageInfo>>(`/api/images/${id}`).then(r => r.data.data)
    },
    delete(id: string) {
      return axios.delete(`/api/images/${id}`)
    },
    tag(id: string, body: ImageTagRequest) {
      return axios.post<ApiResponse<ImageInfo>>(`/api/images/${id}/tag`, body).then(r => r.data.data)
    },
    search(params: { term: string }) {
      return axios.get<ApiResponse<ImageSearchResult[]>>('/api/images/search', { params }).then(r => r.data.data)
    },
    prune() {
      return axios.post('/api/images/prune')
    },
    history(id: string) {
      return axios.get<ApiResponse<ImageHistoryLayer[]>>(`/api/images/${id}/history`).then(r => r.data.data)
    },
    build(body: ImageBuildRequest) {
      return axios.post<ApiResponse<ImageInfo>>('/api/images/build', body).then(r => r.data.data)
    },
  },

  // ─── Security Groups (/api/networks) ───
  securityGroups: {
    list(params?: { page?: number; limit?: number }) {
      return axios.get('/api/networks/', { params })
    },
    get(id: string) {
      return axios.get(`/api/networks/${id}`)
    },
    create(body: CreateSecurityGroupInput) {
      return axios.post('/api/networks/', body)
    },
    update(id: string, body: UpdateSecurityGroupInput) {
      return axios.put(`/api/networks/${id}`, body)
    },
    delete(id: string) {
      return axios.delete(`/api/networks/${id}`)
    },
  },

  // ─── Subnets (/api/subnets) ───
  subnets: {
    list(params?: { page?: number; limit?: number }) {
      return axios.get('/api/subnets/', { params })
    },
    get(id: string) {
      return axios.get(`/api/subnets/${id}`)
    },
    create(body: CreateSubnetInput) {
      return axios.post('/api/subnets/', body)
    },
    update(id: string, body: UpdateSubnetInput) {
      return axios.put(`/api/subnets/${id}`, body)
    },
    delete(id: string) {
      return axios.delete(`/api/subnets/${id}`)
    },
  },

  // ─── Events (not in generated spec) ───
  events: {
    getStatus() {
      return axios.get('/api/events/loop/status').then(r => r.data as EventLoopStatus)
    },
    start() { return axios.post('/api/events/loop/start') },
    stop() { return axios.post('/api/events/loop/stop') },
    pause() { return axios.post('/api/events/loop/pause') },
    resume() { return axios.post('/api/events/loop/resume') },
    configure(cfg: Partial<EventLoopConfig>) { return axios.post('/api/events/loop/configure', cfg) },
    create(type: string, payload?: unknown) { return axios.post('/api/events', { type, payload }).then(r => r.data as { id: string }) },
    pending() { return axios.get('/api/events/loop/pending').then(r => r.data as { type: string; id: string }[]) },
  },

  // ─── Dev (auth.http) ───
  dev: {
    sudo() {
      return axios.post('/api/sudo', {}).then(r => (r.data as ApiResponse<{ expiry: number; durationMs: number }>).data)
    },
    migrateUserIndex(ids: string[]) {
      return axios.post('/__admin/migrate-user-index', { ids })
    },
    triggerTick() {
      return axios.post('/__scheduled', null, { responseType: 'text' }).then(r => ({ data: { message: r.data } }))
    },
  },

  // ─── WebSocket (info.http) ───
  ws: {
    /** Connect to the global notification channel. Requires Workers + DO binding. */
    notifications(token?: string): WebSocket | null {
      try {
        const wsUrl = API_BASE.replace(/^http/, 'ws') + '/api/ws/notifications'
        const ws = new WebSocket(wsUrl)
        ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token: token || getToken() }))
        return ws
      } catch { return null }
    },
  },

  // ─── Extract helpers ───
  extract<T>(promise: AxiosPromise<object>): Promise<T> { return extract<T>(promise) },
  /** For endpoints that return either `T[]` (flat array) or `{ items: T[] }` (paginated wrapper). */
  extractArray<T>(promise: AxiosPromise<object>): Promise<T[]> {
    return promise.then((res) => {
      const d = (res.data as Record<string, unknown>).data
      if (Array.isArray(d)) return d as T[]
      if (d && typeof d === 'object' && 'items' in d) return (d as { items: T[] }).items
      return []
    })
  },
  extractItems<T>(promise: AxiosPromise<object>): Promise<T[]> {
    return promise.then((res) => { const d = (res.data as ApiResponse<{ items: T[] }>).data; return d?.items ?? [] })
  },
  extractPage<T>(promise: AxiosPromise<object>): Promise<{ items: T[]; total: number }> {
    return promise.then((res) => {
      const d = (res.data as ApiResponse<{ items: T[]; total: number }>).data
      return { items: d?.items ?? [], total: d?.total ?? 0 }
    })
  },
  extractLines<T>(promise: AxiosPromise<object>): Promise<T[]> {
    return promise.then((res) => {
      const d = (res.data as ApiResponse<{ lines: unknown[] }>).data
      const raw = d?.lines ?? []
      return raw.map((item: unknown) => {
        if (typeof item === 'string') try { return JSON.parse(item) as T } catch { return item as T }
        return item as T
      })
    })
  },

  // ─── Actions (CI/CD) ───
  actions: {
    // Workflows
    workflows: {
      list(params?: { name?: string; status?: string; page?: number; limit?: number }) {
        return axios.get<ApiResponse<{ items: WorkflowDef[]; total: number; page: number; limit: number }>>('/api/actions/workflows', { params }).then(r => r.data.data)
      },
      get(id: string) {
        return axios.get<ApiResponse<WorkflowDef>>(`/api/actions/workflows/${id}`).then(r => r.data.data)
      },
      create(body: { name: string; on: WorkflowDef['on']; jobs: Record<string, JobDef> }) {
        return axios.post<ApiResponse<WorkflowDef>>('/api/actions/workflows', body).then(r => r.data.data)
      },
      update(id: string, body: Partial<{ name: string; on: WorkflowDef['on']; jobs: Record<string, JobDef> }>) {
        return axios.patch<ApiResponse<WorkflowDef>>(`/api/actions/workflows/${id}`, body).then(r => r.data.data)
      },
      delete(id: string) {
        return axios.delete(`/api/actions/workflows/${id}`)
      },
      trigger(id: string, body?: { inputs?: Record<string, unknown> }) {
        return axios.post<ApiResponse<WorkflowRun>>(`/api/actions/workflows/${id}/trigger`, body || {}).then(r => r.data.data)
      },
    },
    // Runs
    runs: {
      list(params?: { workflowId?: string; status?: string; page?: number; limit?: number }) {
        return axios.get<ApiResponse<{ items: WorkflowRun[]; total: number; page: number; limit: number }>>('/api/actions/runs', { params }).then(r => r.data.data)
      },
      get(id: string) {
        return axios.get<ApiResponse<WorkflowRun>>(`/api/actions/runs/${id}`).then(r => r.data.data)
      },
      cancel(id: string) {
        return axios.post(`/api/actions/runs/${id}/cancel`)
      },
      rerun(id: string) {
        return axios.post<ApiResponse<WorkflowRun>>(`/api/actions/runs/${id}/rerun`).then(r => r.data.data)
      },
      dag(id: string) {
        return axios.get<ApiResponse<RunDag>>(`/api/actions/runs/${id}/dag`).then(r => r.data.data)
      },
      jobs(runId: string) {
        return axios.get<ApiResponse<JobRun[]>>(`/api/actions/runs/${runId}/jobs`).then(r => r.data.data)
      },
      approvals: {
        create(runId: string, body: { jobName: string; approvers: string[]; message?: string }) {
          return axios.post<ApiResponse<ApprovalNode>>(`/api/actions/runs/${runId}/approvals`, body).then(r => r.data.data)
        },
        list(runId: string) {
          return axios.get<ApiResponse<ApprovalNode[]>>(`/api/actions/runs/${runId}/approvals`).then(r => r.data.data)
        },
      },
    },
    // Jobs
    jobs: {
      get(id: string) {
        return axios.get<ApiResponse<JobRun>>(`/api/actions/jobs/${id}`).then(r => r.data.data)
      },
      logs(id: string, params?: { step?: string; offset?: number; limit?: number }) {
        return axios.get<ApiResponse<{ text: string; totalBytes: number; offset: number; limit: number }>>(`/api/actions/jobs/${id}/logs`, { params }).then(r => r.data.data)
      },
    },
    // Approvals
    approvals: {
      decide(id: string, body: { approved: boolean; reason?: string }) {
        return axios.post<ApiResponse<ApprovalNode>>(`/api/actions/approvals/${id}/decide`, body).then(r => r.data.data)
      },
    },
    // Runners
    runners: {
      list(params?: { labels?: string; page?: number; limit?: number }) {
        return axios.get<ApiResponse<RunnerRegistration[]>>('/api/actions/runners', { params }).then(r => r.data.data)
      },
      get(id: string) {
        return axios.get<ApiResponse<RunnerRegistration>>(`/api/actions/runners/${id}`).then(r => r.data.data)
      },
      drain(id: string) {
        return axios.post(`/api/actions/runners/${id}/drain`)
      },
      heartbeat(body: { labels?: Record<string, string> }) {
        return axios.post<ApiResponse<RunnerRegistration>>('/api/actions/runners/heartbeat', body).then(r => r.data.data)
      },
    },
    // Action Registry
    registry: {
      list(params?: { page?: number; limit?: number }) {
        return axios.get<ApiResponse<{ items: ActionDef[]; total: number }>>('/api/actions/actions', { params }).then(r => r.data.data)
      },
      create(body: { name: string; version: string; runs: ActionDef['runs']; inputs?: ActionDef['inputs']; outputs?: ActionDef['outputs'] }) {
        return axios.post<ApiResponse<ActionDef>>('/api/actions/actions', body).then(r => r.data.data)
      },
    },
    // Secrets
    secrets: {
      list(workflowId: string) {
        return axios.get<ApiResponse<WorkflowSecret[]>>(`/api/actions/workflows/${workflowId}/secrets`).then(r => r.data.data)
      },
      create(workflowId: string, body: { key: string; value: string }) {
        return axios.post<ApiResponse<WorkflowSecret>>(`/api/actions/workflows/${workflowId}/secrets`, body).then(r => r.data.data)
      },
      delete(secretId: string) {
        return axios.delete(`/api/actions/secrets/${secretId}`)
      },
    },
    // Shared Links
    sharedLinks: {
      list(params?: { page?: number; limit?: number }) {
        return axios.get<ApiResponse<SharedLink[]>>('/api/actions/shared-links', { params }).then(r => r.data.data)
      },
      get(id: string) {
        return axios.get<ApiResponse<SharedLink>>(`/api/actions/shared-links/${id}`).then(r => r.data.data)
      },
      create(body: { workflowId: string; name: string; password?: string; expiresAt?: number; maxUses?: number; concurrentMax?: number; defaultTtlSeconds?: number }) {
        return axios.post<ApiResponse<SharedLink>>('/api/actions/shared-links', body).then(r => r.data.data)
      },
      launch(id: string, body?: { password?: string }) {
        return axios.post<ApiResponse<{ runId: string; status: string }>>(`/api/actions/shared-links/${id}/launch`, body || {}).then(r => r.data.data)
      },
      disable(id: string) {
        return axios.post(`/api/actions/shared-links/${id}/disable`)
      },
    },
    // Dashboard
    dashboard: {
      stats() {
        return axios.get<ApiResponse<ActionDashboard>>('/api/actions/dashboard').then(r => r.data.data)
      },
    },
    // Organizations
    orgs: {
      list(params?: { member?: string }) {
        return axios.get<ApiResponse<ActionOrg[]>>('/api/actions/orgs', { params }).then(r => r.data.data)
      },
      get(id: string) {
        return axios.get<ApiResponse<ActionOrg>>(`/api/actions/orgs/${id}`).then(r => r.data.data)
      },
      create(body: { name: string }) {
        return axios.post<ApiResponse<ActionOrg>>('/api/actions/orgs', body).then(r => r.data.data)
      },
      addMember(id: string, body: { userId: string; role?: string }) {
        return axios.post(`/api/actions/orgs/${id}/members`, body)
      },
    },
    // Projects
    projects: {
      list(params?: { orgId: string }) {
        return axios.get<ApiResponse<ActionProject[]>>('/api/actions/projects', { params }).then(r => r.data.data)
      },
      create(body: { orgId: string; name: string }) {
        return axios.post<ApiResponse<ActionProject>>('/api/actions/projects', body).then(r => r.data.data)
      },
    },
  },

  // ─── Permissions helpers (perm.http) ───
  perm: {
    check(data: { userId: string; action: string; resource: string; ip?: string }) {
      return axios.post('/api/permissions/check', data).then(r => (r.data as Record<string,unknown>).data)
    },
    comparePermGroups(idA: string, idB: string) {
      return axios.post('/api/permissions/compare/perm-groups', { idA, idB }).then(r => (r.data as Record<string,unknown>).data)
    },
    compareUserGroups(idA: string, idB: string) {
      return axios.post('/api/permissions/compare/user-groups', { idA, idB }).then(r => (r.data as Record<string,unknown>).data)
    },
    getLogPolicy() {
      return axios.get('/api/permissions/log-policy').then(r => (r.data as Record<string,unknown>).data)
    },
    updateLogPolicy(data: Record<string,unknown>) {
      return axios.put('/api/permissions/log-policy', data).then(r => (r.data as Record<string,unknown>).data)
    },
    getTemplates() {
      return axios.get('/api/permissions/templates').then(r => (r.data as Record<string,unknown>).data as unknown[])
    },
    /** Invite a user to join a user group (requires adminIds membership) */
    invite(data: { groupId: string; inviteeId: string }) {
      return axios.post('/api/permissions/invite', data).then(r => (r.data as Record<string,unknown>).data)
    },
    /** Create user group with full fields (including adminIds) */
    createUserGroup(data: { name: string; memberIds: string[]; adminIds?: string[]; dependsOn?: string[] }) {
      return axios.post<ApiResponse<UserGroup>>('/api/permissions/user-groups', data).then(r => r.data.data)
    },
    /** Update user group with full fields */
    updateUserGroup(id: string, data: { name: string; memberIds?: string[]; adminIds?: string[]; dependsOn?: string[] }) {
      return axios.put<ApiResponse<UserGroup>>(`/api/permissions/user-groups/${id}`, data).then(r => r.data.data)
    },
  },
}

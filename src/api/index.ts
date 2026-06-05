import globalAxios, { type AxiosPromise } from 'axios'
import { Configuration } from './generated/configuration'
import {
  AuditApi, InfoApi, PermissionsApi,
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
  info: new InfoApi(config, undefined, axios),
  permissions: new PermissionsApi(config, undefined, axios),
  platforms: new PlatformsApi(config, undefined, axios),
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
    // Regions
    regions: {
      list(platform?: string) {
        return axios.get<ApiResponse<PlatformRegions>>('/api/topology/regions', { params: { platform } }).then(r => r.data.data)
      },
    },
    // Instances (core topology node — replaces old clusters)
    instances: {
      list(params?: { region?: string; platform?: string; status?: string }) {
        return axios.get<ApiResponse<{ items: ComputeInstance[] }>>('/api/topology/instances', { params }).then(r => r.data.data.items)
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
      return axios.post('/api/sudo', {}).then(r => r.data as { expiry: number; durationMs: number })
    },
    migrateUserIndex(ids: string[]) {
      return axios.post('/__admin/migrate-user-index', { ids })
    },
    triggerTick() {
      return axios.post('/_tick')
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
  },
}

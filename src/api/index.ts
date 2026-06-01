import globalAxios, { type AxiosPromise } from 'axios'
import { Configuration } from './generated/configuration'
import {
  AuditApi, ImagesApi, InfoApi, PermissionsApi,
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

const API_BASE = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000'

const config = new Configuration({
  accessToken: getToken,
  basePath: API_BASE,
})

const axios = globalAxios.create({ baseURL: API_BASE })

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
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/#/login'
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
  images: new ImagesApi(config, undefined, axios),
  info: new InfoApi(config, undefined, axios),
  permissions: new PermissionsApi(config, undefined, axios),
  platforms: new PlatformsApi(config, undefined, axios),
  sandboxes: new SandboxesApi(config, undefined, axios),
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
  },

  // ─── Dev (auth.http) ───
  dev: {
    becomeWheel(userId: string) {
      return axios.post('/__become-wheel', { userId })
    },
    migrateUserIndex(ids: string[]) {
      return axios.post('/__admin/migrate-user-index', { ids })
    },
    triggerTick() {
      return axios.post('/_tick')
    },
  },

  // ─── Extract helpers ───
  extract<T>(promise: AxiosPromise<object>): Promise<T> { return extract<T>(promise) },
  extractItems<T>(promise: AxiosPromise<object>): Promise<T[]> {
    return promise.then((res) => ((res.data as ApiResponse<{ items: T[] }>).data).items)
  },
  extractPage<T>(promise: AxiosPromise<object>): Promise<{ items: T[]; total: number }> {
    return promise.then((res) => {
      const d = (res.data as ApiResponse<{ items: T[]; total: number }>).data
      return { items: d.items || [], total: d.total ?? d.items?.length ?? 0 }
    })
  },
  extractLines<T>(promise: AxiosPromise<object>): Promise<T[]> {
    return promise.then((res) => ((res.data as ApiResponse<{ lines: T[] }>).data).lines)
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

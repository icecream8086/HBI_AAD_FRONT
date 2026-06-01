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

const config = new Configuration({
  accessToken: getToken,
  basePath: process.env.VUE_APP_API_BASE_URL || '',
})

const axios = globalAxios.create()

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

// Helper to extract data from the generated API's AxiosPromise<object>
function extract<T>(promise: AxiosPromise<object>): Promise<T> {
  return promise.then((res) => (res.data as ApiResponse<T>).data)
}

// Wrapper that provides typed methods for all endpoints
export const api = {
  audit: new AuditApi(config, undefined, axios),
  images: new ImagesApi(config, undefined, axios),
  info: new InfoApi(config, undefined, axios),
  permissions: new PermissionsApi(config, undefined, axios),
  platforms: new PlatformsApi(config, undefined, axios),
  sandboxes: new SandboxesApi(config, undefined, axios),
  systemGroups: new SystemGroupsApi(config, undefined, axios),
  templates: new TemplatesApi(config, undefined, axios),
  users: new UsersApi(config, undefined, axios),

  // Auth endpoints (not in generated types properly)
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
  },

  // Events (not in generated OpenAPI spec)
  events: {
    getStatus() {
      return axios.get<ApiResponse<EventLoopStatus>>('/api/events/loop/status').then(r => r.data.data)
    },
    start() { return axios.post('/api/events/loop/start') },
    stop() { return axios.post('/api/events/loop/stop') },
    pause() { return axios.post('/api/events/loop/pause') },
    resume() { return axios.post('/api/events/loop/resume') },
    configure(cfg: EventLoopConfig) { return axios.post('/api/events/loop/configure', cfg) },
  },

  // Dev endpoints
  dev: {
    becomeWheel(userId: string) {
      return axios.post('/__become-wheel', { userId })
    },
  },

  // Extract helpers for different response formats
  extract<T>(promise: AxiosPromise<object>): Promise<T> {
    return extract<T>(promise)
  },
  /** For responses like `{ items: T[] }` (sandboxes, permissions) */
  extractItems<T>(promise: AxiosPromise<object>): Promise<T[]> {
    return promise.then((res) => ((res.data as ApiResponse<{ items: T[] }>).data).items)
  },
  /** For responses like `{ lines: T[] }` (audit logs) */
  extractLines<T>(promise: AxiosPromise<object>): Promise<T[]> {
    return promise.then((res) => ((res.data as ApiResponse<{ lines: T[] }>).data).lines)
  },
}

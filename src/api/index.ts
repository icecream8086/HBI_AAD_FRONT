// Hand-crafted API surface (with manual patches for backward compatibility)
// Regen hint: node scripts/export-api.mjs generates the base structure, then merge manual patches

import axios from 'axios'

export interface ApiResponse<T> {
  success: boolean
  data: T
  error: null | { code: string; message: string }
}

function getToken(): string {
  return localStorage.getItem('access_token') || ''
}

export const API_BASE = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000'

export const API = axios.create({ baseURL: API_BASE })

API.interceptors.request.use((cfg) => {
  const token = getToken()
  if (token && cfg.headers) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

API.interceptors.response.use(
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

// ─── Unwrap helpers ───

function extractData<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  return promise.then((res) => res.data.data)
}

function extractPage<T>(promise: Promise<{ data: ApiResponse<{ items: T[]; total: number }> }>): Promise<{ items: T[]; total: number }> {
  return promise.then((res) => {
    const d = res.data.data
    return { items: d?.items ?? [], total: d?.total ?? 0 }
  })
}

function extractItems<T>(promise: Promise<{ data: ApiResponse<{ items: T[] }> }>): Promise<T[]> {
  return promise.then((res) => res.data.data?.items ?? [])
}

function extractArray<T>(promise: Promise<{ data: { data: T[] | { items: T[] } } }>): Promise<T[]> {
  return promise.then((res) => {
    const d = res.data.data
    if (Array.isArray(d)) return d as T[]
    if (d && typeof d === 'object' && 'items' in d) return (d as { items: T[] }).items
    return []
  })
}

// ─── Generated API surface ───
export const api = {
  // ── Auth ──
  auth: {
    register(data: { name: string; email: string; password: string }) {
      return extractData<unknown>(API.post('/api/users/register', data))
    },
    login(data: { email: string; password: string }) {
      return extractData<unknown>(API.post('/api/users/login', data))
    },
    loginInfo(email: string) {
      return extractData<unknown>(API.get('/api/users/login-info', { params: { email } }))
    },
    noPasswordLogin(data: { email: string; oneTimeKey: string }) {
      return extractData<unknown>(API.post('/api/users/no-password-login', data))
    },
    listSessions() {
      return API.get('/api/users/sessions').then(r => (r.data as Record<string, unknown>).data as unknown[])
    },
    deleteSession(token: string) {
      return API.delete(`/api/users/sessions/${token}`)
    },
    search(q: string) {
      return extractData<unknown>(API.get('/api/users/search', { params: { q } }))
    },
  },

  // ── Info ──
  info: {
    get() {
      return API.get('/info').then(r => (r.data as Record<string, unknown>).data)
    },
  },

  // ── Actions / CI-CD ──
  actions: {
    workflows: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/actions/workflows', { params })) },
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/actions/workflows/${id}`, { params })) },
      create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/actions/workflows', body || {})) },
      update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.patch(`/api/actions/workflows/${id}`, body || {})) },
      delete(id: string) { return API.delete(`/api/actions/workflows/${id}`) },
      trigger(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/actions/workflows/${id}/trigger`, body || {})) },
      http(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/actions/workflows/${id}/http`, body || {})) },
      schedule(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/actions/workflows/${id}/schedule`, body || {})) },
      secrets: {
        list(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/actions/workflows/${id}/secrets`, { params })) },
        create(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/actions/workflows/${id}/secrets`, body || {})) },
      },
    },
    webhook: {
      create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/actions/webhook', body || {})) },
    },
    runs: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/actions/runs', { params })) },
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/actions/runs/${id}`, { params })) },
      cancel(id: string) { return API.post(`/api/actions/runs/${id}/cancel`) },
      rerun(id: string) { return extractData<unknown>(API.post(`/api/actions/runs/${id}/rerun`)) },
      jobs(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/actions/runs/${id}/jobs`, { params })) },
      dag(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/actions/runs/${id}/dag`, { params })) },
      approvals: {
        list(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/actions/runs/${id}/approvals`, { params })) },
        create(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/actions/runs/${id}/approvals`, body || {})) },
      },
    },
    jobs: {
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/actions/jobs/${id}`, { params })) },
      logs(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/actions/jobs/${id}/logs`, { params })) },
    },
    registry: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/actions/actions', { params })) },
      create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/actions/actions', body || {})) },
    },
    orgs: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/actions/orgs', { params })) },
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/actions/orgs/${id}`, { params })) },
      create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/actions/orgs', body || {})) },
      addMember(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/actions/orgs/${id}/members`, body || {})) },
    },
    projects: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/actions/projects', { params })) },
      create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/actions/projects', body || {})) },
    },
    approvals: {
      decide(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/actions/approvals/${id}/decide`, body || {})) },
    },
    secrets: {
      delete(id: string) { return API.delete(`/api/actions/secrets/${id}`) },
    },
    sharedLinks: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/actions/shared-links', { params })) },
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/actions/shared-links/${id}`, { params })) },
      create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/actions/shared-links', body || {})) },
      launch(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/actions/shared-links/${id}/launch`, body || {})) },
      disable(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/actions/shared-links/${id}/disable`, body || {})) },
    },
    runners: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/actions/runners', { params })) },
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/actions/runners/${id}`, { params })) },
      drain(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/actions/runners/${id}/drain`, body || {})) },
      heartbeat(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/actions/runners/heartbeat', body || {})) },
    },
    workspace: {
      get(runId: string, jobName: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/actions/workspace/${runId}/${jobName}`, { params })) },
    },
    dashboard: {
      stats(params?: Record<string, unknown>) { return extractData<unknown>(API.get('/api/actions/dashboard', { params })) },
    },
    templates: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/actions/templates', { params })) },
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/actions/templates/${id}`, { params })) },
    },
  },

  // ── Audit ──
  audit: {
    logs: {
      list(params?: Record<string, unknown>) { return extractData<{ lines?: unknown[]; entries?: unknown[]; total: number; nextCursor?: string }>(API.get('/api/audit/logs', { params })) },
    },
    stats() {
      return API.get('/api/audit/logs/stats').then(r => (r.data as Record<string, unknown>).data)
    },
  },

  // ── Container Secrets ──
  containerSecrets: {
    list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/container-secrets', { params })) },
    get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/container-secrets/${id}`, { params })) },
    create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/container-secrets', body || {})) },
    update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/container-secrets/${id}`, body || {})) },
    delete(id: string) { return API.delete(`/api/container-secrets/${id}`) },
    upload(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/container-secrets/${id}/upload`, body || {})) },
    download(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/container-secrets/${id}/download`, { params })) },
    scopes: {
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/container-secrets/${id}/scopes`, { params })) },
      set(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/container-secrets/${id}/scopes`, body || {})) },
    },
    checkAccess(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/container-secrets/${id}/check-access`, { params })) },
    publicKey(userId: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/container-secrets/public-key/${userId}`, { params })) },
  },

  // ── Events ──
  events: {
    getStatus() { return extractData<unknown>(API.get('/api/events/loop/status')) },
    pending() { return extractData<unknown>(API.get('/api/events/loop/pending')) },
    start() { return API.post('/api/events/loop/start') },
    stop() { return API.post('/api/events/loop/stop') },
    pause() { return API.post('/api/events/loop/pause') },
    resume() { return API.post('/api/events/loop/resume') },
    configure(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/events/loop/configure', body || {})) },
    create(type: string, payload?: unknown) { return extractData<unknown>(API.post('/api/events', { type, payload })) },
  },

  // ── Images ──
  images: {
    list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/images', { params })) },
    get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/images/${id}`, { params })) },
    delete(id: string) { return API.delete(`/api/images/${id}`) },
    tag(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/images/${id}/tag`, body || {})) },
    history(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/images/${id}/history`, { params })) },
    pull(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/images/pull', body || {})) },
    search(params?: Record<string, unknown>) { return extractData<unknown>(API.get('/api/images/search', { params })) },
    prune(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/images/prune', body || {})) },
    build(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/images/build', body || {})) },
  },

  // ── Instances ──
  instances: {
    list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/instances', { params })) },
    get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/instances/${id}`, { params })) },
    create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/instances', body || {})) },
    update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/instances/${id}`, body || {})) },
    delete(id: string) { return API.delete(`/api/instances/${id}`) },
    heartbeat(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/instances/${id}/heartbeat`, body || {})) },
    markStale(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/instances/mark-stale', body || {})) },
    registrationToken(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/instances/registration-token', body || {})) },
    validateToken(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/instances/validate-token', body || {})) },
    groups: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/instances/groups', { params })) },
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/instances/groups/${id}`, { params })) },
      create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/instances/groups', body || {})) },
      delete(id: string) { return API.delete(`/api/instances/groups/${id}`) },
    },
  },

  // ── Permissions ──
  permissions: {
    policies: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/permissions/policies', { params })) },
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/permissions/policies/${id}`, { params })) },
      create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/permissions/policies', body || {})) },
      update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/permissions/policies/${id}`, body || {})) },
      delete(id: string) { return API.delete(`/api/permissions/policies/${id}`) },
    },
    userGroups: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/permissions/user-groups', { params })) },
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/permissions/user-groups/${id}`, { params })) },
      create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/permissions/user-groups', body || {})) },
      update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/permissions/user-groups/${id}`, body || {})) },
      delete(id: string) { return API.delete(`/api/permissions/user-groups/${id}`) },
    },
    groups: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/permissions/groups', { params })) },
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/permissions/groups/${id}`, { params })) },
      create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/permissions/groups', body || {})) },
      update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/permissions/groups/${id}`, body || {})) },
      delete(id: string) { return API.delete(`/api/permissions/groups/${id}`) },
    },
    fromTemplate(templateId: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/permissions/groups/from-template/${templateId}`, body || {})) },
    templates: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/permissions/templates', { params })) },
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/permissions/templates/${id}`, { params })) },
    },
    userTemplates: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/permissions/user-templates', { params })) },
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/permissions/user-templates/${id}`, { params })) },
      create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/permissions/user-templates', body || {})) },
      update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/permissions/user-templates/${id}`, body || {})) },
      delete(id: string) { return API.delete(`/api/permissions/user-templates/${id}`) },
    },
    routeAcls: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/permissions/route-acls', { params })) },
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/permissions/route-acls/${id}`, { params })) },
      create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/permissions/route-acls', body || {})) },
      update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/permissions/route-acls/${id}`, body || {})) },
      delete(id: string) { return API.delete(`/api/permissions/route-acls/${id}`) },
    },
    invite(body?: Record<string, unknown>) { return API.post('/api/permissions/invite', body || {}).then(r => (r.data as Record<string, unknown>).data) },
    invitations: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/permissions/invitations', { params })) },
      accept(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/permissions/invitations/${id}/accept`, body || {})) },
      reject(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/permissions/invitations/${id}/reject`, body || {})) },
    },
    logPolicy: {
      get() { return API.get('/api/permissions/log-policy').then(r => (r.data as Record<string, unknown>).data) },
      update(body?: Record<string, unknown>) { return extractData<unknown>(API.put('/api/permissions/log-policy', body || {})) },
    },
    caps: {
      user: {
        get(userId: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/permissions/caps/user/${userId}`, { params })) },
        update(userId: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/permissions/caps/user/${userId}`, body || {})) },
      },
      group: {
        get(groupId: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/permissions/caps/group/${groupId}`, { params })) },
        update(groupId: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/permissions/caps/group/${groupId}`, body || {})) },
      },
    },
    elevate: {
      create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/permissions/elevate', body || {})) },
      delete(userId: string) { return API.delete(`/api/permissions/elevate/${userId}`) },
    },
    elevations: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/permissions/elevations', { params })) },
    },
    compare: {
      permGroups(idA: string, idB: string) {
        return extractData<unknown>(API.post('/api/permissions/compare/perm-groups', { idA, idB }))
      },
      userGroups(idA: string, idB: string) {
        return extractData<unknown>(API.post('/api/permissions/compare/user-groups', { idA, idB }))
      },
    },
    check(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/permissions/check', body || {})) },
  },

  // ── perm (convenience aliases) ──
  perm: {
    check(data: { userId: string; action: string; resource: string; ip?: string }) {
      return API.post('/api/permissions/check', data).then(r => (r.data as Record<string, unknown>).data)
    },
    comparePermGroups(idA: string, idB: string) {
      return API.post('/api/permissions/compare/perm-groups', { idA, idB }).then(r => (r.data as Record<string, unknown>).data)
    },
    compareUserGroups(idA: string, idB: string) {
      return API.post('/api/permissions/compare/user-groups', { idA, idB }).then(r => (r.data as Record<string, unknown>).data)
    },
    getLogPolicy() {
      return API.get('/api/permissions/log-policy').then(r => (r.data as Record<string, unknown>).data)
    },
    updateLogPolicy(data: Record<string, unknown>) {
      return API.put('/api/permissions/log-policy', data).then(r => (r.data as Record<string, unknown>).data)
    },
    getTemplates() {
      return API.get('/api/permissions/templates').then(r => (r.data as Record<string, unknown>).data as unknown[])
    },
    invite(data: { groupId: string; inviteeId: string }) {
      return API.post('/api/permissions/invite', data).then(r => (r.data as Record<string, unknown>).data)
    },
    createUserGroup(data: { name: string; memberIds: string[]; adminIds?: string[]; dependsOn?: string[] }) {
      return extractData<unknown>(API.post('/api/permissions/user-groups', data))
    },
    updateUserGroup(id: string, data: { name: string; memberIds?: string[]; adminIds?: string[]; dependsOn?: string[] }) {
      return extractData<unknown>(API.put(`/api/permissions/user-groups/${id}`, data))
    },
  },

  // ── Platforms ──
  platforms: {
    list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/platforms', { params })) },
    extensionFields(instanceId: string) {
      return API.get<ApiResponse<unknown>>('/api/platforms/extension-fields', { params: { instanceId } }).then(r => r.data.data)
    },
    regions(params?: { instanceId?: string; platform?: string }) {
      return API.get<ApiResponse<{ platform: string; regions: { RegionId: string }[] }>>('/api/platforms/regions', { params }).then(r => r.data.data)
    },
  },

  // ── Sandboxes ──
  sandboxes: {
    list(params?: Record<string, unknown>) { return extractData<{ items: unknown[]; nextCursor?: string }>(API.get('/api/sandboxes', { params })) },
    get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/sandboxes/${id}`, { params })) },
    delete(id: string) { return API.delete(`/api/sandboxes/${id}`) },
    stop(id: string) { return API.post(`/api/sandboxes/${id}/stop`) },
    start(id: string) { return API.post(`/api/sandboxes/${id}/start`) },
    sync(id: string) { return API.post(`/api/sandboxes/${id}/sync`) },
    health(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/sandboxes/${id}/health`, { params })) },
  },

  // ── Subnets ──
  subnets: {
    list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/subnets', { params })) },
    get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/subnets/${id}`, { params })) },
    create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/subnets', body || {})) },
    update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/subnets/${id}`, body || {})) },
    delete(id: string) { return API.delete(`/api/subnets/${id}`) },
  },

  // ── Security Groups (Networks) ──
  securityGroups: {
    list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/networks', { params })) },
    get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/networks/${id}`, { params })) },
    create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/networks', body || {})) },
    update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/networks/${id}`, body || {})) },
    delete(id: string) { return API.delete(`/api/networks/${id}`) },
  },

  // ── System Groups ──
  systemGroups: {
    list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/system-groups', { params })) },
    get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/system-groups/${id}`, { params })) },
    create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/system-groups', body || {})) },
    update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/system-groups/${id}`, body || {})) },
    delete(id: string) { return API.delete(`/api/system-groups/${id}`) },
  },

  // ── Templates ──
  templates: {
    list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/templates', { params })) },
    get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/templates/${id}`, { params })) },
    create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/templates', body || {})) },
    update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/templates/${id}`, body || {})) },
    delete(id: string) { return API.delete(`/api/templates/${id}`) },
    resolved(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/templates/${id}/resolved`, { params })) },
    apply(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/templates/${id}/apply`, body || {})) },
  },

  // ── Topology ──
  topology: {
    regions: {
      list(params?: Record<string, unknown>) { return extractData<unknown>(API.get('/api/topology/regions', { params })) },
    },
    instances: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/topology/instances', { params })) },
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/topology/instances/${id}`, { params })) },
      create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/topology/instances', body || {})) },
      update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/topology/instances/${id}`, body || {})) },
      delete(id: string) { return API.delete(`/api/topology/instances/${id}`) },
      heartbeat(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/topology/instances/${id}/heartbeat`, body || {})) },
    },
    buckets: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/topology/buckets', { params })) },
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/topology/buckets/${id}`, { params })) },
      create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/topology/buckets', body || {})) },
      update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/topology/buckets/${id}`, body || {})) },
      delete(id: string) { return API.delete(`/api/topology/buckets/${id}`) },
    },
    bucketPolicies: {
      list(bucketId: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/topology/buckets/${bucketId}/policies`, { params })) },
      create(bucketId: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/topology/buckets/${bucketId}/policies`, body || {})) },
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/topology/policies/${id}`, { params })) },
      update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/topology/policies/${id}`, body || {})) },
      delete(id: string) { return API.delete(`/api/topology/policies/${id}`) },
    },
    images: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/topology/images', { params })) },
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/topology/images/${id}`, { params })) },
      create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/topology/images', body || {})) },
      update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/topology/images/${id}`, body || {})) },
      delete(id: string) { return API.delete(`/api/topology/images/${id}`) },
      pull(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/topology/images/${id}/pull`, body || {})) },
      tasks(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/topology/images/${id}/tasks`, { params })) },
    },
    pullTasks: {
      get(taskId: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/topology/pull-tasks/${taskId}`, { params })) },
    },
    volumes: {
      list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/volumes', { params })) },
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/volumes/${id}`, { params })) },
      create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/volumes', body || {})) },
      update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/volumes/${id}`, body || {})) },
      delete(id: string) { return API.delete(`/api/volumes/${id}`) },
    },
  },

  // ── Users ──
  users: {
    list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/users', { params })) },
    get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/users/${id}`, { params })) },
    update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/users/${id}`, body || {})) },
    delete(id: string) { return API.delete(`/api/users/${id}`) },
    refresh(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.post(`/api/users/${id}/refresh`, body || {})) },
    search(params?: Record<string, unknown>) { return extractData<unknown>(API.get('/api/users/search', { params })) },
    sessions: {
      list(params?: Record<string, unknown>) { return API.get('/api/users/sessions', { params }).then(r => (r.data as Record<string, unknown>).data) },
      delete(token: string) { return API.delete(`/api/users/sessions/${token}`) },
    },
    loginPolicy: {
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/users/${id}/login-policy`, { params })) },
      update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/users/${id}/login-policy`, body || {})) },
      delete(id: string) { return API.delete(`/api/users/${id}/login-policy`) },
    },
    publicKey: {
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/users/${id}/public-key`, { params })) },
      update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/users/${id}/public-key`, body || {})) },
      delete(id: string) { return API.delete(`/api/users/${id}/public-key`) },
    },
    avatar: {
      get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/users/${id}/avatar`, { params })) },
      update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/users/${id}/avatar`, body || {})) },
      delete(id: string) { return API.delete(`/api/users/${id}/avatar`) },
    },
    supplementaryGroups: {
      list(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/users/${id}/supplementary-groups`, { params })) },
      add(id: string, gid: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/users/${id}/supplementary-groups/${gid}`, body || {})) },
      remove(id: string, gid: string) { return API.delete(`/api/users/${id}/supplementary-groups/${gid}`) },
    },
  },

  // ── Volumes (under topology for backward compat) ──
  volumes: {
    list(params?: Record<string, unknown>) { return extractPage<unknown>(API.get('/api/volumes', { params })) },
    get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/volumes/${id}`, { params })) },
    create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/volumes', body || {})) },
    update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/volumes/${id}`, body || {})) },
    delete(id: string) { return API.delete(`/api/volumes/${id}`) },
  },

  // ── Dev ──
  dev: {
    triggerTick() { return API.post('/__tick') },
    migrateUserIndex(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/__admin/migrate-user-index', body || {})) },
    sudo(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/sudo', body || {})) },
    openapi() { return API.get('/api/openapi.json').then(r => r.data) },
  },

  // ── WebSocket ──
  ws: {
    notifications(params?: Record<string, unknown>) { return API.get('/api/ws/notifications', { params }) },
  },

  // ── Extract helpers (for generated SDK classes) ──
  extract<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> { return extractData<T>(promise) },
  extractArray,
  extractItems,
  extractPage,
}

// ── Manual patches (not derivable from OpenAPI) ──
;(api as Record<string, unknown>).pods = {
  list(params?: Record<string, unknown>) { return extractData<unknown>(API.get('/api/sandboxes/pod', { params })) },
  get(providerId: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/sandboxes/pod/${providerId}`, { params })) },
  stop(providerId: string) { return API.post(`/api/sandboxes/pod/${providerId}/stop`) },
  delete(providerId: string) { return API.delete(`/api/sandboxes/pod/${providerId}`) },
  create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/sandboxes/pod', body || {})) },
}
;(api.topology as Record<string, unknown>).credentials = {
  list(params?: Record<string, unknown>) { return extractItems<unknown>(API.get('/api/topology/credentials', { params })) },
  get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(`/api/topology/credentials/${id}`, { params })) },
  create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/topology/credentials', body || {})) },
  update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(`/api/topology/credentials/${id}`, body || {})) },
  delete(id: string) { return API.delete(`/api/topology/credentials/${id}`) },
}

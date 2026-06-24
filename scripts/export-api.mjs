/**
 * scripts/export-api.mjs — Generate src/api/index.ts from openapi.json
 *
 * Usage: node scripts/export-api.mjs
 *        (reads openapi.json, writes src/api/index.ts)
 *
 * Convention:
 *   GET  /api/{mod}/{col}           → {mod}.{col}.list(params?)
 *   POST /api/{mod}/{col}           → {mod}.{col}.create(body)
 *   GET  /api/{mod}/{col}/{id}      → {mod}.{col}.get(id)
 *   PUT  /api/{mod}/{col}/{id}      → {mod}.{col}.update(id, body)
 *   PATCH /api/{mod}/{col}/{id}     → {mod}.{col}.update(id, body)
 *   DELETE /api/{mod}/{col}/{id}    → {mod}.{col}.delete(id)
 *   POST /api/{mod}/{col}/{id}/act  → {mod}.{col}.act(id, body?)
 *   GET  /api/{mod}/{col}/{id}/sub  → {mod}.{col}.sub.list(id)   (if sub has CRUD)
 *   Otherwise                       → {mod}.{col}{Action}(params)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'

const SPEC_PATH = resolve(import.meta.dirname, '..', 'openapi.json')
const OUTPUT_PATH = resolve(import.meta.dirname, '..', 'src', 'api', 'index-generated.ts')

// ─── Read spec ───

const spec = JSON.parse(readFileSync(SPEC_PATH, 'utf-8'))
const paths = spec.paths || {}

// ─── Constants ───

const TAG_RENAME = {
  'Notifications': 'ws',
  'Public': 'dev',
  'Networks': 'securityGroups',
  'Volumes': 'volumes',
  'Topology': 'topology',
  'Container Secrets': 'containerSecrets',
  'System Groups': 'systemGroups',
}
const TAG_EXCLUDE = new Set(['Dev'])  // Dev tag = __become-wheel (removed)

// Check exclusion BEFORE renaming
function getPrimaryTag(endpoint) {
  const tags = endpoint.tags || ['Misc']
  const rawTag = tags[0]
  if (TAG_EXCLUDE.has(rawTag)) return null  // excluded
  return TAG_RENAME[rawTag] || rawTag.toLowerCase()
}

// ─── Group endpoints by tag ───

// (moved above)

function httpMethodToCrud(method, hasId) {
  const m = method.toLowerCase()
  if (m === 'get' && !hasId) return 'list'
  if (m === 'post' && !hasId) return 'create'
  if (m === 'get' && hasId) return 'get'
  if (m === 'put' && hasId) return 'update'
  if (m === 'patch' && hasId) return 'update'
  if (m === 'delete' && hasId) return 'delete'
  return null  // custom action
}

function isGetCollection(method) { return method.toLowerCase() === 'get' }
function isMutation(method) { return ['post', 'put', 'patch', 'delete'].includes(method.toLowerCase()) }

// ─── Parse a path into its hierarchy ───

function parsePath(pathStr) {
  const segments = pathStr.replace(/^\/api\//, '').split('/').filter(Boolean)
  const vars = segments.filter(s => s.startsWith('{') && s.endsWith('}')).map(s => s.slice(1, -1))
  return { segments, vars }
}

// ─── Build module structure ───

/**
 * For each tag, build a Map of collection → { crud: {}, actions: {}, subcollections: {} }
 * A "collection" is the prefix up to (but not including) the first {param}.
 * Everything after the first {param} is an action or sub-resource.
 */
function buildTagEndpoints(endpoints) {
  const collections = new Map()  // collectionPath → { crud: Map<method, endpoint>, actions: Map<actionName, endpoint[]>, subcollections: Map<subName, endpoint[]> }

  for (const ep of endpoints) {
    const { segments, vars } = parsePath(ep.path)

    // Find where the first {param} is
    const firstParamIdx = segments.findIndex(s => s.startsWith('{'))
    const collectionSegs = firstParamIdx < 0 ? segments : segments.slice(0, firstParamIdx)
    const collectionPath = collectionSegs.join('.')

    if (!collections.has(collectionPath)) {
      collections.set(collectionPath, { crud: new Map(), actions: new Map(), subcollections: new Map() })
    }
    const col = collections.get(collectionPath)

    if (firstParamIdx < 0) {
      // No params — CRUD on collection
      const crudName = httpMethodToCrud(ep.method, false)
      if (crudName) col.crud.set(crudName, ep)
      else { const k = safeMethodName(ep.method + '_' + segments.join('_')); if (!col.actions.has(k)) col.actions.set(k, []); col.actions.get(k).push(ep) }
      continue
    }

    // Has params — determine if it's CRUD on item, sub-resource, or action
    const afterParam = segments.slice(firstParamIdx + 1)  // segments after the first {param}
    const isItemCrud = afterParam.length === 0

    if (isItemCrud) {
      const crudName = httpMethodToCrud(ep.method, true)
      if (crudName) col.crud.set(crudName, ep)
      else { const k = safeMethodName(ep.method + '_' + collectionPath); if (!col.actions.has(k)) col.actions.set(k, []); col.actions.get(k).push(ep) }
      continue
    }

    // Has sub-resource or action after {param}
    const nextSegment = afterParam[0]

    // If nextSegment is itself a param, flatten everything (e.g., workspace/{runId}/{jobName})
    if (nextSegment.startsWith('{')) {
      ep._flatName = safeMethodName(afterParam.map(s => s.replace(/[{}]/g, '')).join('_'))
      if (!col.actions.has(ep._flatName)) col.actions.set(ep._flatName, [])
      col.actions.get(ep._flatName).push(ep)
      continue
    }

    const hasDeepId = afterParam.length >= 2 && afterParam[1].startsWith('{')

    if (hasDeepId) {
      // Sub-collection with nested ID → flatten as {subName}{Crud}
      const subName = nextSegment
      const crudAction = httpMethodToCrud(ep.method, true)
      const flatName = safeMethodName(subName + (crudAction ? crudAction.charAt(0).toUpperCase() + crudAction.slice(1) : ep.method.toLowerCase()))
      if (!col.actions.has(flatName)) col.actions.set(flatName, [])
      col.actions.get(flatName).push(ep)
      continue
    }

    // Single segment after param (e.g., workflows/{id}/trigger or workflows/{id}/secrets)
    const subName = nextSegment

    // Check if this sub-name has both GET and POST variants → sub-collection
    const sameSub = endpoints.filter(o => {
      if (o === ep) return false
      const os = parsePath(o.path)
      const ofp = os.segments.findIndex(s => s.startsWith('{'))
      if (ofp < 0) return false
      const oAfter = os.segments.slice(ofp + 1)
      return oAfter.length === 1 && oAfter[0] === subName
    })
    const hasBothGetPost = sameSub.some(o => o.method === 'GET') && sameSub.some(o => o.method === 'POST')

    if (hasBothGetPost) {
      // Sub-collection with list+create
      if (!col.subcollections.has(subName)) col.subcollections.set(subName, [])
      col.subcollections.get(subName).push(ep)
    } else {
      // Single action — use subName directly (e.g., trigger, login-policy → login_policy)
      const name = safeMethodName(subName)
      if (!col.actions.has(name)) col.actions.set(name, [])
      col.actions.get(name).push(ep)
    }
  }

  return collections
}

// ─── Helpers ───

function isValidIdentifier(name) {
  return /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(name)
}

function propName(name) {
  return isValidIdentifier(name) ? name : `'${name}'`
}

function safeMethodName(raw) {
  return raw.replace(/[^a-zA-Z0-9_$]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'x'
}

function urlTemplate(pathStr) {
  return pathStr.replace(/\{(\w+)\}/g, '${$1}')
}

// ─── Generate method code ───

function methodArgs(ep) {
  const { vars } = parsePath(ep.path)
  const method = ep.method.toLowerCase()
  const isMutation = ['post', 'put', 'patch'].includes(method)
  const isCollection = vars.length === 0

  const args = vars.map(v => `${v}: string`)
  if ((isMutation && isCollection) || (isMutation && vars.length >= 1)) {
    args.push('body?: Record<string, unknown>')
  }
  // Only add params for GET on collections or single items that accept filters
  if (method === 'get') {
    args.push('params?: Record<string, unknown>')
  }
  return args.join(', ')
}

function generateMethod(ep, crudName) {
  const args = methodArgs(ep)
  const url = urlTemplate(ep.path)
  const method = ep.method.toLowerCase()

  // Determine unwrap helper or raw call
  if (method === 'delete') {
    return `    /** ${ep.summary || ''} */\n    ${crudName}(${args}) { return API.delete(\`${url}\`) },`
  }

  if (method === 'get') {
    // GET — use extractPage (if list) or extractData (if single item)
    const { vars } = parsePath(ep.path)
    const isList = vars.length === 0 && crudName === 'list'
    const helper = isList ? 'extractPage' : 'extractData'
    return `    /** ${ep.summary || ''} */\n    ${crudName}(${args}) { return ${helper}<unknown>(API.get(\`${url}\`, { params })) },`
  }

  // POST / PUT / PATCH
  const helper = method === 'post' && crudName === 'create' ? 'extractData' : 'extractData'
  return `    /** ${ep.summary || ''} */\n    ${crudName}(${args}) { return ${helper}<unknown>(API.${method}(\`${url}\`, body || {})) },`
}

function generateActions(actions) {
  const lines = []
  const seen = new Set()
  for (const [name, eps] of actions) {
    for (const ep of eps) {
      let final = name
      if (seen.has(final)) {
        // Already used — append HTTP method to disambiguate
        final = safeMethodName(name + '_' + ep.method.toLowerCase())
      }
      seen.add(final)
      lines.push(generateMethod(ep, final))
    }
  }
  return lines.join('\n')
}

function generateSubcollection(colName, eps) {
  const crud = new Map()
  const others = []
  for (const ep of eps) {
    const { vars } = parsePath(ep.path)
    const hasDeepId = vars.length >= 2
    const crudName = httpMethodToCrud(ep.method, hasDeepId)
    if (crudName && !hasDeepId) {
      crud.set(crudName, ep)
    } else {
      others.push(ep)
    }
  }

  const lines = [`    ${propName(colName)}: {`]
  for (const [name, ep] of crud) {
    const { vars } = parsePath(ep.path)
    const parentVars = vars.slice(0, -1)
    const hasBody = ['post', 'put', 'patch'].includes(ep.method.toLowerCase())
    const firstVar = parentVars[0] || vars[0]
    const args = `${firstVar}: string` + (hasBody ? ', body?: Record<string, unknown>' : ', params?: Record<string, unknown>')
    const url = urlTemplate(ep.path)
    const method = ep.method.toLowerCase()

    if (method === 'delete') {
      lines.push(`      ${name}(${args}) { return API.delete(\`${url}\`) },`)
    } else if (method === 'get') {
      lines.push(`      /** ${ep.summary || ''} */\n      ${name}(${args}) { return extractPage<unknown>(API.get(\`${url}\`, { params })) },`)
    } else if (hasBody) {
      lines.push(`      /** ${ep.summary || ''} */\n      ${name}(${args}) { return extractData<unknown>(API.${method}(\`${url}\`, body || {})) },`)
    } else {
      lines.push(`      /** ${ep.summary || ''} */\n      ${name}(${args}) { return extractData<unknown>(API.${method}(\`${url}\`)) },`)
    }
  }
  for (const ep of others) {
    lines.push(generateMethod(ep, ep.method.toLowerCase() + 'Custom').replace('    ', '      '))
  }
  lines.push('    },')
  return lines.join('\n')
}

// ─── Group endpoints per tag ───

function collectEndpoints() {
  const tagEndpoints = {}
  for (const [pathStr, methods] of Object.entries(paths)) {
    if (pathStr === '/info') continue  // handled by InfoApi
    for (const [method, endpoint] of Object.entries(methods)) {
      if (method === 'parameters') continue
      const tag = getPrimaryTag(endpoint)
      if (!tag) continue  // excluded
      if (!tagEndpoints[tag]) tagEndpoints[tag] = []
      tagEndpoints[tag].push({ path: pathStr, method: method.toUpperCase(), ...endpoint })
    }
  }
  return tagEndpoints
}

function generateModule(tag, endpoints) {
  const collections = buildTagEndpoints(endpoints)
  const lines = [`  // ─── ${tag} ───`, `  ${propName(tag)}: {`]

  // Detect name collisions: if multiple collections share the same final segment,
  // the deeper ones get their full path as the property name
  const nameCount = new Map()
  for (const [colPath] of collections) {
    const n = colPath.split('.').pop()
    nameCount.set(n, (nameCount.get(n) || 0) + 1)
  }

  for (const [colPath, col] of collections) {
    const colName = colPath.split('.').pop()
    const hasContent = col.crud.size > 0 || col.actions.size > 0 || col.subcollections.size > 0
    if (!hasContent) continue

    // If the colName collides with another collection, use full path (dots → underscores)
    const displayName = nameCount.get(colName) > 1 ? safeMethodName(colPath) : propName(colName)

    const hasCrud = col.crud.size > 0
    const hasSubs = col.subcollections.size > 0
    const hasActions = col.actions.size > 0

    if (hasCrud && (hasSubs || hasActions)) {
      lines.push(`    ${displayName}: {`)
      for (const [crudName, ep] of col.crud) lines.push(generateMethod(ep, crudName))
      for (const [subName, eps] of col.subcollections) lines.push(generateSubcollection(subName, eps))
      lines.push(generateActions(col.actions))
      lines.push('    },')
    } else if (hasCrud) {
      lines.push(`    ${displayName}: {`)
      for (const [crudName, ep] of col.crud) lines.push(generateMethod(ep, crudName))
      lines.push('    },')
    } else if (hasActions && !hasSubs) {
      lines.push(`    ${displayName}: {`)
      lines.push(generateActions(col.actions))
      lines.push('    },')
    } else if (hasSubs) {
      lines.push(`    ${displayName}: {`)
      for (const [subName, eps] of col.subcollections) lines.push(generateSubcollection(subName, eps))
      lines.push('    },')
    }
  }

  lines.push('  },')
  return lines.join('\n')
}

// ─── Infrastructure template ───

function generateInfrastructure() {
  return `import axios from 'axios'

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
  if (token && cfg.headers) cfg.headers.Authorization = \`Bearer \${token}\`
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
      console.group(\`[API 5xx] \${err.config?.method?.toUpperCase()} \${err.config?.url}\`)
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
}`
}

// ─── Auth module (always needed, not in spec) ───

function generateAuthModule() {
  return `  // ─── Auth ───
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
      return API.get('/api/users/sessions').then(r => (r.data as Record<string,unknown>).data as unknown[])
    },
    deleteSession(token: string) {
      return API.delete(\`/api/users/sessions/\${token}\`)
    },
    search(q: string) {
      return extractData<unknown>(API.get('/api/users/search', { params: { q } }))
    },
  },`
}

// ─── Manual modules (not derivable from spec) ───

function generateManualPatches() {
  return `
// ─── Manual patches (not derivable from OpenAPI) ───
;(api as any).pods = {
  list(params?: Record<string, unknown>) { return extractData<unknown>(API.get('/api/sandboxes/pod', { params })) },
  get(providerId: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(\`/api/sandboxes/pod/$\{providerId}\`, { params })) },
  stop(providerId: string) { return API.post(\`/api/sandboxes/pod/$\{providerId}/stop\`) },
  delete(providerId: string) { return API.delete(\`/api/sandboxes/pod/$\{providerId}\`) },
  create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/sandboxes/pod', body || {})) },
}
;(api.topology as any).credentials = {
  list(params?: Record<string, unknown>) { return extractItems<unknown>(API.get('/api/topology/credentials', { params })) },
  get(id: string, params?: Record<string, unknown>) { return extractData<unknown>(API.get(\`/api/topology/credentials/$\{id}\`, { params })) },
  create(body?: Record<string, unknown>) { return extractData<unknown>(API.post('/api/topology/credentials', body || {})) },
  update(id: string, body?: Record<string, unknown>) { return extractData<unknown>(API.put(\`/api/topology/credentials/$\{id}\`, body || {})) },
  delete(id: string) { return API.delete(\`/api/topology/credentials/$\{id}\`) },
}`
}

// ─── Main ───

function main() {
  const tagEndpoints = collectEndpoints()
  const tagOrder = ['actions', 'audit', 'containersecrets', 'images', 'info', 'instances', 'permissions', 'platforms', 'pods', 'sandboxes', 'securitygroups', 'subnets', 'systemgroups', 'templates', 'topology', 'users', 'volumes', 'dev']

  let output = `// Auto-generated from openapi.json — DO NOT EDIT BY HAND
// Run: node scripts/export-api.mjs

${generateInfrastructure()}

// ─── Generated API surface ───
export const api = {
${generateAuthModule()}
`
  // Generate modules in a consistent order
  const seen = new Set()
  for (const tag of tagOrder) {
    if (tagEndpoints[tag]) {
      output += '\n' + generateModule(tag, tagEndpoints[tag]) + '\n'
      seen.add(tag)
    }
  }
  // Any remaining tags
  for (const tag of Object.keys(tagEndpoints)) {
    if (!seen.has(tag)) {
      output += '\n' + generateModule(tag, tagEndpoints[tag]) + '\n'
      seen.add(tag)
    }
  }

  output += `
  // ─── Extract helpers (for generated SDK classes) ───
  extract<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> { return extractData<T>(promise) },
  extractArray,
  extractItems,
  extractPage,
}
${generateManualPatches()}
`

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
  writeFileSync(OUTPUT_PATH, output, 'utf-8')
  console.log(`✓ Generated ${OUTPUT_PATH}`)
  console.log('  (Preview only — merge into src/api/index.ts manually)')
}

main()

/**
 * Contract test — validates every outgoing API request against openapi.json in dev mode.
 *
 * On mismatch: console.warn with details (path, method, closest match).
 * On unhandled rejection during validation: never throws — just logs.
 *
 * Usage (in main.ts):
 *   import { installContractCheck } from './api/contract'
 *   installContractCheck(API)
 */

import type { AxiosInstance } from 'axios'

let specPaths: Record<string, Record<string, unknown>> | null = null

async function loadSpec() {
  if (specPaths) return specPaths
  try {
    const res = await fetch('/api/openapi.json')
    const json = await res.json()
    specPaths = json.paths || {}
  } catch {
    console.warn('[contract] Failed to load openapi.json, skipping contract checks')
    specPaths = {}
  }
  return specPaths
}

function normalizePath(path: string): string {
  // Replace dynamic segments like /abc123/def456 with /{id}/{id}
  return path.replace(/\/[a-zA-Z0-9_-]{8,}/g, '/{id}')
}

function findClosest(actualPath: string, paths: Record<string, unknown>): string | null {
  const normalized = normalizePath(actualPath)
  const candidates = Object.keys(paths)

  // Exact match
  if (candidates.includes(actualPath)) return actualPath
  if (candidates.includes(normalized)) return normalized

  // Best partial match by segment structure
  const actualSegs = actualPath.split('/').filter(Boolean)
  let best: { path: string; score: number } | null = null
  for (const cand of candidates) {
    const candSegs = cand.split('/').filter(Boolean)
    if (candSegs.length !== actualSegs.length) continue
    let score = 0
    for (let i = 0; i < candSegs.length; i++) {
      if (candSegs[i] === actualSegs[i]) score += 2
      else if (candSegs[i].startsWith('{') && candSegs[i].endsWith('}')) score += 1
    }
    if (!best || score > best.score) best = { path: cand, score }
  }
  return best?.path ?? null
}

export function installContractCheck(instance: AxiosInstance) {
  instance.interceptors.request.use(async (config) => {
    const url = config.url
    if (!url || !url.startsWith('/')) return config

    const paths = await loadSpec()
    if (!paths || Object.keys(paths).length === 0) return config

    // Strip query string
    const [pathOnly] = url.split('?')
    const method = (config.method || 'get').toLowerCase()

    // Check if path exists verbatim
    if (paths[pathOnly]) {
      const methods = Object.keys(paths[pathOnly]).filter(k => k !== 'parameters')
      if (methods.map(m => m.toLowerCase()).includes(method)) return config
      console.warn(
        `[contract] %c${method.toUpperCase()} ${pathOnly}%c — method not in spec (allowed: ${methods.join(', ')})`,
        'color:#f56c6c', 'color:inherit',
      )
      return config
    }

    // Try normalized
    const normalized = normalizePath(pathOnly)
    if (paths[normalized]) {
      const methods = Object.keys(paths[normalized]).filter(k => k !== 'parameters')
      if (methods.map(m => m.toLowerCase()).includes(method)) return config
    }

    // Find closest
    const closest = findClosest(pathOnly, paths)
    const hint = closest ? ` — closest: ${method.toUpperCase()} ${closest}` : ''
    console.warn(
      `[contract] %c${method.toUpperCase()} ${pathOnly}%c → no matching endpoint in OpenAPI spec${hint}`,
      'color:#f56c6c', 'color:inherit',
    )

    return config
  })
}

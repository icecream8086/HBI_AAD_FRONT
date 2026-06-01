import { describe, it, expect } from 'vitest'
import type { ApiResponse } from '../../../src/api'

describe('ApiResponse type', () => {
  it('supports success response shape', () => {
    const res: ApiResponse<{ id: string }> = {
      success: true,
      data: { id: 'test-123' },
      error: null,
    }
    expect(res.success).toBe(true)
    expect(res.data.id).toBe('test-123')
    expect(res.error).toBeNull()
  })

  it('supports error response shape', () => {
    const res: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: 'NOT_FOUND', message: 'Resource not found' },
    }
    expect(res.success).toBe(false)
    expect(res.error?.code).toBe('NOT_FOUND')
    expect(res.error?.message).toBe('Resource not found')
  })

  it('works with array data', () => {
    const res: ApiResponse<string[]> = {
      success: true,
      data: ['a', 'b', 'c'],
      error: null,
    }
    expect(res.data).toHaveLength(3)
    expect(res.data[0]).toBe('a')
  })

  it('works with paginated data', () => {
    const res: ApiResponse<{ items: number[]; total: number }> = {
      success: true,
      data: { items: [1, 2], total: 2 },
      error: null,
    }
    expect(res.data.total).toBe(2)
    expect(res.data.items).toHaveLength(2)
  })
})

describe('API auth endpoints', () => {
  it('login request shape', () => {
    const body = { email: 'user@test.com', password: 'secret123' }
    expect(body.email).toBeDefined()
    expect(body.password).toBeDefined()
  })

  it('register request shape', () => {
    const body = { name: 'Test', email: 'user@test.com', password: 'secret123' }
    expect(body.name).toBeDefined()
    expect(body.email).toBeDefined()
    expect(body.password).toBeDefined()
    expect(body.password.length).toBeGreaterThanOrEqual(8)
  })

  it('AuthResponse shape', () => {
    const res: AuthResponse = {
      token: 'sess_xxx',
      user: {
        id: 'u1',
        email: 'test@test.com',
        name: 'Test',
        role: 'Viewer',
        createdAt: 1000,
        updatedAt: 1000,
        privateKeyEd25519: '',
      },
    }
    expect(res.token).toMatch(/^sess_/)
    expect(res.user.role).toMatch(/^(root|Operator|Viewer)$/)
  })
})

describe('Event loop types', () => {
  it('EventLoopStatus shape', () => {
    const status: EventLoopStatus = {
      running: true,
      tickInterval: 5000,
      queueSize: 0,
      lastTick: Date.now(),
    }
    expect(status.running).toBeTypeOf('boolean')
    expect(status.tickInterval).toBeTypeOf('number')
  })
})

describe('HealthStatus type', () => {
  it('valid status values', () => {
    const healthy: HealthStatus = { status: 'healthy', lastCheck: Date.now() }
    const unhealthy: HealthStatus = { status: 'unhealthy', lastCheck: Date.now(), message: 'OOM' }
    expect(['healthy', 'unhealthy', 'unknown']).toContain(healthy.status)
    expect(['healthy', 'unhealthy', 'unknown']).toContain(unhealthy.status)
    expect(unhealthy.message).toBe('OOM')
  })
})

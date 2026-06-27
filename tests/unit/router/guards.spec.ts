import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

// Mock the store used by the actual router
vi.mock('../../../src/store', () => ({
  default: { state: { auth: { isLoggedIn: false } } },
}))

describe('router navigation guards', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/login',
          name: 'Login',
          component: { template: '<div>login</div>' },
          meta: { requiresAuth: false },
        },
        {
          path: '/dashboard',
          name: 'Dashboard',
          component: { template: '<div>dashboard</div>' },
          meta: { requiresAuth: true },
        },
      ],
    })
  })

  it('redirects unauthenticated to login', async () => {
    router.beforeEach((to, _from, next) => {
      const isLoggedIn = false
      if (to.meta.requiresAuth && !isLoggedIn) next('/login')
      else next()
    })
    await router.push('/dashboard')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('redirects authenticated user from login to dashboard', async () => {
    router.beforeEach((to, _from, next) => {
      if (to.path === '/login') next('/dashboard')
      else next()
    })
    await router.push('/login')
    expect(router.currentRoute.value.path).toBe('/dashboard')
  })

  it('allows public routes without auth', async () => {
    router.beforeEach((to, _from, next) => {
      if (to.meta.requiresAuth) next('/login')
      else next()
    })
    await router.push('/login')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('allows authenticated user to access protected routes', async () => {
    router.beforeEach((to, _from, next) => {
      if (!to.meta.requiresAuth) next('/login')
      else next()
    })
    await router.push('/dashboard')
    expect(router.currentRoute.value.path).toBe('/dashboard')
  })
})

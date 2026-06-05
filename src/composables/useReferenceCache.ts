import { ref, type Ref } from 'vue'
import { api } from '../api'

interface CacheEntry<T> {
  data: Ref<T>
  promise: Promise<void> | null
}

const instancesCache: CacheEntry<ComputeInstance[]> = {
  data: ref([]),
  promise: null,
}
const credentialsCache: CacheEntry<MaskedCredential[]> = {
  data: ref([]),
  promise: null,
}
const imagesCache: CacheEntry<ImageRepository[]> = {
  data: ref([]),
  promise: null,
}
const usersCache: CacheEntry<User[]> = {
  data: ref([]),
  promise: null,
}
const securityGroupsCache: CacheEntry<unknown[]> = {
  data: ref([]),
  promise: null,
}
const subnetsCache: CacheEntry<unknown[]> = {
  data: ref([]),
  promise: null,
}

async function loadOnce<T>(cache: CacheEntry<T>, loader: () => Promise<T>): Promise<void> {
  if (cache.promise) return cache.promise
  cache.promise = (async () => {
    try { cache.data.value = await loader() }
    catch { /* ignore — caller handles empty data */ }
  })()
  return cache.promise
}

function refresh<T>(cache: CacheEntry<T>, loader: () => Promise<T>): Promise<void> {
  cache.promise = null
  return loadOnce(cache, loader)
}

export function useReferenceCache() {
  return {
    instances: {
      data: instancesCache.data,
      load: () => loadOnce(instancesCache, () => api.topology.instances.list().then(r => r ?? [])),
      refresh: () => refresh(instancesCache, () => api.topology.instances.list().then(r => r ?? [])),
    },
    credentials: {
      data: credentialsCache.data,
      load: () => loadOnce(credentialsCache, () => api.topology.credentials.list().then(r => r ?? [])),
      refresh: () => refresh(credentialsCache, () => api.topology.credentials.list().then(r => r ?? [])),
    },
    images: {
      data: imagesCache.data,
      load: () => loadOnce(imagesCache, () => api.topology.images.list().then(r => r ?? [])),
      refresh: () => refresh(imagesCache, () => api.topology.images.list().then(r => r ?? [])),
    },
    users: {
      data: usersCache.data,
      load: () => loadOnce(usersCache, () => api.extractArray<User>(api.users.apiUsersGet())),
      refresh: () => refresh(usersCache, () => api.extractArray<User>(api.users.apiUsersGet())),
    },
    securityGroups: {
      data: securityGroupsCache.data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      load: () => loadOnce(securityGroupsCache, () => api.securityGroups.list().then(r => (r.data as any)?.data?.items ?? []) as Promise<unknown[]>),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      refresh: () => refresh(securityGroupsCache, () => api.securityGroups.list().then(r => (r.data as any)?.data?.items ?? []) as Promise<unknown[]>),
    },
    subnets: {
      data: subnetsCache.data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      load: () => loadOnce(subnetsCache, () => api.subnets.list().then(r => (r.data as any)?.data?.items ?? []) as Promise<unknown[]>),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      refresh: () => refresh(subnetsCache, () => api.subnets.list().then(r => (r.data as any)?.data?.items ?? []) as Promise<unknown[]>),
    },
  }
}

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
      load: () => loadOnce(instancesCache, () => api.topology.instances.list().then(r => (r as { items: ComputeInstance[] }).items ?? [])),
      refresh: () => refresh(instancesCache, () => api.topology.instances.list().then(r => (r as { items: ComputeInstance[] }).items ?? [])),
    },
    credentials: {
      data: credentialsCache.data,
      load: () => loadOnce(credentialsCache, () => ((api.topology as Record<string, unknown>).credentials as { list: () => Promise<MaskedCredential[]> }).list().then((r) => r ?? [])),
      refresh: () => refresh(credentialsCache, () => ((api.topology as Record<string, unknown>).credentials as { list: () => Promise<MaskedCredential[]> }).list().then((r) => r ?? [])),
    },
    images: {
      data: imagesCache.data,
      load: () => loadOnce(imagesCache, () => api.topology.images.list().then((r) => r.items as ImageRepository[])),
      refresh: () => refresh(imagesCache, () => api.topology.images.list().then((r) => r.items as ImageRepository[])),
    },
    users: {
      data: usersCache.data,
      load: () => loadOnce(usersCache, () => api.users.list().then((r) => (r.items ?? []) as User[])),
      refresh: () => refresh(usersCache, () => api.users.list().then((r) => (r.items ?? []) as User[])),
    },
    securityGroups: {
      data: securityGroupsCache.data,
      load: () => loadOnce(securityGroupsCache, () => api.securityGroups.list().then((r) => (r.items ?? []) as unknown[])),
      refresh: () => refresh(securityGroupsCache, () => api.securityGroups.list().then((r) => (r.items ?? []) as unknown[])),
    },
    subnets: {
      data: subnetsCache.data,
      load: () => loadOnce(subnetsCache, () => api.subnets.list().then((r) => (r.items ?? []) as unknown[])),
      refresh: () => refresh(subnetsCache, () => api.subnets.list().then((r) => (r.items ?? []) as unknown[])),
    },
  }
}

import { ref } from 'vue'
import { api } from '../api'

/** Loads reference data (users, templates, groups) once and provides name-resolution helpers. */
export function useResolver() {
  const users = ref<User[]>([])
  const templates = ref<SandboxTemplate[]>([])
  const userGroups = ref<UserGroup[]>([])
  const permGroups = ref<PermissionGroup[]>([])
  const loaded = ref(false)

  async function load() {
    if (loaded.value) return
    loaded.value = true
    const r = await Promise.allSettled([
      api.users.list().then((v) => { users.value = (v.items ?? []) as User[] }),
      api.templates.list().then((v) => { templates.value = (v.items ?? []) as SandboxTemplate[] }),
      api.permissions.userGroups.list().then((v) => { userGroups.value = (v.items ?? []) as UserGroup[] }),
      api.permissions.groups.list().then((v) => { permGroups.value = (v.items ?? []) as PermissionGroup[] }),
    ])
    return r
  }

  function userName(id: string | null | undefined): string {
    if (!id) return '-'
    const u = users.value.find(x => x.id === id)
    return u?.name || u?.email || id.slice(0, 12)
  }

  function templateName(id: string | null | undefined): string {
    if (!id) return '-'
    const t = templates.value.find(x => x.id === id)
    return t?.name || id.slice(0, 12)
  }

  function groupName(id: string | null | undefined): string {
    if (!id) return '-'
    const g = userGroups.value.find(x => x.id === id)
    return g?.name || id.slice(0, 12)
  }

  function permGroupName(id: string | null | undefined): string {
    if (!id) return '-'
    const g = permGroups.value.find(x => x.id === id)
    return g?.name || id.slice(0, 12)
  }

  function resolveNames(ids: string[] | undefined, resolver: (id: string) => string): { id: string; name: string }[] {
    if (!ids?.length) return []
    return ids.map(id => ({ id, name: resolver(id) }))
  }

  return { users, templates, userGroups, permGroups, loaded, load, userName, templateName, groupName, permGroupName, resolveNames }
}

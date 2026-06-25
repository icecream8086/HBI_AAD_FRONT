<template>
  <el-container class="main-layout">
    <!-- Sidebar -->
    <el-aside :width="isCollapsed ? '64px' : '240px'" class="sidebar">
      <div class="sidebar-header">
        <template v-if="!isCollapsed">
          <span class="logo-text">HBI AAD</span>
          <span class="logo-desc">扩展字段编辑器</span>
        </template>
        <span v-else class="logo-icon">H</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="isCollapsed"
        :collapse-transition="false"
        background-color="transparent"
        text-color="var(--sidebar-text, var(--el-text-color-primary))"
        active-text-color="var(--sidebar-active, var(--el-color-primary))"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>{{ $t('menu.dashboard') }}</template>
        </el-menu-item>

        <el-sub-menu index="actions">
          <template #title>
            <el-icon><VideoPlay /></el-icon>
            <span>{{ $t('menu.actions') }}</span>
          </template>
          <el-menu-item index="/actions/dashboard">{{ $t('menu.actionDashboard') }}</el-menu-item>
          <el-menu-item index="/actions/workflows">{{ $t('menu.workflows') }}</el-menu-item>
          <el-menu-item index="/actions/runs">{{ $t('menu.workflowRuns') }}</el-menu-item>
          <el-menu-item index="/actions/runners">{{ $t('menu.runners') }}</el-menu-item>
          <el-menu-item index="/actions/registry">{{ $t('menu.actionRegistry') }}</el-menu-item>
          <el-menu-item index="/actions/shared-links">{{ $t('menu.sharedLinks') }}</el-menu-item>
          <el-menu-item index="/actions/organizations">{{ $t('menu.actionOrganizations') }}</el-menu-item>
          <el-menu-item index="/actions/templates">{{ $t('menu.actionTemplates') }}</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="sandbox-group">
          <template #title>
            <el-icon><Monitor /></el-icon>
            <span>{{ $t('menu.sandboxes') }}</span>
          </template>
          <el-menu-item index="/sandboxes">{{ $t('menu.sandboxList') }}</el-menu-item>
          <el-menu-item index="/sandboxes/pods">{{ $t('menu.sandboxPods') }}</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/templates">
          <el-icon><Document /></el-icon>
          <template #title>{{ $t('menu.templates') }}</template>
        </el-menu-item>
        <el-menu-item index="/images">
          <el-icon><PictureFilled /></el-icon>
          <template #title>{{ $t('menu.images') }}</template>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <template #title>{{ $t('menu.users') }}</template>
        </el-menu-item>

        <el-sub-menu index="admin">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>{{ $t('menu.permissions') }}</span>
          </template>
          <el-menu-item index="/permissions/policies">{{ $t('menu.policies') }}</el-menu-item>
          <el-menu-item index="/permissions/groups">{{ $t('menu.permissionGroups') }}</el-menu-item>
          <el-menu-item index="/permissions/user-groups">{{ $t('menu.userGroups') }}</el-menu-item>
          <el-menu-item index="/permissions/route-acls">{{ $t('menu.routeAcls') }}</el-menu-item>
          <el-menu-item index="/permissions/system-groups">{{ $t('menu.systemGroups') }}</el-menu-item>
          <el-menu-item index="/permissions/user-templates">{{ $t('menu.userTemplates') }}</el-menu-item>
          <el-menu-item index="/permissions/container-secrets">{{ $t('menu.containerSecrets') }}</el-menu-item>
          <el-menu-item index="/permissions/elevations">{{ $t('menu.elevations') }}</el-menu-item>
          <el-menu-item index="/permissions/invitations">{{ $t('menu.invitations') }}</el-menu-item>
          <el-menu-item index="/permissions/tools">{{ $t('menu.permTools') }}</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="topology">
          <template #title>
            <el-icon><MapLocation /></el-icon>
            <span>{{ $t('menu.topology') }}</span>
          </template>
          <el-menu-item index="/topology/instances">
            <el-icon><Cpu /></el-icon>
            {{ $t('menu.instances') }}
          </el-menu-item>
          <el-menu-item index="/topology/credentials">{{ $t('menu.credentials') }}</el-menu-item>
          <el-menu-item index="/topology/buckets">{{ $t('menu.buckets') }}</el-menu-item>
          <el-menu-item index="/topology/volumes">{{ $t('menu.volumes') }}</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="network">
          <template #title>
            <el-icon><Connection /></el-icon>
            <span>{{ $t('menu.network') }}</span>
          </template>
          <el-menu-item index="/networks">{{ $t('menu.securityGroups') }}</el-menu-item>
          <el-menu-item index="/subnets">{{ $t('menu.subnets') }}</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/audit">
          <el-icon><List /></el-icon>
          <template #title>{{ $t('menu.audit') }}</template>
        </el-menu-item>
        <el-menu-item index="/events">
          <el-icon><Refresh /></el-icon>
          <template #title>{{ $t('menu.events') }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- Right side -->
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleSidebar" :size="18">
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb>
            <el-breadcrumb-item :to="{ path: '/dashboard' }">{{ $t('common.home') }}</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta?.title">{{ $t(route.meta.title as string) }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <span class="ext-editor-btn" @click="$router.push('/extension-fields')">
            <el-icon :size="15" style="margin-right:3px;vertical-align:text-bottom"><Setting /></el-icon>
            扩展字段编辑器
          </span>

          <!-- Language switcher -->
          <el-dropdown trigger="click" @command="cmd => setLang(cmd)">
            <span class="user-trigger">
              <el-icon :size="16"><ChatDotSquare /></el-icon>
              <span style="margin:0 2px">{{ locale === 'zh-CN' ? '简体中文' : 'English' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="opt in LANG_OPTIONS" :key="opt.id" :command="opt.id">
                  {{ opt.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- Theme switcher -->
          <el-dropdown trigger="click" @command="cmd => setTheme(cmd)">
            <span class="user-trigger">
              <el-icon :size="18"><MagicStick /></el-icon>
              <span style="margin:0 4px">{{ $t('theme.' + currentInfo.id) }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="t in themes" :key="t.id" :command="t.id">
                  <el-icon><component :is="t.icon as any" /></el-icon>{{ $t('theme.' + t.id) }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- Sudo button -->
          <el-tooltip v-if="sudoRemainingMs > 0" :content="$t('common.sudoRemaining') + ': ' + fmtDuration(sudoRemainingMs)" placement="bottom">
            <el-button size="small" type="warning" @click="handleSudo" class="sudo-btn">
              <el-icon><WarningFilled /></el-icon>
              {{ $t('common.sudoActive') }}
            </el-button>
          </el-tooltip>
          <el-button v-else size="small" @click="handleSudo" class="sudo-btn">
            <el-icon><Top /></el-icon>
            {{ $t('common.sudo') }}
          </el-button>

          <!-- Invite button -->
          <el-button size="small" @click="showInviteDlg = true" class="invite-btn">
            <el-icon><UserFilled /></el-icon>
            {{ $t('permission.invite') }}
          </el-button>

          <!-- API quick reference -->
          <el-popover trigger="click" :width="380">
            <template #reference>
              <el-button size="small" circle class="api-doc-btn">
                <el-icon :size="16"><Document /></el-icon>
              </el-button>
            </template>
            <div style="font-size:13px;line-height:1.6">
              <div style="margin-bottom:8px"><strong>Auth</strong><br><code style="font-size:12px;background:var(--el-fill-color-light);padding:1px 4px;border-radius:3px">Authorization: Bearer sess_xxx</code><br><span style="font-size:12px;color:var(--el-text-color-secondary)">2h 过期，401 自动跳转登录</span></div>
              <div style="margin-bottom:8px"><strong>分页</strong><br><code style="font-size:12px;background:var(--el-fill-color-light);padding:1px 4px;border-radius:3px">?page=&limit=&name=&type=&status=</code></div>
              <div style="margin-bottom:8px"><strong>角色</strong><br><el-tag size="small" type="danger">wheel</el-tag> 最高权限 <el-tag size="small" type="warning">root</el-tag> 管理 <el-tag size="small">Operator</el-tag> <el-tag size="small" type="info">Viewer</el-tag></div>
              <div style="margin-bottom:8px"><strong>审计</strong><br><span style="font-size:12px;color:var(--el-text-color-secondary)">生产环境 GET /api/audit/logs 不工作，走 wrangler tail / Logpush</span></div>
              <div style="margin-bottom:4px"><strong>Volume</strong><br><span style="font-size:12px;color:var(--el-text-color-secondary)">必须绑定到计算实例（instanceId）</span></div>
              <el-divider style="margin:6px 0" />
              <div style="font-size:12px;color:var(--el-text-color-secondary)">
                <a href="/api/openapi.json" target="_blank">OpenAPI JSON</a>
                <span style="margin:0 6px">|</span>154 路由 · 82 路径
              </div>
            </div>
          </el-popover>

          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-trigger">
              <el-avatar :size="28" :src="avatarBlob" style="margin-right:6px">
                {{ (user?.name || user?.email || 'U')[0].toUpperCase() }}
              </el-avatar>
              <span class="username">{{ user?.name || user?.email || $t('common.profile') }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>{{ $t('common.profile') }}
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>{{ $t('common.logout') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>

    <!-- Invite dialog -->
    <el-dialog v-model="showInviteDlg" :title="$t('permission.inviteMember')" width="450px">
      <el-form label-width="80px">
        <el-form-item :label="$t('permission.userGroups')">
          <el-select v-model="inviteForm.groupId" filterable :placeholder="$t('permission.groupSelectPlaceholder')" style="width:100%">
            <el-option v-for="g in inviteGroups" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('permission.members')">
          <el-select v-model="inviteForm.userId" filterable :placeholder="$t('permission.userSelectPlaceholder')" style="width:100%">
            <el-option v-for="u in inviteUsers" :key="u.id" :label="`${u.name} (${u.email})`" :value="u.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInviteDlg = false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" :loading="inviteSaving" @click="handleHeaderInvite">{{ $t('permission.invite') }}</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useTheme } from '../composables/useTheme'
import { useLocale, LANG_OPTIONS } from '../composables/useLocale'
import { API_BASE, api } from '../api'

const route = useRoute()
const router = useRouter()
const store = useStore<State>()
const { themes, currentInfo, setTheme } = useTheme()
const { locale, setLang, toggleLang } = useLocale()
const { t } = useI18n()

const user = computed(() => store.state.auth.currentUser)
const isCollapsed = computed(() => store.state.app.sidebarCollapsed)
const avatarBlob = ref('')
let avatarReq = 0
async function loadAvatar() {
  if (!user.value?.id) { avatarBlob.value = ''; return }
  const reqId = ++avatarReq
  try {
    const token = localStorage.getItem('access_token')
    const res = await fetch(`${API_BASE}/api/users/${user.value.id}/avatar`, { headers: { 'Authorization': `Bearer ${token}` } })
    if (!res.ok) { if (reqId === avatarReq) avatarBlob.value = ''; return }
    const blob = await res.blob()
    if (reqId !== avatarReq) return
    const url = URL.createObjectURL(blob)
    const prev = avatarBlob.value
    avatarBlob.value = url
    if (prev) URL.revokeObjectURL(prev)
  } catch { if (reqId === avatarReq) avatarBlob.value = '' }
}
watch([user], loadAvatar, { immediate: true })

function toggleSidebar() { store.commit('app/TOGGLE_SIDEBAR') }

// ─── Sudo ───
const SUDO_EXPIRY_KEY = 'sudo_expiry'
const sudoExpiry = ref(Number(localStorage.getItem(SUDO_EXPIRY_KEY)) || 0)
const sudoRemainingMs = ref(0)
let sudoTimer: ReturnType<typeof setInterval> | null = null

function updateSudoRemaining() {
  const rem = sudoExpiry.value - Date.now()
  if (rem > 0) {
    sudoRemainingMs.value = rem
  } else {
    sudoRemainingMs.value = 0
    sudoExpiry.value = 0
    localStorage.removeItem(SUDO_EXPIRY_KEY)
    if (sudoTimer) { clearInterval(sudoTimer); sudoTimer = null }
  }
}

// On mount, resume countdown if sudo was active
if (sudoExpiry.value > 0) {
  updateSudoRemaining()
  if (sudoRemainingMs.value > 0) {
    sudoTimer = setInterval(updateSudoRemaining, 1000)
  } else {
    sudoExpiry.value = 0
    localStorage.removeItem(SUDO_EXPIRY_KEY)
  }
}

async function handleSudo() {
  // If sudo is already active, show remaining time
  if (sudoRemainingMs.value > 0) {
    ElMessage.info(`${t('common.sudoRemaining')}: ${fmtDuration(sudoRemainingMs.value)}`)
    return
  }
  try {
    await ElMessageBox.confirm(
      t('common.sudoConfirmMsg'),
      t('common.sudoConfirmTitle'),
      { confirmButtonText: t('common.sudo'), cancelButtonText: t('table.cancel'), type: 'warning' },
    )
  } catch { return /* user cancelled */ }

  try {
    const res = await api.dev.sudo()
    const expiry = res.expiry
    sudoExpiry.value = expiry
    localStorage.setItem(SUDO_EXPIRY_KEY, String(expiry))
    updateSudoRemaining()
    sudoTimer = setInterval(updateSudoRemaining, 1000)
    ElMessage.success(t('common.sudoGranted'))
  } catch {
    ElMessage.error(t('common.sudoFailed'))
  }
}

function fmtDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

// ─── Invite ───
const showInviteDlg = ref(false)
const inviteSaving = ref(false)
const inviteForm = reactive({ groupId: '', userId: '' })
const inviteGroups = ref<UserGroup[]>([])
const inviteUsers = ref<User[]>([])

async function loadInviteRefs() {
  try {
    const [groups, users] = await Promise.all([
      api.permissions.userGroups.list({ limit: 100 }).then(r => r.items),
      api.users.list({ limit: 200 }).then(r => r.items),
    ])
    inviteGroups.value = groups
    inviteUsers.value = users
  } catch { /* ignore */ }
}

async function handleHeaderInvite() {
  if (!inviteForm.groupId) { ElMessage.warning(t('permission.groupSelectPlaceholder')); return }
  if (!inviteForm.userId) { ElMessage.warning(t('permission.selectUserFirst')); return }
  inviteSaving.value = true
  try {
    await api.perm.invite({ groupId: inviteForm.groupId, inviteeId: inviteForm.userId })
    ElMessage.success(t('permission.inviteSuccess'))
    showInviteDlg.value = false
    inviteForm.groupId = ''
    inviteForm.userId = ''
  } catch { ElMessage.error(t('permission.actionFailed')) }
  finally { inviteSaving.value = false }
}

onUnmounted(() => { if (sudoTimer) clearInterval(sudoTimer) })

function handleCommand(cmd: string) {
  if (cmd === 'profile') router.push('/profile')
  if (cmd === 'logout') {
    sudoExpiry.value = 0; sudoRemainingMs.value = 0
    localStorage.removeItem(SUDO_EXPIRY_KEY)
    if (sudoTimer) { clearInterval(sudoTimer); sudoTimer = null }
    store.commit('auth/CLEAR_AUTH')
    ElMessage.success(t('common.logoutSuccess'))
    router.push('/login')
  }
}

// On mount, refetch user profile if token exists
onMounted(async () => {
  if (store.state.auth.token && !store.state.auth.currentUser) {
    try {
      const userId = localStorage.getItem('current_user_id')
      if (userId) {
        const user = await api.users.get(userId)
        store.commit('auth/SET_USER', user)
      }
    } catch { /* ignore */ }
  }
  loadInviteRefs()
})
</script>

<style scoped>
.main-layout { height: 100vh; }
.sidebar {
  background: var(--sidebar-bg, var(--el-bg-color));
  border-right: 1px solid var(--nav-border, var(--el-border-color-light));
  overflow-y: auto;
  transition: width 0.3s;
}
.sidebar-header {
  height: var(--header-height);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-weight: bold;
  color: var(--sidebar-text, var(--el-text-color-primary));
  border-bottom: 1px solid var(--nav-border, var(--el-border-color-light));
  background: var(--sidebar-bg, transparent);
}
.logo-text { font-size: 16px; }
.logo-desc { font-size: 11px; color: var(--el-text-color-secondary); font-weight: 400; }
.logo-icon { font-size: 22px; }
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  background: var(--nav-bg, var(--el-bg-color));
  border-bottom: 1px solid var(--nav-border, var(--el-border-color-light));
  padding: 0 16px;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.header-right { display: flex; align-items: center; gap: 16px; }
.collapse-btn { cursor: pointer; }
.user-trigger { cursor: pointer; display: flex; align-items: center; gap: 4px; color: var(--nav-text, var(--el-text-color-primary)); }
.lang-switch { cursor: pointer; font-size: 13px; font-weight: 600; padding: 2px 8px; border-radius: 4px; user-select: none; }
.lang-switch:hover { background: var(--el-fill-color-light); }
.header :deep(.el-breadcrumb__inner) { color: var(--nav-text, var(--el-text-color-regular)) !important; }
.header :deep(.el-breadcrumb__separator) { color: var(--nav-text, var(--el-text-color-placeholder)) !important; }
.username { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.main-content {
  background: var(--app-bg, var(--el-bg-color-page));
  overflow-y: auto;
}
.sudo-btn { margin-right: 4px; }
.sudo-btn .el-icon { margin-right: 3px; }
.invite-btn { margin-right: 4px; }
.invite-btn .el-icon { margin-right: 3px; }
.api-doc-btn { margin-right: 4px; }
.ext-editor-btn {
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-regular);
  padding: 2px 8px;
  border-radius: 4px;
  user-select: none;
  white-space: nowrap;
}
.ext-editor-btn:hover { color: var(--el-color-primary); background: var(--el-fill-color-light); }
</style>

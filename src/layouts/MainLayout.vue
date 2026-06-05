<template>
  <el-container class="main-layout">
    <!-- Sidebar -->
    <el-aside :width="isCollapsed ? '64px' : '240px'" class="sidebar">
      <div class="sidebar-header">
        <span v-if="!isCollapsed" class="logo-text">HBI AAD</span>
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
        </el-sub-menu>

        <el-sub-menu index="topology">
          <template #title>
            <el-icon><MapLocation /></el-icon>
            <span>{{ $t('menu.topology') }}</span>
          </template>
          <el-menu-item index="/topology/instances">{{ $t('menu.instances') }}</el-menu-item>
          <el-menu-item index="/topology/credentials">{{ $t('menu.credentials') }}</el-menu-item>
          <el-menu-item index="/topology/buckets">{{ $t('menu.buckets') }}</el-menu-item>
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
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
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
        const user = await api.extract<User>(api.users.apiUsersIdGet(userId))
        store.commit('auth/SET_USER', user)
      }
    } catch { /* ignore */ }
  }
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
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 20px;
  color: var(--sidebar-text, var(--el-text-color-primary));
  border-bottom: 1px solid var(--nav-border, var(--el-border-color-light));
  background: var(--sidebar-bg, transparent);
}
.logo-icon { font-size: 24px; }
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
</style>

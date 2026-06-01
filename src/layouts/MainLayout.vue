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
        text-color="var(--el-text-color-primary)"
        active-text-color="var(--el-color-primary)"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/sandboxes">
          <el-icon><Monitor /></el-icon>
          <template #title>沙箱</template>
        </el-menu-item>
        <el-menu-item index="/templates">
          <el-icon><Document /></el-icon>
          <template #title>模板</template>
        </el-menu-item>
        <el-menu-item index="/images">
          <el-icon><PictureFilled /></el-icon>
          <template #title>镜像</template>
        </el-menu-item>

        <el-sub-menu index="admin">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/users">用户管理</el-menu-item>
          <el-menu-item index="/permissions/policies">策略</el-menu-item>
          <el-menu-item index="/permissions/groups">权限组</el-menu-item>
          <el-menu-item index="/permissions/user-groups">用户组</el-menu-item>
          <el-menu-item index="/permissions/route-acls">路由 ACL</el-menu-item>
          <el-menu-item index="/permissions/system-groups">系统组</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/audit">
          <el-icon><List /></el-icon>
          <template #title>审计日志</template>
        </el-menu-item>
        <el-menu-item index="/platforms">
          <el-icon><Connection /></el-icon>
          <template #title>平台</template>
        </el-menu-item>
        <el-menu-item index="/events">
          <el-icon><Refresh /></el-icon>
          <template #title>事件循环</template>
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
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta?.title">{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-trigger">
              <el-avatar :size="28" style="margin-right:6px">
                {{ (user?.name || user?.email || 'U')[0].toUpperCase() }}
              </el-avatar>
              <span class="username">{{ user?.name || user?.email || '用户' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
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
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { useTheme } from '../composables/useTheme'
import { api } from '../api'

const route = useRoute()
const router = useRouter()
const store = useStore<State>()
useTheme()

const user = computed(() => store.state.auth.currentUser)
const isCollapsed = computed(() => store.state.app.sidebarCollapsed)

function toggleSidebar() { store.commit('app/TOGGLE_SIDEBAR') }

function handleCommand(cmd: string) {
  if (cmd === 'profile') router.push('/profile')
  if (cmd === 'logout') {
    store.commit('auth/CLEAR_AUTH')
    ElMessage.success('已退出')
    router.push('/login')
  }
}

// On mount, refetch user profile if token exists
onMounted(async () => {
  if (store.state.auth.token && !store.state.auth.currentUser) {
    try {
      const users = await api.extract<User[]>(api.users.apiUsersGet())
      // Store user from token - re-login needed if not found
      if (users.length > 0) store.commit('auth/SET_USER', users[0])
    } catch { /* ignore */ }
  }
})
</script>

<style scoped>
.main-layout { height: 100vh; }
.sidebar {
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
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
  border-bottom: 1px solid var(--el-border-color-light);
}
.logo-icon { font-size: 24px; }
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 0 16px;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.header-right { display: flex; align-items: center; gap: 16px; }
.header-icon { cursor: pointer; }
.collapse-btn { cursor: pointer; }
.user-trigger { cursor: pointer; display: flex; align-items: center; }
.username { margin-right: 4px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.main-content {
  background-color: var(--el-bg-color-page);
  overflow-y: auto;
}
</style>

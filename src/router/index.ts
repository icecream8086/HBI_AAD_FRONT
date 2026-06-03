import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import store from '../store'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false, title: '登录' },
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '仪表盘' } },

      // Sandbox
      { path: 'sandboxes', name: 'Sandboxes', component: () => import('../views/sandbox/SandboxList.vue'), meta: { title: '容器实例列表' } },
      { path: 'sandboxes/:id', name: 'SandboxDetail', component: () => import('../views/sandbox/SandboxDetail.vue'), meta: { title: '容器实例详情' } },

      // Templates
      { path: 'templates', name: 'Templates', component: () => import('../views/template/TemplateList.vue'), meta: { title: '模板列表' } },
      { path: 'templates/:id', name: 'TemplateDetail', component: () => import('../views/template/TemplateDetail.vue'), meta: { title: '模板详情' } },

      // Images
      { path: 'images', name: 'Images', component: () => import('../views/ImageList.vue'), meta: { title: '镜像管理' } },

      // Users
      { path: 'users', name: 'Users', component: () => import('../views/user/UserList.vue'), meta: { title: '用户管理' } },
      { path: 'users/:id', name: 'UserDetail', component: () => import('../views/user/UserDetail.vue'), meta: { title: '用户详情' } },

      // Permissions
      { path: 'permissions', name: 'Permissions', component: () => import('../views/permission/PermissionList.vue'), meta: { title: '权限管理' } },
      { path: 'permissions/policies', name: 'Policies', component: () => import('../views/permission/PolicyList.vue'), meta: { title: '策略管理' } },
      { path: 'permissions/groups', name: 'PermissionGroups', component: () => import('../views/permission/PermGroupList.vue'), meta: { title: '权限组管理' } },
      { path: 'permissions/user-groups', name: 'UserGroups', component: () => import('../views/permission/UserGroupList.vue'), meta: { title: '用户组管理' } },
      { path: 'permissions/route-acls', name: 'RouteAcls', component: () => import('../views/permission/RouteAclList.vue'), meta: { title: '路由 ACL' } },
      { path: 'permissions/system-groups', name: 'SystemGroups', component: () => import('../views/permission/SystemGroupList.vue'), meta: { title: '系统组' } },

      // Logs & Monitoring
      { path: 'audit', name: 'AuditLogs', component: () => import('../views/AuditLogs.vue'), meta: { title: '审计日志' } },
      { path: 'platforms', name: 'Platforms', component: () => import('../views/PlatformList.vue'), meta: { title: '平台列表' } },
      { path: 'events', name: 'Events', component: () => import('../views/EventLoop.vue'), meta: { title: '事件循环' } },

      // Profile
      { path: 'profile', name: 'Profile', component: () => import('../views/Profile.vue'), meta: { title: '个人设置' } },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const isLoggedIn = store.state.auth.isLoggedIn
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router

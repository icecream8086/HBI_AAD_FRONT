import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import store from '../store'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false, title: 'route.login' },
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: 'route.dashboard' } },

      // Sandbox
      { path: 'sandboxes/pods', name: 'SandboxPods', component: () => import('../views/sandbox/PodList.vue'), meta: { title: 'route.sandboxPods' } },
      { path: 'sandboxes/pods/:providerId', name: 'PodDetail', component: () => import('../views/sandbox/PodDetail.vue'), meta: { title: 'pod.detail' } },
      { path: 'sandboxes', name: 'Sandboxes', component: () => import('../views/sandbox/SandboxList.vue'), meta: { title: 'route.sandboxes' } },
      { path: 'sandboxes/:id', name: 'SandboxDetail', component: () => import('../views/sandbox/SandboxDetail.vue'), meta: { title: 'route.sandboxDetail' } },

      // Templates
      { path: 'templates', name: 'Templates', component: () => import('../views/template/TemplateList.vue'), meta: { title: 'route.templates' } },
      { path: 'templates/:id', name: 'TemplateDetail', component: () => import('../views/template/TemplateDetail.vue'), meta: { title: 'route.templateDetail' } },

      // Images
      { path: 'images', name: 'Images', component: () => import('../views/ImageList.vue'), meta: { title: 'route.images' } },

      // Users
      { path: 'users', name: 'Users', component: () => import('../views/user/UserList.vue'), meta: { title: 'route.users' } },
      { path: 'users/:id', name: 'UserDetail', component: () => import('../views/user/UserDetail.vue'), meta: { title: 'route.userDetail' } },

      // Permissions
      { path: 'permissions', name: 'Permissions', component: () => import('../views/permission/PermissionList.vue'), meta: { title: 'route.permissions' } },
      { path: 'permissions/policies', name: 'Policies', component: () => import('../views/permission/PolicyList.vue'), meta: { title: 'route.policies' } },
      { path: 'permissions/groups', name: 'PermissionGroups', component: () => import('../views/permission/PermGroupList.vue'), meta: { title: 'route.permissionGroups' } },
      { path: 'permissions/user-groups', name: 'UserGroups', component: () => import('../views/permission/UserGroupList.vue'), meta: { title: 'route.userGroups' } },
      { path: 'permissions/route-acls', name: 'RouteAcls', component: () => import('../views/permission/RouteAclList.vue'), meta: { title: 'route.routeAcls' } },
      { path: 'permissions/system-groups', name: 'SystemGroups', component: () => import('../views/permission/SystemGroupList.vue'), meta: { title: 'route.systemGroups' } },

      // Topology
      { path: 'topology/instances', name: 'InstanceList', component: () => import('../views/topology/InstanceList.vue'), meta: { title: 'route.instanceList' } },
      { path: 'topology/credentials', name: 'CredentialList', component: () => import('../views/topology/CredentialList.vue'), meta: { title: 'route.credentialList' } },
      { path: 'topology/buckets', name: 'BucketList', component: () => import('../views/topology/BucketList.vue'), meta: { title: 'route.bucketList' } },
      { path: 'topology/volumes', name: 'VolumeList', component: () => import('../views/topology/VolumeList.vue'), meta: { title: 'route.volumeList' } },

      // Security Groups
      { path: 'networks', name: 'SecurityGroups', component: () => import('../views/network/SecurityGroupList.vue'), meta: { title: 'route.securityGroupList' } },
      // Subnets
      { path: 'subnets', name: 'Subnets', component: () => import('../views/network/SubnetList.vue'), meta: { title: 'route.subnetList' } },

      // Logs & Monitoring
      { path: 'audit', name: 'AuditLogs', component: () => import('../views/AuditLogs.vue'), meta: { title: 'route.audit' } },
      { path: 'events', name: 'Events', component: () => import('../views/EventLoop.vue'), meta: { title: 'route.events' } },

      // Profile
      { path: 'profile', name: 'Profile', component: () => import('../views/Profile.vue'), meta: { title: 'route.profile' } },
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

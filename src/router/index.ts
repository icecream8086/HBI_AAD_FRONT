import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import store from '../store'
import { ROUTE_MIN_ROLE, hasMinRole } from '../types/permissions'

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
      { path: 'permissions/user-templates', name: 'UserTemplates', component: () => import('../views/permission/UserTemplateList.vue'), meta: { title: 'route.userTemplates' } },
      { path: 'permissions/container-secrets', name: 'ContainerSecrets', component: () => import('../views/permission/ContainerSecretList.vue'), meta: { title: 'route.containerSecrets' } },
      { path: 'permissions/elevations', name: 'Elevations', component: () => import('../views/permission/ElevationList.vue'), meta: { title: 'route.elevations' } },
      { path: 'permissions/invitations', name: 'Invitations', component: () => import('../views/permission/InvitationList.vue'), meta: { title: 'route.invitations' } },
      { path: 'permissions/tools', name: 'PermTools', component: () => import('../views/permission/PermissionTools.vue'), meta: { title: 'route.permTools' } },

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
      { path: 'extension-fields', name: 'ExtensionFields', component: () => import('../components/ExtensionFieldEditor.vue'), meta: { title: 'route.extensionFields' } },
      { path: 'audit', name: 'AuditLogs', component: () => import('../views/AuditLogs.vue'), meta: { title: 'route.audit' } },
      { path: 'events', name: 'Events', component: () => import('../views/EventLoop.vue'), meta: { title: 'route.events' } },

      // Actions
      { path: 'actions/dashboard', name: 'ActionDashboard', component: () => import('../views/action/ActionDashboard.vue'), meta: { title: 'route.actionDashboard' } },
      { path: 'actions/organizations', name: 'ActionOrgs', component: () => import('../views/action/OrganizationList.vue'), meta: { title: 'route.actionOrganizations' } },
      { path: 'actions/registry', name: 'ActionRegistry', component: () => import('../views/action/ActionRegistry.vue'), meta: { title: 'route.actionRegistry' } },
      { path: 'actions/runners', name: 'Runners', component: () => import('../views/action/RunnerList.vue'), meta: { title: 'route.runners' } },
      { path: 'actions/runs', name: 'WorkflowRuns', component: () => import('../views/action/RunList.vue'), meta: { title: 'route.workflowRuns' } },
      { path: 'actions/runs/:id', name: 'RunDetail', component: () => import('../views/action/RunDetail.vue'), meta: { title: 'route.runDetail' } },
      { path: 'actions/runs/:runId/jobs/:jobId', name: 'JobDetail', component: () => import('../views/action/JobDetail.vue'), meta: { title: 'route.jobDetail' } },
      { path: 'actions/secrets/:workflowId', name: 'WorkflowSecrets', component: () => import('../views/action/SecretList.vue'), meta: { title: 'route.workflowSecrets' } },
      { path: 'actions/shared-links', name: 'SharedLinks', component: () => import('../views/action/SharedLinkList.vue'), meta: { title: 'route.sharedLinks' } },
      { path: 'actions/templates', name: 'ActionTemplates', component: () => import('../views/action/ActionTemplateList.vue'), meta: { title: 'route.actionTemplates' } },
      { path: 'actions/workflows', name: 'Workflows', component: () => import('../views/action/WorkflowList.vue'), meta: { title: 'route.workflows' } },
      { path: 'actions/workflows/:id', name: 'WorkflowDetail', component: () => import('../views/action/WorkflowDetail.vue'), meta: { title: 'route.workflowDetail' } },
      { path: 'actions/workflows/:id/editor', name: 'WorkflowEditor', component: () => import('../views/action/WorkflowEditor.vue'), meta: { title: 'route.workflowEditor' } },

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
    return
  }
  if (to.path === '/login' && isLoggedIn) {
    next('/dashboard')
    return
  }
  // Role-based guard
  if (to.name && typeof to.name === 'string') {
    const minRole = ROUTE_MIN_ROLE[to.name]
    if (minRole) {
      const userRole = store.state.auth.currentUser?.role
      if (!hasMinRole(userRole, minRole)) {
        next('/dashboard')
        return
      }
    }
  }
  next()
})

export default router

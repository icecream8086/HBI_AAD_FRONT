<template>
  <div>
    <h2>权限管理</h2>
    <el-row :gutter="16">
      <el-col v-for="item in items" :key="item.path" :span="6">
        <el-card shadow="hover" class="nav-card" @click="$router.push(item.path)">
          <div class="nav-card-content">
            <div class="nav-card-title">{{ item.title }}</div>
            <div class="nav-card-desc">{{ item.desc }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
const items = [
  { title: '策略', desc: '管理个体制权策略', path: '/permissions/policies' },
  { title: '权限组', desc: '管理权限组及 DAG 继承', path: '/permissions/groups' },
  { title: '用户组', desc: '管理用户组及成员', path: '/permissions/user-groups' },
  { title: '路由 ACL', desc: '管理路由级别访问控制', path: '/permissions/route-acls' },
  { title: '系统组', desc: '全局系统权限组', path: '/permissions/system-groups' },
]
</script>

<style scoped>
.nav-card { cursor: pointer; margin-bottom: 16px; }
.nav-card-content { text-align: center; padding: 16px; }
.nav-card-title { font-size: 18px; font-weight: bold; }
.nav-card-desc { font-size: 12px; color: var(--color-text-secondary); margin-top: 8px; }
</style>

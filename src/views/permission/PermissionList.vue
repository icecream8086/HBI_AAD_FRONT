<template>
  <div>
    <h2>{{ $t('permission.title') }}</h2>
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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const items = computed(() => [
  { title: t('permission.policies'), desc: t('permission.policiesDesc'), path: '/permissions/policies' },
  { title: t('permission.permGroups'), desc: t('permission.permGroupsDesc'), path: '/permissions/groups' },
  { title: t('permission.userGroups'), desc: t('permission.userGroupsDesc'), path: '/permissions/user-groups' },
  { title: t('permission.routeAcls'), desc: t('permission.routeAclsDesc'), path: '/permissions/route-acls' },
  { title: t('permission.systemGroups'), desc: t('permission.systemGroupsDesc'), path: '/permissions/system-groups' },
])
</script>

<style scoped>
.nav-card { cursor: pointer; margin-bottom: 16px; }
.nav-card-content { text-align: center; padding: 16px; }
.nav-card-title { font-size: 18px; font-weight: bold; }
.nav-card-desc { font-size: 12px; color: var(--color-text-secondary); margin-top: 8px; }
</style>

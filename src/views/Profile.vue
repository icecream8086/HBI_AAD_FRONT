<template>
  <div>
    <h2>个人设置</h2>
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card v-if="user">
          <template #header>用户信息</template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="ID"><code>{{ user.id }}</code></el-descriptions-item>
            <el-descriptions-item label="名称">{{ user.name }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ user.email }}</el-descriptions-item>
            <el-descriptions-item label="角色">
              <el-tag :type="roleTag" size="small">{{ user.role }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ fmt(user.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="Ed25519 密钥">
              <el-tag :type="user.privateKeyEd25519 ? 'success' : 'info'" size="small">
                {{ user.privateKeyEd25519 ? '已设置' : '未设置' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
        <el-empty v-else description="未登录" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore<State>()
const user = computed(() => store.state.auth.currentUser)
const roleTag = computed(() => {
  const m: Record<string, string> = { root: 'danger', Operator: 'warning', Viewer: 'info' }
  return m[user.value?.role || ''] || 'info'
})
function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }
</script>

<style scoped>
code { font-size: 12px; background: var(--el-bg-color-page); padding: 2px 6px; border-radius: 3px; }
</style>

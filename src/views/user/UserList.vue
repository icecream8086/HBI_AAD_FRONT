<template>
  <div>
    <div class="page-head">
      <h2>用户管理</h2>
    </div>
    <el-table :data="users || []" v-loading="loading" stripe empty-text="暂无用户">
      <el-table-column prop="name" label="名称" min-width="120" />
      <el-table-column prop="email" label="邮箱" min-width="200" />
      <el-table-column prop="role" label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="roleType(row.role)" size="small">{{ row.role }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="更新时间" width="170">
        <template #default="{ row }">{{ fmt(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="Ed25519" width="80">
        <template #default="{ row }">
          <el-tag :type="row.privateKeyEd25519 ? 'success' : 'info'" size="small">{{ row.privateKeyEd25519 ? '有' : '无' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/users/${row.id}`)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../../api'

const loading = ref(false)
const ready = ref(false)
const users = ref<User[]>([])

function roleType(r: string) { const m: Record<string, string> = { root: 'danger', Operator: 'warning', Viewer: 'info' }; return m[r] || 'info' }
function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

onMounted(async () => {
  loading.value = true
  try { users.value = await api.extractArray<User>(api.users.apiUsersGet()) } catch { /* ignore */ }
  finally { loading.value = false }
})
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>

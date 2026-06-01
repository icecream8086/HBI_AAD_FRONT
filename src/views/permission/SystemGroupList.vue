<template>
  <div>
    <el-button text @click="$router.push('/permissions')" class="back">← 权限管理</el-button>
    <h2>系统组</h2>
    <el-table :data="groups" v-loading="loading" stripe empty-text="暂无系统组">
      <el-table-column prop="name" label="名称" min-width="180" />
      <el-table-column label="规则" min-width="300">
        <template #default="{ row }">
          <el-tag v-for="r in row.rules" :key="r.action" size="small" style="margin-right:4px">
            {{ r.effect === 'allow' ? '✓' : '✗' }} {{ r.actions?.join(',') }} @{{ r.resource || '*' }} ({{ r.priority }})
          </el-tag>
          <span v-if="!row.rules?.length">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="80" />
      <el-table-column prop="dependsOn" label="依赖" width="200" show-overflow-tooltip>
        <template #default="{ row }">{{ row.dependsOn?.join(', ') || '-' }}</template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../../api'

const loading = ref(false)
const groups = ref<SystemGroup[]>([])

onMounted(async () => {
  loading.value = true
  try { groups.value = await api.extract<SystemGroup[]>(api.systemGroups.apiSystemGroupsGet()) }
  catch { ElMessage.error('获取系统组失败') }
  finally { loading.value = false }
})
</script>

<style scoped>
.back { margin-bottom: 8px; }
</style>

<template>
  <div>
    <div class="page-head">
      <h2>{{ $t('action.runnerTitle') }}</h2>
      <el-button @click="fetchData">{{ $t('table.refresh') }}</el-button>
    </div>

    <el-table :data="items" v-loading="loading" stripe :empty-text="$t('table.empty')">
      <el-table-column prop="name" :label="$t('action.runnerName')" min-width="140" />
      <el-table-column :label="$t('action.runnerStatus')" width="100">
        <template #default="{ row }">
          <el-tag :type="runnerStatusType(row.status)" size="small">{{ $t(`action.status${row.status.charAt(0).toUpperCase()}${row.status.slice(1)}`) || row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('action.runnerLabels')" min-width="150">
        <template #default="{ row }">
          <template v-if="row.labels && Object.keys(row.labels).length">
            <el-tag v-for="(v, k) in row.labels" :key="k" size="small" type="info" style="margin-right:4px">{{ k }}:{{ v }}</el-tag>
          </template>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('action.runnerIP')" width="130">
        <template #default="{ row }">{{ row.ip || '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('action.runnerVersion')" width="100">
        <template #default="{ row }">{{ row.version || '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('action.runnerLastHeartbeat')" width="170">
        <template #default="{ row }">{{ fmt(row.lastHeartbeatAt) }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.actions')" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handleDrain(row.id)">Drain</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">{{ $t('table.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'

const { t } = useI18n()

const loading = ref(false)
const items = ref<RunnerRegistration[]>([])

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

function runnerStatusType(s: string) {
  const m: Record<string, string> = { online: 'success', offline: 'info', busy: 'warning' }
  return m[s] || 'info'
}

async function fetchData() {
  loading.value = true
  try {
    items.value = await api.actions.runners.list()
    items.value = items.value ?? []
  } catch { ElMessage.error(t('action.fetchRunnersFailed')) }
  finally { loading.value = false }
}

async function handleDrain(id: string) {
  try {
    await api.actions.runners.drain(id)
    ElMessage.success('Runner drained')
    await fetchData()
  } catch { ElMessage.error(t('common.actionFailed')) }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('action.deleteRunnerConfirm'), t('table.confirm'), { type: 'warning' })
    // No delete endpoint in spec — just drain
  } catch { /* ignore */ }
}

onMounted(fetchData)
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>

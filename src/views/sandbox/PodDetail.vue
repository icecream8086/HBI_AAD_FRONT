<template>
  <div v-loading="loading">
    <el-button text @click="$router.push('/sandboxes/pods')" class="back">{{ $t('pod.backToList') }}</el-button>

    <div v-if="pod">
      <div class="page-head">
        <h2>{{ $t('pod.detail') }}: {{ pod.providerId }}</h2>
        <div class="actions">
          <el-button type="warning" @click="handleStop" :loading="stopping">{{ $t('pod.stop') }}</el-button>
          <el-button type="danger" @click="handleDelete">{{ $t('table.delete') }}</el-button>
        </div>
      </div>

      <el-descriptions :column="3" border>
        <el-descriptions-item label="Provider ID" :span="3"><code>{{ pod.providerId }}</code></el-descriptions-item>
        <el-descriptions-item :label="$t('pod.platform')">{{ pod.platform || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('pod.region')">{{ pod.region || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('table.status')">
          <el-tag :type="statusType(pod.status)" size="small" effect="dark">{{ pod.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('table.createdAt')">{{ fmt(pod.createdAt) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('table.updatedAt')">{{ fmt(pod.updatedAt) }}</el-descriptions-item>
      </el-descriptions>

      <!-- Network -->
      <el-card class="section" v-if="pod.network">
        <template #header>{{ $t('table.network') }}</template>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="External IP">{{ pod.network.externalIp || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Internal IP">{{ pod.network.internalIp || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Containers -->
      <el-card class="section">
        <template #header>{{ $t('pod.containers') }} ({{ pod.containers?.length || 0 }})</template>
        <div v-for="(c, i) in pod.containers" :key="i" class="cont-card">
          <el-descriptions :column="4" border size="small">
            <el-descriptions-item :label="$t('template.name')" :span="2">{{ c.name }}</el-descriptions-item>
            <el-descriptions-item :label="$t('table.image')" :span="2"><code>{{ c.image }}</code></el-descriptions-item>
            <el-descriptions-item :label="$t('pod.state')">
              <el-tag :type="c.state === 'running' ? 'success' : 'info'" size="small">{{ c.state }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('pod.ready')">
              <el-tag :type="c.ready ? 'success' : 'danger'" size="small">{{ c.ready ? 'Yes' : 'No' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('pod.restartCount')">{{ c.restartCount ?? 0 }}</el-descriptions-item>
            <el-descriptions-item :label="$t('pod.startedAt')">{{ c.startedAt || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <el-empty v-if="!pod.containers?.length" :description="$t('pod.noContainers')" :image-size="50" />
      </el-card>

      <!-- Conditions -->
      <el-card class="section" v-if="pod.conditions?.length">
        <template #header>{{ $t('pod.conditions') }}</template>
        <el-table :data="pod.conditions" stripe size="small">
          <el-table-column prop="type" label="Type" width="160" />
          <el-table-column prop="status" label="Status" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'True' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="Reason" width="160" />
          <el-table-column prop="message" label="Message" show-overflow-tooltip />
          <el-table-column :label="$t('pod.startedAt')" width="170">
            <template #default="{ row }">{{ row.lastTransitionTime || '-' }}</template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- Events -->
      <el-card class="section" v-if="pod.events?.length">
        <template #header>{{ $t('pod.events') }}</template>
        <el-table :data="pod.events" stripe size="small">
          <el-table-column prop="type" label="Type" width="100" />
          <el-table-column prop="reason" label="Reason" width="160" />
          <el-table-column prop="message" label="Message" show-overflow-tooltip />
          <el-table-column :label="$t('table.count')" width="80" prop="count" />
          <el-table-column :label="$t('pod.startedAt')" width="170">
            <template #default="{ row }">{{ row.lastTimestamp || '-' }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!pod.events?.length" :description="$t('pod.noEvents')" :image-size="50" />
      </el-card>
    </div>
    <el-empty v-else-if="!loading" :description="$t('pod.notFound')" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { api } from '../../api'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const stopping = ref(false)
const pod = ref<PodInstance | null>(null)

function statusType(status: string): string {
  const m: Record<string, string> = { Running: 'success', Stopped: 'info', Pending: 'warning', Failed: 'danger', Terminated: 'info', Deleted: 'info' }
  return m[status] || 'info'
}

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

async function load() {
  loading.value = true
  try {
    pod.value = await api.pods.get(route.params.providerId as string)
  } catch {
    ElMessage.error(t('pod.loadFailed'))
  } finally {
    loading.value = false
  }
}

async function handleStop() {
  try {
    await ElMessageBox.confirm(t('pod.stopConfirm'), t('table.confirm'), { type: 'warning' })
    stopping.value = true
    await api.pods.stop(route.params.providerId as string)
    ElMessage.success(t('pod.stopSuccess'))
    for (let i = 0; i < 12; i++) {
      await load()
      if (pod.value?.status !== 'Running') return
      await new Promise(r => setTimeout(r, 1000))
    }
  } catch { /* ignore */ } finally { stopping.value = false }
}

async function handleDelete() {
  try {
    await ElMessageBox.confirm(t('pod.deleteConfirm'), t('table.confirm'), { type: 'warning' })
    await api.pods.delete(route.params.providerId as string)
    ElMessage.success(t('pod.deleteSuccess'))
    router.push('/sandboxes/pods')
  } catch {
    /* ignore */
  }
}

onMounted(load)
</script>

<style scoped>
.back { margin-bottom: 8px; padding: 0; }
.page-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.actions { display: flex; gap: 8px; flex-shrink: 0; }
.section { margin-top: 16px; }
.cont-card { border: 1px solid var(--el-border-color); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
code { font-size: 12px; background: var(--el-bg-color-page); padding: 2px 6px; border-radius: 3px; }
</style>

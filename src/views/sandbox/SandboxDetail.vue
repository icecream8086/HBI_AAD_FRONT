<template>
  <div v-loading="loading">
    <el-button text @click="$router.push('/sandboxes')" class="back">{{ $t('sandbox.backToList') }}</el-button>

    <div v-if="sandbox">
      <div class="page-head">
        <div>
          <h2>{{ sandbox.config?.name || sandbox.name || $t('sandbox.title') }}</h2>
          <el-tag :type="statusType(sandbox.status)" effect="dark" size="large">{{ sandbox.status }}</el-tag>
        </div>
        <div class="actions">
          <el-button v-if="sandbox.status==='Stopped'" type="success" @click="handleStart" :loading="starting">{{ $t('table.start') }}</el-button>
          <el-button :type="sandbox.status==='Running'?'warning':''" @click="handleStop" :disabled="sandbox.status!=='Running'">{{ $t('table.stop') }}</el-button>
          <el-button type="danger" @click="handleDelete">{{ $t('table.delete') }}</el-button>
          <el-button @click="handleSync">{{ $t('sandbox.sync') }}</el-button>
          <el-button @click="fetchHealth">{{ $t('sandbox.healthCheck') }}</el-button>
        </div>
      </div>

      <el-descriptions :column="3" border size="small">
        <el-descriptions-item label="ID" :span="3"><code>{{ sandbox.id }}</code></el-descriptions-item>
        <el-descriptions-item label="Provider">{{ sandbox.providerId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Region">{{ sandbox.config?.region || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('table.network')">{{ fmtNetwork(sandbox.network) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('table.createdAt')">{{ fmt(sandbox.createdAt) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('table.updatedAt')">{{ fmt(sandbox.updatedAt) }}</el-descriptions-item>
      </el-descriptions>

      <!-- Labels -->
      <el-card class="section" v-if="sandbox.config?.labels">
        <template #header>{{ $t('table.tags') }}</template>
        <el-tag v-for="(v, k) in sandbox.config.labels" :key="k" size="small" style="margin-right:6px">{{ k }}={{ v }}</el-tag>
      </el-card>

      <!-- Runtime Containers -->
      <el-card class="section">
        <template #header>{{ $t('sandbox.containerLabel') }} ({{ sandbox.containers?.length || 0 }})</template>
        <div v-for="(c, ci) in sandbox.containers || []" :key="ci" class="cont-box">
          <h4>{{ c.name || `${$t('sandbox.containerLabel')} ${ci+1}` }}</h4>
          <el-descriptions :column="4" border size="small">
            <el-descriptions-item :label="$t('table.image')" :span="2"><code>{{ c.image || '-' }}</code></el-descriptions-item>
            <el-descriptions-item :label="$t('table.status')">
              <el-tag :type="ctStatusType(c)" size="small">{{ ctStatus(c) }}</el-tag>
              <el-tag v-if="c.state?.ready" type="success" size="small" effect="plain" style="margin-left:4px">{{ $t('sandbox.ready') }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('sandbox.cpuMem')">{{ c.cpu ?? '-' }}{{ $t('sandbox.cores') }} / {{ c.memory ?? '-' }}Mi<span v-if="c.gpu" style="margin-left:6px">GPU: {{ c.gpu }}{{ c.gpuType ? '×'+c.gpuType : '' }}</span></el-descriptions-item>
          </el-descriptions>
          <div v-if="c.state?.startTime" class="sub">{{ $t('sandbox.startTime') }}: {{ fmtStr(c.state.startTime) }}</div>
          <div v-if="c.health?.status" class="sub">
            <strong>Health:</strong>
            <el-tag :type="c.health.status==='healthy'?'success':'warning'" size="small">{{ c.health.status }}</el-tag>
            <span v-if="c.health.message" class="muted"> {{ c.health.message }}</span>
          </div>
        </div>
        <el-empty v-if="!sandbox.containers?.length" :description="$t('sandbox.noContainers')" :image-size="50" />
      </el-card>

      <!-- Config Containers (desired spec) -->
      <el-card class="section" v-if="sandbox.config?.containers?.length">
        <template #header>{{ $t('sandbox.configContainers') }} ({{ sandbox.config.containers.length }})</template>
        <div v-for="(c, ci) in sandbox.config.containers" :key="ci" class="cont-box">
          <h4>{{ c.name || `${$t('sandbox.containerLabel')} ${ci+1}` }}</h4>
          <el-descriptions :column="4" border size="small">
            <el-descriptions-item :label="$t('table.image')" :span="2"><code>{{ c.image }}</code></el-descriptions-item>
            <el-descriptions-item :label="$t('table.command')" :span="2">{{ c.command?.join(' ') || '-' }}</el-descriptions-item>
          </el-descriptions>
          <div v-if="c.ports?.length" class="sub">
            <strong>{{ $t('table.port') }}:</strong>
            <el-tag v-for="(p, pi) in c.ports" :key="pi" size="small" style="margin-right:4px">{{ p.containerPort || p.container }}{{ p.protocol ? '/'+p.protocol : '' }}{{ p.hostPort ? '→'+p.hostPort : '' }}</el-tag>
          </div>
          <div v-if="c.resources?.limits" class="sub">
            <strong>{{ $t('table.resources') }}:</strong>
            <span v-if="c.resources.limits.cpu">{{ c.resources.limits.cpu }}{{ $t('sandbox.cores') }} </span>
            <span v-if="c.resources.limits.memory">{{ c.resources.limits.memory }}Mi</span>
            <span v-else>-</span>
          </div>
          <div v-if="c.env?.length" class="sub">
            <strong>{{ $t('table.env') }}:</strong>
            <el-tag v-for="(e, ei) in c.env" :key="ei" size="small" style="margin-right:4px">{{ e.name }}={{ e.value || e.valueFrom || '' }}</el-tag>
          </div>
          <div v-else-if="c.env && typeof c.env === 'object' && !Array.isArray(c.env)" class="sub">
            <strong>{{ $t('table.env') }}:</strong>
            <el-tag v-for="(v,k) in c.env" :key="k" size="small" style="margin-right:4px">{{ k }}={{ v }}</el-tag>
          </div>
          <div v-if="c.volumeMounts?.length" class="sub">
            <strong>{{ $t('table.volume') }}:</strong>
            <el-tag v-for="(vl, vi) in c.volumeMounts" :key="vi" size="small" style="margin-right:4px">{{ vl.volumeId || vl.mountPath }}{{ vl.mountPath ? '→'+vl.mountPath : '' }}</el-tag>
          </div>
          <div v-if="c.livenessProbe" class="sub">
            <strong>{{ $t('sandbox.livenessProbe') }}:</strong> <code>{{ fmtCmd(c.livenessProbe.exec?.command) }}</code>
            <span class="muted"> {{ $t('table.delay') }}{{ c.livenessProbe.initialDelaySeconds }}s/{{ $t('table.interval') }}{{ c.livenessProbe.periodSeconds }}s</span>
          </div>
          <div v-if="c.readinessProbe" class="sub">
            <strong>{{ $t('sandbox.readinessProbe') }}:</strong> <code>{{ fmtCmd(c.readinessProbe.exec?.command) }}</code>
            <span class="muted"> {{ $t('table.interval') }}{{ c.readinessProbe.periodSeconds }}s/{{ $t('table.delay') }}{{ c.readinessProbe.initialDelaySeconds }}s</span>
          </div>
        </div>
      </el-card>

      <!-- Events -->
      <el-card class="section">
        <template #header>{{ $t('sandbox.events') }} ({{ sandbox.events?.length || 0 }})</template>
        <el-table :data="sandbox.events || []" :empty-text="$t('sandbox.noEvents')" size="small">
          <el-table-column :label="$t('sandbox.time')" width="180"><template #default="{ row }">{{ fmtEventTime(row) }}</template></el-table-column>
          <el-table-column :label="$t('sandbox.type')" width="80"><template #default="{ row }"><el-tag :type="row.type==='Warning'?'warning':'info'" size="small">{{ row.type }}</el-tag></template></el-table-column>
          <el-table-column prop="reason" :label="$t('sandbox.reason')" width="140" />
          <el-table-column prop="message" :label="$t('sandbox.message')" />
          <el-table-column :label="$t('sandbox.count')" width="70"><template #default="{ row }">{{ row.count ?? 1 }}</template></el-table-column>
        </el-table>
      </el-card>
    </div>

    <el-empty v-else-if="!loading" :description="$t('sandbox.notFound')" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api, axios } from '../../api'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const loading = ref(false)
const starting = ref(false)
const sandbox = ref<Sandbox | null>(null)

function ctStatus(c: any): string {
  // state?.state is the real container state; fall back to '-' when absent (e.g. stopped)
  return c.state?.state || c.status || '-'
}
function ctStatusType(c: any): string {
  const s = ctStatus(c).toLowerCase()
  return s.includes('running') ? 'success' : s.includes('wait') || s.includes('pending') ? 'warning' : 'info'
}
function statusType(s: string) {
  const m: Record<string, string> = { Running: 'success', Pending: 'warning', Failed: 'danger', Stopped: 'info', Terminated: 'info', Deleted: 'info' }
  return m[s] || 'info'
}
function fmt(ts: number | undefined) { return ts ? new Date(ts).toLocaleString() : '-' }
function fmtStr(s: string | undefined) { return s ? new Date(s).toLocaleString() : '-' }
function fmtEventTime(e: any): string {
  if (e.lastTimestamp) return fmtStr(e.lastTimestamp)
  if (e.timestamp) return typeof e.timestamp === 'number' ? fmt(e.timestamp) : fmtStr(e.timestamp)
  return '-'
}
function fmtCmd(cmd: string[] | undefined): string {
  return cmd?.join(' ') || '-'
}
function fmtNetwork(net: any): string {
  if (!net) return '-'
  const o = typeof net === 'string' ? (() => { try { return JSON.parse(net) } catch { return null } })() : net
  return o?.privateIp || o?.ip || o?.publicIp || JSON.stringify(o)
}

async function load() {
  loading.value = true
  try { sandbox.value = await api.extract<Sandbox>(api.sandboxes.apiSandboxesIdGet(route.params.id as string)) }
  catch { ElMessage.error(t('sandbox.loadFailed')) }
  finally { loading.value = false }
}

onMounted(load)

async function handleStart() {
  starting.value = true
  try {
    await axios.post(`/api/sandboxes/${route.params.id}/start`)
    ElMessage.success(t('sandbox.startSuccess'))
    for (let i = 0; i < 12; i++) {
      await load()
      if (sandbox.value?.status !== 'Stopped') return
      await new Promise(r => setTimeout(r, 1000))
    }
  } catch { ElMessage.error(t('sandbox.actionFailed')) }
  finally { starting.value = false }
}

async function handleStop() {
  try {
    await api.sandboxes.apiSandboxesIdStopPost(route.params.id as string)
    ElMessage.success(t('sandbox.stopSuccess'))
    for (let i = 0; i < 12; i++) {
      await load()
      if (sandbox.value?.status !== 'Running') return
      await new Promise(r => setTimeout(r, 1000))
    }
  } catch { ElMessage.error(t('sandbox.actionFailed')) }
}
async function handleDelete() {
  try {
    await ElMessageBox.confirm(t('sandbox.deleteConfirm'), t('table.confirm'))
    await api.sandboxes.apiSandboxesIdDelete(route.params.id as string)
    ElMessage.success(t('sandbox.deleteSuccess')); router.push('/sandboxes')
  } catch { /* ignore */ }
}
async function handleSync() {
  try {
    await api.sandboxes.apiSandboxesIdSyncPost(route.params.id as string)
    ElMessage.success(t('sandbox.syncSuccess'))
    for (let i = 0; i < 12; i++) {
      await load()
      if (sandbox.value?.status !== 'Running') return
      await new Promise(r => setTimeout(r, 1000))
    }
  } catch { ElMessage.error(t('sandbox.syncFailed')) }
}
async function fetchHealth() {
  try {
    const h = await api.extract<ContainerHealth[]>(api.sandboxes.apiSandboxesIdHealthGet(route.params.id as string))
    if (!h?.length) { ElMessage.info('No container health data'); return }
    h.forEach(c => ElMessage.info(`${t('sandbox.containerLabel')} ${c.containerName}: ${c.status}${c.ready ? ' ✓' : ''}`))
  } catch { ElMessage.error('Health check failed') }
}
</script>

<style scoped>
.back { margin-bottom: 8px; padding: 0; }
.page-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-head h2 { margin: 0 0 4px 0; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.section { margin-top: 16px; }
.cont-box { border: 1px solid var(--el-border-color); border-radius: 6px; padding: 12px; margin-bottom: 10px; }
.cont-box h4 { margin: 0 0 8px 0; }
.sub { margin-top: 6px; font-size: 13px; }
code { font-size: 12px; background: var(--el-bg-color-page); padding: 2px 6px; border-radius: 3px; }
</style>

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

      <!-- Logs -->
      <el-card class="section">
        <template #header>
          <span>{{ $t('sandbox.logs') }}</span>
          <span v-if="ws" class="log-count">{{ logLines.length }} lines</span>
          <el-tag v-if="wsStatus === 'connected'" type="success" size="small" effect="plain" style="margin-left:6px">{{ $t('sandbox.logConnected') }}</el-tag>
          <el-tag v-else-if="wsStatus === 'closed' || wsStatus === 'error'" type="info" size="small" effect="plain" style="margin-left:6px">
            {{ wsStatus === 'error' ? $t('sandbox.logError') : $t('sandbox.logDisconnected') }}
            <el-button size="small" text type="primary" @click="openLogs" style="margin-left:4px;font-size:12px">{{ $t('sandbox.logReconnect') }}</el-button>
          </el-tag>
          <div class="log-actions">
            <span v-if="ws" class="log-toolbar">
              <el-checkbox v-model="logFollow" size="small" style="margin-right:8px">{{ $t('sandbox.logFollow') }}</el-checkbox>
              <el-select v-model="logTail" size="small" style="width:80px;margin-right:8px" @change="openLogs" :disabled="!ws">
                <el-option :value="200" label="200" />
                <el-option :value="500" label="500" />
                <el-option :value="1000" label="1000" />
              </el-select>
              <el-button size="small" text @click="logLines=[]">{{ $t('sandbox.logClear') }}</el-button>
            </span>
            <el-button size="small" style="margin-left:4px" @click="toggleLogs">{{ ws ? $t('sandbox.logClose') : $t('sandbox.logOpen') }}</el-button>
          </div>
        </template>
        <div v-if="ws" class="log-viewer" ref="logRef" @scroll="onLogScroll">
          <div v-for="(line, i) in logLines" :key="i" class="log-line" :class="line.cls">{{ line.text }}</div>
          <div v-if="!logLines.length" class="log-placeholder">{{ $t('sandbox.logWaiting') }}</div>
        </div>
        <div v-else class="log-viewer log-placeholder" style="min-height:80px">
          {{ $t('sandbox.logHint') }}
        </div>
      </el-card>
    </div>

    <el-empty v-else-if="!loading" :description="$t('sandbox.notFound')" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
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

// Log viewer
const ws = ref<WebSocket | null>(null)
const wsStatus = ref<'idle' | 'connected' | 'closed' | 'error'>('idle')
const logLines = ref<{ text: string; cls: string }[]>([])
const logRef = ref<HTMLElement | null>(null)
const logFollow = ref(true)
const logTail = ref(200)
const logSince = ref<number>(0)
const API_BASE = 'http://localhost:3000'

function getToken(): string { return localStorage.getItem('access_token') || '' }

function toggleLogs() {
  if (ws.value) { closeLogs(); return }
  openLogs()
}

function openLogs() {
  if (!sandbox.value?.id) return
  closeLogs()
  const token = getToken()
  const params = [`token=${token}`, `tail=${logTail.value}`]
  if (logSince.value) params.push(`since=${logSince.value}`)
  const url = `${API_BASE.replace(/^http/, 'ws')}/api/sandboxes/${sandbox.value.id}/logs?${params.join('&')}`
  const socket = new WebSocket(url)
  socket.onopen = () => { wsStatus.value = 'connected' }
  socket.onmessage = (e) => {
    if (typeof e.data === 'string' && e.data.startsWith('{')) {
      try {
        const evt = JSON.parse(e.data)
        if (evt.event === 'container_stopped') {
          logLines.value.push({ text: `⚠ ${t('sandbox.logStopped')}`, cls: 'log-warn' })
          ElMessage.info(t('sandbox.logStopped'))
        } else if (evt.event === 'container_deleted') {
          logLines.value.push({ text: `✕ ${t('sandbox.logDeleted')}`, cls: 'log-error' })
          ElMessage.warning(t('sandbox.logDeleted'))
          socket.close()
        } else if (evt.event === 'error') {
          logLines.value.push({ text: `✕ ${evt.message || t('sandbox.logError')}`, cls: 'log-error' })
        }
      } catch { /* ignore */ }
    } else {
      // Strip DO/KV framing bytes from raw log lines
      const raw = typeof e.data === 'string' ? e.data : ''
      // eslint-disable-next-line no-control-regex
      logLines.value.push({ text: raw.replace(/^\x01Z/, ''), cls: '' })
    }
    if (logFollow.value) nextTick(() => { if (logRef.value) logRef.value.scrollTop = logRef.value.scrollHeight })
  }
  socket.onclose = () => { wsStatus.value = 'closed'; ws.value = null }
  socket.onerror = () => { wsStatus.value = 'error' }
  ws.value = socket
}

function closeLogs() {
  if (ws.value) { ws.value.close(); ws.value = null }
  wsStatus.value = 'idle'
  logLines.value = []
  logFollow.value = true
  logSince.value = 0
}

function onLogScroll() {
  if (!logRef.value) return
  const el = logRef.value
  logFollow.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 20
}

onUnmounted(closeLogs)

let lastClick = 0
function throttle(): boolean {
  const now = Date.now()
  if (now - lastClick < 1000) { ElMessage.warning(t('common.tooFast')); return true }
  lastClick = now
  return false
}

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
  return o?.externalIp || o?.eipAddress || o?.publicIp || o?.privateIp || o?.internalIp || o?.ip || JSON.stringify(o)
}

async function load() {
  loading.value = true
  try { sandbox.value = await api.extract<Sandbox>(api.sandboxes.apiSandboxesIdGet(route.params.id as string)) }
  catch { ElMessage.error(t('sandbox.loadFailed')) }
  finally { loading.value = false }
}

onMounted(load)

async function handleStart() {
  if (throttle()) return
  starting.value = true
  try {
    await axios.post(`/api/sandboxes/${route.params.id}/start`)
    ElMessage.success(t('sandbox.startSuccess'))
    await load()
  } catch { ElMessage.error(t('sandbox.actionFailed')) }
  finally { starting.value = false }
}

async function handleStop() {
  if (throttle()) return
  try {
    await api.sandboxes.apiSandboxesIdStopPost(route.params.id as string)
    ElMessage.success(t('sandbox.stopSuccess'))
    await load()
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
  if (throttle()) return
  try {
    await api.sandboxes.apiSandboxesIdSyncPost(route.params.id as string)
    ElMessage.success(t('sandbox.syncSuccess'))
    await load()
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
.log-viewer { background: #0d1117; color: #e6edf3; font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace; font-size: 12px; line-height: 1.6; padding: 12px; border-radius: 6px; max-height: 400px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; }
.log-viewer.log-placeholder { background: transparent; color: var(--el-text-color-secondary); font-family: var(--el-font-family); font-size: 13px; display: flex; align-items: center; justify-content: center; min-height: 80px; }
.log-line { padding: 0 4px; }
.log-warn { color: #d29922; }
.log-error { color: #f85149; }
.log-count { font-size: 12px; color: var(--el-text-color-secondary); margin-left: 6px; }
.log-actions { display: inline-flex; align-items: center; gap: 4px; float: right; }
.log-toolbar { display: inline-flex; align-items: center; gap: 2px; }
</style>

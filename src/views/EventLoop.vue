<template>
  <div>
    <h2>{{ $t('event.title') }}</h2>

    <!-- Status + Config -->
    <el-card v-if="status" class="status-card">
      <el-descriptions :column="3" border>
        <el-descriptions-item :label="$t('event.status')">
          <el-tag :type="status.running?'success':'info'" effect="dark" size="large">
            {{ status.running ? (status.paused ? $t('event.paused') : $t('event.running')) : $t('event.stopped') }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('event.uptime')">{{ fmtDur(status.uptimeMs) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('event.processed')">{{ status.processedCount }} {{ $t('event.count') }}</el-descriptions-item>
        <el-descriptions-item :label="$t('event.queueBacklog')">
          <el-tag :type="status.queueSize>0?'warning':'info'" size="large">
            {{ status.queueSize }} {{ $t('event.waiting') }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('event.tickInterval')">{{ status.config.intervalMs }}ms</el-descriptions-item>
        <el-descriptions-item :label="$t('event.autoStart')">{{ status.config.autoStart ? $t('event.yes') : $t('event.no') }}</el-descriptions-item>
      </el-descriptions>

      <div class="actions">
        <el-button v-if="!status.running" type="success" @click="cmd('start')" :loading="busy">{{ $t('event.start') }}</el-button>
        <el-button v-if="status.running && !status.paused" @click="cmd('pause')" :loading="busy">{{ $t('event.pause') }}</el-button>
        <el-button v-if="status.paused" @click="cmd('resume')" :loading="busy">{{ $t('event.resume') }}</el-button>
        <el-button v-if="status.running" type="warning" @click="cmd('stop')" :loading="busy">{{ $t('event.stop') }}</el-button>
        <el-button @click="fetchStatus">{{ $t('event.refresh') }}</el-button>
      </div>

      <el-divider>{{ $t('event.loopParams') }}</el-divider>
      <el-form :model="cfgForm" inline class="config-form">
        <el-form-item :label="$t('event.interval')"><el-input-number v-model="cfgForm.intervalMs" :min="1000" :step="1000" /> ms</el-form-item>
        <el-form-item :label="$t('event.batchPer')"><el-input-number v-model="cfgForm.batchSize" :min="0" /> {{ $t('event.count') }}</el-form-item>
        <el-form-item :label="$t('event.queueLimit')"><el-input-number v-model="cfgForm.maxQueueSize" :min="0" /> {{ $t('event.count') }}</el-form-item>
        <el-form-item><el-button type="primary" @click="handleConfigure" :loading="busy">{{ $t('event.applyParams') }}</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-empty v-else-if="!loading" :description="$t('event.cannotFetch')" :image-size="80" />

    <!-- Push event -->
    <el-card class="section">
      <template #header>{{ $t('event.pushEvent') }}</template>
      <el-form :model="evtForm" inline @keyup.enter="handleCreate">
        <el-form-item :label="$t('event.eventType')">
          <el-input v-model="evtForm.type" placeholder="例: game.start, user.login" style="width:280px" />
        </el-form-item>
        <el-form-item :label="$t('event.dataJson')">
          <el-input v-model="evtForm.payload" placeholder='例: {"gameId":"mc-1"}' style="width:320px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleCreate" :loading="creating">{{ $t('event.pushToQueue') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Submitted events (session) -->
    <el-card class="section">
      <template #header>{{ $t('event.submittedEvents') }}</template>
      <el-table v-if="submitted.length" :data="submitted || []">
        <el-table-column label="ID" width="200" show-overflow-tooltip>
          <template #default="{ row }"><code>{{ row.id }}</code></template>
        </el-table-column>
        <el-table-column :label="$t('event.eventType')" min-width="200">
          <template #default="{ row }">{{ row.type }}</template>
        </el-table-column>
        <el-table-column :label="$t('event.status')" width="120">
          <template #default="{ row }"><el-tag :type="row.status==='queued'?'warning':'success'" size="small">{{ row.status === 'queued' ? $t('event.queued') : $t('event.processedLabel') }}</el-tag></template>
        </el-table-column>
        <el-table-column :label="$t('event.submitTime')" width="170">
          <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-else :description="$t('event.noEvents')" :image-size="60" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { api } from '../api'

const { t } = useI18n()

const loading = ref(false)
const busy = ref(false)
const creating = ref(false)
const status = ref<EventLoopStatus | null>(null)
const submitted = ref<{ id: string; type: string; payload?: string; status: string; createdAt: number }[]>([])
const cfgForm = reactive({ intervalMs: 5000, batchSize: 0, maxQueueSize: 0 })
const evtForm = reactive({ type: 'test.ping', payload: '' })

function fmtDur(ms: number) {
  if (!ms) return '-'
  const s = Math.floor(ms / 1000); const m = Math.floor(s / 60); const h = Math.floor(m / 60)
  return t('event.uptimeFormat', { h, m: m % 60, s: s % 60 })
}
function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

async function fetchStatus() {
  loading.value = true
  try {
    const s = await api.events.getStatus()
    status.value = s
    cfgForm.intervalMs = s.config.intervalMs
    cfgForm.batchSize = s.config.batchSize
    cfgForm.maxQueueSize = s.config.maxQueueSize
  } catch { ElMessage.error(t('event.fetchFailed')) }
  finally { loading.value = false }
}

async function cmd(action: string) {
  busy.value = true
  try {
    const m: Record<string, () => Promise<any>> = {
      start: () => api.events.start(), stop: () => api.events.stop(),
      pause: () => api.events.pause(), resume: () => api.events.resume(),
    }
    await m[action]()
    ElMessage.success(t(`event.${action}Success`))
    await fetchStatus()
  } catch { ElMessage.error(t('event.actionFailed')) }
  finally { busy.value = false }
}

async function handleConfigure() {
  busy.value = true
  try {
    await api.events.configure({ intervalMs: cfgForm.intervalMs, batchSize: cfgForm.batchSize, maxQueueSize: cfgForm.maxQueueSize })
    ElMessage.success(t('event.applySuccess'))
    await fetchStatus()
  } catch { ElMessage.error(t('event.applyFailed')) }
  finally { busy.value = false }
}

async function handleCreate() {
  if (!evtForm.type) { ElMessage.warning(t('event.typeRequired')); return }
  creating.value = true
  try {
    let payload: unknown = undefined
    try { if (evtForm.payload) payload = JSON.parse(evtForm.payload) } catch { payload = evtForm.payload }
    const res = await api.events.create(evtForm.type, payload)
    submitted.value.unshift({ id: res.id, type: evtForm.type, payload: evtForm.payload, status: 'queued', createdAt: Date.now() })
    ElMessage.success(t('event.pushSuccess', { id: res.id }))
    await fetchStatus()
  } catch { ElMessage.error(t('event.pushFailed')) }
  finally { creating.value = false }
}

onMounted(fetchStatus)
</script>

<style scoped>
.actions { margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap; }
.config-form { margin-top: 8px; padding: 16px; background: var(--el-bg-color-page); border-radius: 4px; }
.section { margin-top: 16px; }
code { font-size: 12px; background: var(--el-bg-color-page); padding: 2px 4px; border-radius: 2px; }
</style>

<template>
  <div>
    <h2>{{ $t('event.title') }}</h2>

    <!-- Status + Config -->
    <el-card
      v-if="status"
      class="status-card"
    >
      <el-descriptions
        :column="3"
        border
      >
        <el-descriptions-item :label="$t('event.status')">
          <el-tag
            :type="status.running?'success':'info'"
            effect="dark"
            size="large"
          >
            {{ status.running ? (status.paused ? $t('event.paused') : $t('event.running')) : $t('event.stopped') }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('event.uptime')">
          {{ fmtDur(status.uptimeMs) }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('event.processed')">
          {{ status.processedCount }} {{ $t('event.count') }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('event.queueBacklog')">
          <el-tag
            :type="status.queueSize>0?'warning':'info'"
            size="large"
          >
            {{ status.queueSize }} {{ $t('event.waiting') }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('event.tickInterval')">
          {{ status.config.intervalMs }}ms
        </el-descriptions-item>
        <el-descriptions-item :label="$t('event.autoStart')">
          {{ status.config.autoStart ? $t('event.yes') : $t('event.no') }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="actions">
        <el-button
          v-if="!status.running"
          type="success"
          :loading="busy"
          @click="cmd('start')"
        >
          {{ $t('event.start') }}
        </el-button>
        <el-button
          v-if="status.running && !status.paused"
          :loading="busy"
          @click="cmd('pause')"
        >
          {{ $t('event.pause') }}
        </el-button>
        <el-button
          v-if="status.paused"
          :loading="busy"
          @click="cmd('resume')"
        >
          {{ $t('event.resume') }}
        </el-button>
        <el-button
          v-if="status.running"
          type="warning"
          :loading="busy"
          @click="cmd('stop')"
        >
          {{ $t('event.stop') }}
        </el-button>
        <el-button @click="fetchStatus">
          {{ $t('event.refresh') }}
        </el-button>
        <el-button
          size="small"
          type="info"
          plain
          :loading="ticking"
          @click="handleTick"
        >
          [dev] 处理积压事件
        </el-button>
      </div>

      <el-divider>{{ $t('event.loopParams') }}</el-divider>
      <el-form
        :model="cfgForm"
        inline
        class="config-form"
      >
        <el-form-item :label="$t('event.interval')">
          <el-input-number
            v-model="cfgForm.intervalMs"
            :min="1000"
            :step="1000"
          /> ms
        </el-form-item>
        <el-form-item :label="$t('event.batchPer')">
          <el-input-number
            v-model="cfgForm.batchSize"
            :min="0"
          /> {{ $t('event.count') }}
        </el-form-item>
        <el-form-item :label="$t('event.queueLimit')">
          <el-input-number
            v-model="cfgForm.maxQueueSize"
            :min="0"
          /> {{ $t('event.count') }}
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="busy"
            @click="handleConfigure"
          >
            {{ $t('event.applyParams') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-empty
      v-else-if="!loading"
      :description="$t('event.cannotFetch')"
      :image-size="80"
    />

    <!-- Pending events -->
    <el-card class="section">
      <template #header>
        <span>{{ $t('event.pendingEvents') }}</span>
        <el-tag
          v-if="pending.length"
          size="small"
          style="margin-left:6px"
        >
          {{ pending.length }}
        </el-tag>
      </template>
      <div
        v-if="pending.length"
        class="pending-list"
      >
        <div
          v-for="evt in pending"
          :key="evt.id"
          class="pending-item"
        >
          <code class="pending-id">{{ evt.id.slice(0, 16) }}…</code>
          <el-tag size="small">
            {{ evt.type }}
          </el-tag>
        </div>
      </div>
      <el-empty
        v-else
        :description="$t('event.noPending')"
        :image-size="50"
      />
    </el-card>

    <!-- Push event -->
    <el-card class="section">
      <template #header>
        {{ $t('event.pushEvent') }}
      </template>
      <el-form
        :model="evtForm"
        inline
        @keyup.enter="handleCreate"
      >
        <el-form-item :label="$t('event.eventType')">
          <el-input
            v-model="evtForm.type"
            placeholder="例: game.start, user.login"
            style="width:280px"
          />
        </el-form-item>
        <el-form-item :label="$t('event.dataJson')">
          <el-input
            v-model="evtForm.payload"
            placeholder="例: {&quot;gameId&quot;:&quot;mc-1&quot;}"
            style="width:320px"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="creating"
            @click="handleCreate"
          >
            {{ $t('event.pushToQueue') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { api } from '../api/typed'

const { t } = useI18n()

const loading = ref(false)
const busy = ref(false)
const creating = ref(false)
const ticking = ref(false)
const status = ref<EventLoopStatus | null>(null)
const pending = ref<{ type: string; id: string }[]>([])
const cfgForm = reactive({ intervalMs: 5000, batchSize: 0, maxQueueSize: 0 })
const evtForm = reactive({ type: 'test.ping', payload: '' })

function fmtDur(ms: number) {
  if (!ms) return '-'
  const s = Math.floor(ms / 1000); const m = Math.floor(s / 60); const h = Math.floor(m / 60)
  return t('event.uptimeFormat', { h, m: m % 60, s: s % 60 })
}

async function fetchStatus() {
  loading.value = true
  try {
    const [s, p] = await Promise.all([api.events.getStatus(), api.events.pending()])
    status.value = s
    pending.value = p ?? []
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

async function handleTick() {
  ticking.value = true
  try {
    const res = await api.dev.triggerTick()
    ElMessage.success(`[dev] ${(res as any).data?.message || 'Tick done'}`)
    await fetchStatus()
  } catch { ElMessage.error('[dev] Tick failed') }
  finally { ticking.value = false }
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
.pending-list { display: flex; flex-direction: column; gap: 6px; }
.pending-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: var(--el-bg-color-page); border-radius: 4px; }
.pending-id { font-size: 11px; color: var(--el-text-color-secondary); }
</style>

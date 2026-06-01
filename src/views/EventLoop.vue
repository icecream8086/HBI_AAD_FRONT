<template>
  <div>
    <h2>事件循环</h2>

    <!-- Status card -->
    <el-card v-if="status" class="status-card">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="状态">
          <el-tag :type="status.running?'success':'info'" effect="dark">
            {{ status.running ? (status.paused ? '已暂停' : '运行中') : '已停止' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="运行时间">{{ fmtDur(status.uptimeMs) }}</el-descriptions-item>
        <el-descriptions-item label="已处理">{{ status.processedCount }} 个事件</el-descriptions-item>
        <el-descriptions-item label="队列中">
          <el-tag :type="status.queueSize>0?'warning':'info'" size="small">{{ status.queueSize }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Tick 间隔">{{ status.config.intervalMs }}ms</el-descriptions-item>
        <el-descriptions-item label="自动启动">{{ status.config.autoStart ? '是' : '否' }}</el-descriptions-item>
      </el-descriptions>

      <div class="actions">
        <el-button v-if="!status.running" type="success" @click="cmd('start')" :loading="busy">启动</el-button>
        <el-button v-if="status.running && !status.paused" @click="cmd('pause')" :loading="busy">暂停</el-button>
        <el-button v-if="status.paused" @click="cmd('resume')" :loading="busy">恢复</el-button>
        <el-button v-if="status.running" type="warning" @click="cmd('stop')" :loading="busy">停止</el-button>
        <el-button @click="fetchStatus" style="margin-left:8px">刷新</el-button>
        <el-button @click="showConfig = !showConfig">配置</el-button>
      </div>

      <!-- Configure -->
      <el-form v-if="showConfig" :model="cfgForm" inline class="config-form">
        <el-form-item label="间隔(ms)"><el-input-number v-model="cfgForm.intervalMs" :min="1000" :step="1000" /></el-form-item>
        <el-form-item label="Batch"><el-input-number v-model="cfgForm.batchSize" :min="0" /></el-form-item>
        <el-form-item label="最大队列"><el-input-number v-model="cfgForm.maxQueueSize" :min="0" /></el-form-item>
        <el-form-item><el-button type="primary" size="small" @click="handleConfigure" :loading="busy">应用</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-empty v-else-if="!loading" description="无法获取事件循环状态" />

    <!-- Create Event -->
    <el-card class="section">
      <template #header>
        <span>触发事件</span>
        <el-button size="small" style="float:right" @click="showCreate = !showCreate">
          {{ showCreate ? '收起' : '新建事件' }}
        </el-button>
      </template>
      <el-form v-if="showCreate" :model="evtForm" inline @keyup.enter="handleCreate">
        <el-form-item label="类型">
          <el-input v-model="evtForm.type" placeholder="如: test.hello" style="width:250px" />
        </el-form-item>
        <el-form-item label="Payload">
          <el-input v-model="evtForm.payload" placeholder='如: {"key":"value"}' style="width:300px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleCreate" :loading="creating">发送</el-button>
        </el-form-item>
      </el-form>
      <p v-else class="muted">点击"新建事件"向队列推入一个事件</p>
    </el-card>

    <!-- Recent Events (from API log) -->
    <el-card class="section">
      <template #header>最近事件 ({{ events.length }})</template>
      <el-table :data="events" stripe empty-text="暂无事件">
        <el-table-column label="ID" width="180" show-overflow-tooltip>
          <template #default="{ row }"><code>{{ row.id }}</code></template>
        </el-table-column>
        <el-table-column label="类型" min-width="150">
          <template #default="{ row }">{{ row.type }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../api'

const loading = ref(false)
const busy = ref(false)
const creating = ref(false)
const showConfig = ref(false)
const showCreate = ref(false)
const status = ref<EventLoopStatus | null>(null)
const events = ref<{ id: string; type: string; createdAt: number }[]>([])
const cfgForm = reactive({ intervalMs: 5000, batchSize: 0, maxQueueSize: 0 })
const evtForm = reactive({ type: '', payload: '' })

function fmtDur(ms: number) {
  if (!ms) return '-'
  const s = Math.floor(ms / 1000); const m = Math.floor(s / 60); const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m ${s % 60}s`
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
    // Also check audit logs for recent events
    try {
      const logs = await api.extractLines<any>(api.audit.apiAuditLogsGet({ params: { facility: 'event-bus', limit: 10 } }))
      events.value = logs.map((l: any) => ({ id: l.id || '-', type: l.message || '-', createdAt: l.timestamp }))
    } catch { events.value = [] }
  } catch { ElMessage.error('获取状态失败') }
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
    ElMessage.success({ start: '已启动', stop: '已停止', pause: '已暂停', resume: '已恢复' }[action] || 'OK')
    await fetchStatus()
  } catch { ElMessage.error('操作失败') }
  finally { busy.value = false }
}

async function handleConfigure() {
  busy.value = true
  try {
    await api.events.configure({ intervalMs: cfgForm.intervalMs, batchSize: cfgForm.batchSize, maxQueueSize: cfgForm.maxQueueSize })
    ElMessage.success('配置已更新')
    await fetchStatus()
  } catch { ElMessage.error('配置失败') }
  finally { busy.value = false }
}

async function handleCreate() {
  if (!evtForm.type) { ElMessage.warning('请输入事件类型'); return }
  creating.value = true
  try {
    let payload: unknown = undefined
    try { if (evtForm.payload) payload = JSON.parse(evtForm.payload) } catch { payload = evtForm.payload }
    const res = await api.events.create(evtForm.type, payload)
    ElMessage.success(`事件已创建: ${res.id}`)
    evtForm.type = ''; evtForm.payload = ''
    await fetchStatus()
  } catch { ElMessage.error('创建失败') }
  finally { creating.value = false }
}

onMounted(fetchStatus)
</script>

<style scoped>
.actions { margin-top: 16px; }
.config-form { margin-top: 16px; padding: 16px; background: var(--el-bg-color-page); border-radius: 4px; }
.section { margin-top: 16px; }
.muted { color: var(--el-text-color-secondary); font-size: 13px; }
code { font-size: 12px; background: var(--el-bg-color-page); padding: 2px 4px; border-radius: 2px; }
</style>

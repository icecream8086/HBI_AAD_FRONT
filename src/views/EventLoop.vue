<template>
  <div>
    <h2>事件循环</h2>

    <!-- Status + Config -->
    <el-card v-if="status" class="status-card">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="状态">
          <el-tag :type="status.running?'success':'info'" effect="dark" size="large">
            {{ status.running ? (status.paused ? '已暂停' : '运行中') : '已停止' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="运行时长">{{ fmtDur(status.uptimeMs) }}</el-descriptions-item>
        <el-descriptions-item label="已处理">{{ status.processedCount }} 个</el-descriptions-item>
        <el-descriptions-item label="队列积压">
          <el-tag :type="status.queueSize>0?'warning':'info'" size="large">
            {{ status.queueSize }} 个等待处理
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Tick 间隔">{{ status.config.intervalMs }}ms</el-descriptions-item>
        <el-descriptions-item label="自动启动">{{ status.config.autoStart ? '是' : '否' }}</el-descriptions-item>
      </el-descriptions>

      <div class="actions">
        <el-button v-if="!status.running" type="success" @click="cmd('start')" :loading="busy">启动</el-button>
        <el-button v-if="status.running && !status.paused" @click="cmd('pause')" :loading="busy">暂停</el-button>
        <el-button v-if="status.paused" @click="cmd('resume')" :loading="busy">恢复</el-button>
        <el-button v-if="status.running" type="warning" @click="cmd('stop')" :loading="busy">停止</el-button>
        <el-button @click="fetchStatus">刷新</el-button>
      </div>

      <el-divider>循环参数</el-divider>
      <el-form :model="cfgForm" inline class="config-form">
        <el-form-item label="执行间隔"><el-input-number v-model="cfgForm.intervalMs" :min="1000" :step="1000" /> ms</el-form-item>
        <el-form-item label="每批处理"><el-input-number v-model="cfgForm.batchSize" :min="0" /> 个</el-form-item>
        <el-form-item label="队列上限"><el-input-number v-model="cfgForm.maxQueueSize" :min="0" /> 个</el-form-item>
        <el-form-item><el-button type="primary" @click="handleConfigure" :loading="busy">应用参数</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-empty v-else-if="!loading" description="无法获取事件循环状态" :image-size="80" />

    <!-- Push event -->
    <el-card class="section">
      <template #header>推送事件到队列</template>
      <el-form :model="evtForm" inline @keyup.enter="handleCreate">
        <el-form-item label="事件类型">
          <el-input v-model="evtForm.type" placeholder="例: game.start, user.login" style="width:280px" />
        </el-form-item>
        <el-form-item label="数据 (JSON)">
          <el-input v-model="evtForm.payload" placeholder='例: {"gameId":"mc-1"}' style="width:320px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleCreate" :loading="creating">推入队列</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Submitted events (session) -->
    <el-card class="section">
      <template #header>已提交事件 (本会话)</template>
      <el-table v-if="submitted.length" :data="submitted || []">
        <el-table-column label="ID" width="200" show-overflow-tooltip>
          <template #default="{ row }"><code>{{ row.id }}</code></template>
        </el-table-column>
        <el-table-column label="类型" min-width="200">
          <template #default="{ row }">{{ row.type }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }"><el-tag :type="row.status==='queued'?'warning':'success'" size="small">{{ row.status === 'queued' ? '排队中' : '已处理' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="提交时间" width="170">
          <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="本会话尚未提交事件，在上方输入类型和数据后点击「推入队列」" :image-size="60" />
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
const status = ref<EventLoopStatus | null>(null)
const submitted = ref<{ id: string; type: string; payload?: string; status: string; createdAt: number }[]>([])
const cfgForm = reactive({ intervalMs: 5000, batchSize: 0, maxQueueSize: 0 })
const evtForm = reactive({ type: 'test.ping', payload: '' })

function fmtDur(ms: number) {
  if (!ms) return '-'
  const s = Math.floor(ms / 1000); const m = Math.floor(s / 60); const h = Math.floor(m / 60)
  return `${h}小时 ${m % 60}分 ${s % 60}秒`
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
    ElMessage.success('参数已更新')
    await fetchStatus()
  } catch { ElMessage.error('更新失败') }
  finally { busy.value = false }
}

async function handleCreate() {
  if (!evtForm.type) { ElMessage.warning('请输入事件类型'); return }
  creating.value = true
  try {
    let payload: unknown = undefined
    try { if (evtForm.payload) payload = JSON.parse(evtForm.payload) } catch { payload = evtForm.payload }
    const res = await api.events.create(evtForm.type, payload)
    submitted.value.unshift({ id: res.id, type: evtForm.type, payload: evtForm.payload, status: 'queued', createdAt: Date.now() })
    ElMessage.success(`事件已推入队列: ${res.id}`)
    await fetchStatus()
  } catch { ElMessage.error('推送失败') }
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

<template>
  <div>
    <h2>事件循环</h2>
    <el-card v-if="status">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="状态">
          <el-tag :type="status.running?'success':'info'" effect="dark" size="large">
            {{ status.running ? '运行中' : '已停止' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Tick 间隔">{{ status.tickInterval }}ms</el-descriptions-item>
        <el-descriptions-item label="队列大小">
          <el-tag :type="status.queueSize>0?'warning':'info'">{{ status.queueSize }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="上次 Tick">{{ fmt(status.lastTick) }}</el-descriptions-item>
      </el-descriptions>

      <div class="actions">
        <el-button v-if="!status.running" type="success" @click="cmd('start')" :loading="busy">启动</el-button>
        <el-button v-if="status.running" type="warning" @click="cmd('stop')" :loading="busy">停止</el-button>
        <el-button v-if="status.running" @click="cmd('pause')" :loading="busy">暂停</el-button>
        <el-button v-if="!status.running" @click="cmd('resume')" :loading="busy">恢复</el-button>
        <el-button @click="fetchStatus" style="margin-left:8px">刷新</el-button>
      </div>
    </el-card>
    <el-empty v-else-if="!loading" description="无法获取事件循环状态" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../api'

const loading = ref(false)
const busy = ref(false)
const status = ref<EventLoopStatus | null>(null)

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

async function fetchStatus() {
  loading.value = true
  try { status.value = await api.events.getStatus() } catch { ElMessage.error('获取状态失败') }
  finally { loading.value = false }
}

async function cmd(action: string) {
  busy.value = true
  try {
    const actions: Record<string, () => Promise<any>> = {
      start: () => api.events.start(), stop: () => api.events.stop(),
      pause: () => api.events.pause(), resume: () => api.events.resume(),
    }
    await actions[action]()
    ElMessage.success(`${action === 'start' ? '启动' : action === 'stop' ? '停止' : action === 'pause' ? '暂停' : '恢复'}成功`)
    await fetchStatus()
  } catch { ElMessage.error('操作失败') }
  finally { busy.value = false }
}

onMounted(fetchStatus)
</script>

<style scoped>
.actions { margin-top: 16px; }
</style>

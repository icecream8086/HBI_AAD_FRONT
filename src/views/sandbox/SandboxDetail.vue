<template>
  <div v-loading="loading">
    <el-button text @click="$router.push('/sandboxes')" class="back">← 返回沙箱列表</el-button>

    <div v-if="sandbox" class="detail">
      <div class="page-head">
        <h2>沙箱详情</h2>
        <div class="actions">
          <el-button :type="sandbox.status==='Running'?'warning':''" @click="handleStop" :disabled="sandbox.status!=='Running'">停止</el-button>
          <el-button type="danger" @click="handleDelete">删除</el-button>
          <el-button @click="handleSync">同步状态</el-button>
          <el-button @click="fetchHealth">健康检查</el-button>
        </div>
      </div>

      <el-descriptions :column="2" border class="section">
        <el-descriptions-item label="ID" :span="2">
          <code>{{ sandbox.id }}</code>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(sandbox.status)" effect="dark">{{ sandbox.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Provider">{{ sandbox.providerId }}</el-descriptions-item>
        <el-descriptions-item label="网络">{{ sandbox.network || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ fmt(sandbox.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ fmt(sandbox.updatedAt) }}</el-descriptions-item>
      </el-descriptions>

      <!-- Containers -->
      <el-card class="section">
        <template #header>容器 ({{ sandbox.containers?.length || 0 }})</template>
        <el-table :data="sandbox.containers || []" stripe empty-text="无容器">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="image" label="镜像" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status==='running'?'success':'info'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="containerId" label="Container ID" width="220" show-overflow-tooltip />
          <el-table-column label="端口" show-overflow-tooltip>
            <template #default="{ row }">{{ row.ports?.map((p:any)=>`${p.container}:${p.host}`).join(', ') || '-' }}</template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- Events -->
      <el-card class="section">
        <template #header>事件 ({{ sandbox.events?.length || 0 }})</template>
        <el-table :data="sandbox.events || []" stripe empty-text="暂无事件">
          <el-table-column label="时间" width="180">
            <template #default="{ row }">{{ fmt(row.timestamp) }}</template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="140" />
          <el-table-column prop="message" label="消息" />
        </el-table>
      </el-card>
    </div>

    <el-empty v-else-if="!loading" description="沙箱不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const sandbox = ref<Sandbox | null>(null)

function statusType(s: string) {
  const m: Record<string, string> = { Running: 'success', Pending: 'warning', Failed: 'danger', Stopped: 'info', Terminated: 'info', Deleted: 'info' }
  return m[s] || 'info'
}
function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

async function load() {
  loading.value = true
  try { sandbox.value = await api.extract<Sandbox>(api.sandboxes.apiSandboxesIdGet(route.params.id as string)) }
  catch { ElMessage.error('加载沙箱失败') }
  finally { loading.value = false }
}

onMounted(load)

async function handleStop() {
  try { await api.sandboxes.apiSandboxesIdStopPost(route.params.id as string); ElMessage.success('已停止'); await load() }
  catch { ElMessage.error('操作失败') }
}
async function handleDelete() {
  try {
    await ElMessageBox.confirm('确定删除此沙箱？', '确认')
    await api.sandboxes.apiSandboxesIdDelete(route.params.id as string)
    ElMessage.success('已删除')
    router.push('/sandboxes')
  } catch { /* ignore */ }
}
async function handleSync() {
  try { await api.sandboxes.apiSandboxesIdSyncPost(route.params.id as string); ElMessage.success('同步完成'); await load() }
  catch { ElMessage.error('同步失败') }
}
async function fetchHealth() {
  try {
    const h = await api.extract<HealthStatus>(api.sandboxes.apiSandboxesIdHealthGet(route.params.id as string))
    ElMessage.info(`健康状态: ${h.status}${h.message ? ' - ' + h.message : ''}`)
  } catch { ElMessage.error('获取健康状态失败') }
}
</script>

<style scoped>
.back { margin-bottom: 8px; padding: 0; }
.detail { padding: 0; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.actions { display: flex; gap: 8px; }
.section { margin-top: 16px; }
code { font-size: 12px; background: var(--color-bg); padding: 2px 6px; border-radius: 3px; }
</style>

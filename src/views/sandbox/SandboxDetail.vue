<template>
  <div v-loading="loading">
    <el-button text @click="$router.push('/sandboxes')" class="back">← 返回容器实例列表</el-button>

    <div v-if="sandbox">
      <div class="page-head">
        <div>
          <h2>{{ sandbox.config?.name || sandbox.name || '容器实例' }}</h2>
          <el-tag :type="statusType(sandbox.status)" effect="dark" size="large">{{ sandbox.status }}</el-tag>
        </div>
        <div class="actions">
          <el-button :type="sandbox.status==='Running'?'warning':''" @click="handleStop" :disabled="sandbox.status!=='Running'">停止</el-button>
          <el-button type="danger" @click="handleDelete">删除</el-button>
          <el-button @click="handleSync">同步状态</el-button>
          <el-button @click="fetchHealth">健康检查</el-button>
        </div>
      </div>

      <el-descriptions :column="3" border size="small">
        <el-descriptions-item label="ID" :span="3"><code>{{ sandbox.id }}</code></el-descriptions-item>
        <el-descriptions-item label="Provider">{{ sandbox.providerId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Region">{{ sandbox.config?.region || '-' }}</el-descriptions-item>
        <el-descriptions-item label="网络">{{ fmtNetwork(sandbox.network) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ fmt(sandbox.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ fmt(sandbox.updatedAt) }}</el-descriptions-item>
      </el-descriptions>

      <!-- Labels -->
      <el-card class="section" v-if="sandbox.config?.labels">
        <template #header>标签</template>
        <el-tag v-for="(v, k) in sandbox.config.labels" :key="k" size="small" style="margin-right:6px">{{ k }}={{ v }}</el-tag>
      </el-card>

      <!-- Runtime Containers -->
      <el-card class="section">
        <template #header>运行时容器 ({{ sandbox.containers?.length || 0 }})</template>
        <div v-for="(c, ci) in sandbox.containers || []" :key="ci" class="cont-box">
          <h4>{{ c.name || `容器 ${ci+1}` }}</h4>
          <el-descriptions :column="4" border size="small">
            <el-descriptions-item label="镜像" :span="2"><code>{{ c.image || '-' }}</code></el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="ctStatusType(c)" size="small">{{ ctStatus(c) }}</el-tag>
              <el-tag v-if="c.state?.ready" type="success" size="small" effect="plain" style="margin-left:4px">就绪</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="CPU/内存">{{ c.cpu ?? '-' }}核 / {{ c.memory ?? '-' }}Mi</el-descriptions-item>
          </el-descriptions>
          <div v-if="c.state?.startTime" class="sub">启动时间: {{ fmtStr(c.state.startTime) }}</div>
          <div v-if="c.health?.status" class="sub">
            <strong>健康状态:</strong>
            <el-tag :type="c.health.status==='healthy'?'success':'warning'" size="small">{{ c.health.status }}</el-tag>
            <span v-if="c.health.message" class="muted"> {{ c.health.message }}</span>
          </div>
        </div>
        <el-empty v-if="!sandbox.containers?.length" description="无运行时容器" :image-size="50" />
      </el-card>

      <!-- Config Containers (desired spec) -->
      <el-card class="section" v-if="sandbox.config?.containers?.length">
        <template #header>配置定义 ({{ sandbox.config.containers.length }})</template>
        <div v-for="(c, ci) in sandbox.config.containers" :key="ci" class="cont-box">
          <h4>{{ c.name || `容器 ${ci+1}` }}</h4>
          <el-descriptions :column="4" border size="small">
            <el-descriptions-item label="镜像" :span="2"><code>{{ c.image }}</code></el-descriptions-item>
            <el-descriptions-item label="命令" :span="2">{{ c.command?.join(' ') || '-' }}</el-descriptions-item>
          </el-descriptions>
          <div v-if="c.ports?.length" class="sub">
            <strong>端口:</strong>
            <el-tag v-for="(p, pi) in c.ports" :key="pi" size="small" style="margin-right:4px">{{ p.containerPort || p.container }}{{ p.protocol ? '/'+p.protocol : '' }}{{ p.hostPort ? '→'+p.hostPort : '' }}</el-tag>
          </div>
          <div v-if="c.resources?.limits" class="sub">
            <strong>资源:</strong>
            <span v-if="c.resources.limits.cpu">{{ c.resources.limits.cpu }}核 </span>
            <span v-if="c.resources.limits.memory">{{ c.resources.limits.memory }}Mi</span>
            <span v-else>-</span>
          </div>
          <div v-if="c.env?.length" class="sub">
            <strong>环境变量:</strong>
            <el-tag v-for="(e, ei) in c.env" :key="ei" size="small" style="margin-right:4px">{{ e.name }}={{ e.value || e.valueFrom || '' }}</el-tag>
          </div>
          <div v-else-if="c.env && typeof c.env === 'object' && !Array.isArray(c.env)" class="sub">
            <strong>环境变量:</strong>
            <el-tag v-for="(v,k) in c.env" :key="k" size="small" style="margin-right:4px">{{ k }}={{ v }}</el-tag>
          </div>
          <div v-if="c.volumeMounts?.length" class="sub">
            <strong>挂载卷:</strong>
            <el-tag v-for="(vl, vi) in c.volumeMounts" :key="vi" size="small" style="margin-right:4px">{{ vl.volumeId || vl.mountPath }}{{ vl.mountPath ? '→'+vl.mountPath : '' }}</el-tag>
          </div>
          <div v-if="c.livenessProbe" class="sub">
            <strong>启动探测:</strong> <code>{{ fmtCmd(c.livenessProbe.exec?.command) }}</code>
            <span class="muted"> 延迟{{ c.livenessProbe.initialDelaySeconds }}s/间隔{{ c.livenessProbe.periodSeconds }}s</span>
          </div>
          <div v-if="c.readinessProbe" class="sub">
            <strong>就绪探测:</strong> <code>{{ fmtCmd(c.readinessProbe.exec?.command) }}</code>
            <span class="muted"> 间隔{{ c.readinessProbe.periodSeconds }}s/延迟{{ c.readinessProbe.initialDelaySeconds }}s</span>
          </div>
        </div>
      </el-card>

      <!-- Events -->
      <el-card class="section">
        <template #header>事件 ({{ sandbox.events?.length || 0 }})</template>
        <el-table :data="sandbox.events || []" empty-text="暂无事件" size="small">
          <el-table-column label="时间" width="180"><template #default="{ row }">{{ fmtEventTime(row) }}</template></el-table-column>
          <el-table-column label="类型" width="80"><template #default="{ row }"><el-tag :type="row.type==='Warning'?'warning':'info'" size="small">{{ row.type }}</el-tag></template></el-table-column>
          <el-table-column prop="reason" label="原因" width="140" />
          <el-table-column prop="message" label="消息" />
          <el-table-column label="次数" width="70"><template #default="{ row }">{{ row.count ?? 1 }}</template></el-table-column>
        </el-table>
      </el-card>
    </div>

    <el-empty v-else-if="!loading" description="容器实例不存在" />
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

function ctStatus(c: any): string {
  return c.state?.state || c.status || c.health?.status || '-'
}
function ctStatusType(c: any): string {
  const s = ctStatus(c).toLowerCase()
  return s.includes('running') || s === 'healthy' ? 'success' : s.includes('wait') || s.includes('pending') ? 'warning' : 'info'
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
  catch { ElMessage.error('加载失败') }
  finally { loading.value = false }
}

onMounted(load)

async function handleStop() {
  try { await api.sandboxes.apiSandboxesIdStopPost(route.params.id as string); ElMessage.success('已停止'); await load() }
  catch { ElMessage.error('操作失败') }
}
async function handleDelete() {
  try {
    await ElMessageBox.confirm('确定删除此容器实例？', '确认')
    await api.sandboxes.apiSandboxesIdDelete(route.params.id as string)
    ElMessage.success('已删除'); router.push('/sandboxes')
  } catch { /* ignore */ }
}
async function handleSync() {
  try { await api.sandboxes.apiSandboxesIdSyncPost(route.params.id as string); ElMessage.success('同步完成'); await load() }
  catch { ElMessage.error('同步失败') }
}
async function fetchHealth() {
  try {
    const h = await api.extract<ContainerHealth[]>(api.sandboxes.apiSandboxesIdHealthGet(route.params.id as string))
    if (!h?.length) { ElMessage.info('无容器健康数据'); return }
    h.forEach(c => ElMessage.info(`容器 ${c.containerName}: ${c.status}${c.ready ? ' ✓' : ''}`))
  } catch { ElMessage.error('获取健康状态失败') }
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

<template>
  <div class="page-container">
    <div class="page-head">
      <h2>容器实例</h2>
      <el-button type="primary" @click="showCreate = true">创建容器实例</el-button>
    </div>

    <!-- Filters -->
    <el-card class="filters">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="状态">
          <el-select v-model="filter.status" clearable placeholder="全部" style="width:140px">
            <el-option label="运行中" value="Running" />
            <el-option label="暂停" value="Stopped" />
            <el-option label="待定" value="Pending" />
            <el-option label="失败" value="Failed" />
            <el-option label="已终止" value="Terminated" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="filter.status='';fetchData()">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Table -->
    <el-table :data="sandboxes || []" v-loading="loading" stripe style="width:100%" empty-text="暂无容器实例">
      <el-table-column label="" width="50">
        <template #default>
          <el-icon :size="20"><Monitor /></el-icon>
        </template>
      </el-table-column>
      <el-table-column prop="id" label="ID" width="200" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small" effect="dark">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="容器数" width="90">
        <template #default="{ row }">{{ row.containers?.length || 0 }}</template>
      </el-table-column>
      <el-table-column prop="providerId" label="Provider" width="130" />
      <el-table-column label="网络" width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ fmtNetwork(row.network) }}</template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/sandboxes/${row.id}`)">详情</el-button>
          <el-button size="small" :type="row.status==='Running'?'warning':''" @click="handleStop(row)" :disabled="row.status!=='Running'">停止</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="page-footer">
      <el-button v-if="nextCursor" :loading="loading" @click="loadMore">加载更多</el-button>
    </div>

    <!-- Create Dialog -->
    <el-dialog v-model="showCreate" title="创建容器实例" width="700px">
      <el-form :model="createForm" label-width="100px" v-loading="creating">
        <el-form-item label="模板">
          <el-select v-model="createForm.templateId" filterable placeholder="选择模板" style="width:100%">
            <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Provider">
          <el-select v-model="createForm.provider" placeholder="选择平台" style="width:100%">
            <el-option v-for="p in platforms" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-divider>容器配置</el-divider>
        <el-form-item v-for="(c, i) in createForm.containers" :key="i" :label="`容器 ${i+1}`">
          <el-input v-model="c.image" placeholder="镜像名" style="width:300px;margin-right:8px" />
          <el-input v-model="c.name" placeholder="名称" style="width:150px" />
          <el-button type="danger" size="small" @click="createForm.containers.splice(i,1)" circle>−</el-button>
        </el-form-item>
        <el-form-item>
          <el-button size="small" @click="createForm.containers.push({name:'',image:''})">+ 添加容器</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="footer-left">
          <el-button size="small" @click="exportConfig">导出配置</el-button>
          <el-button size="small" @click="fileInput.value?.click()">导入配置</el-button>
          <input ref="fileInput" type="file" accept=".json" style="display:none" @change="importConfig" />
        </div>
        <div>
          <el-button @click="showCreate=false">取消</el-button>
          <el-button type="primary" :loading="creating" @click="handleCreate">创建</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'

const loading = ref(false)
const creating = ref(false)
const sandboxes = ref<Sandbox[]>([])
const templates = ref<SandboxTemplate[]>([])
const nextCursor = ref<string | undefined>(undefined)
const PAGE_LIMIT = 15
const platforms = ref<string[]>([])
const showCreate = ref(false)
const fileInput = ref<HTMLInputElement>()
watch(showCreate, (v) => { if (!v) { createForm.templateId = ''; createForm.provider = ''; createForm.containers = [{ name: '', image: '' }] } })
const filter = reactive({ status: '' })
const createForm = reactive({ templateId: '', provider: '', containers: [{ name: '', image: '' }] })
const resolvedTpl = ref<SandboxTemplate | null>(null)

watch(() => createForm.templateId, async (id) => {
  createForm.containers = [{ name: '', image: '' }]
  createForm.provider = ''
  resolvedTpl.value = null
  if (!id) return
  try {
    const resolved = await api.extract<SandboxTemplate>(api.templates.apiTemplatesIdResolvedGet(id))
    resolvedTpl.value = resolved
    if (resolved?.container?.containers?.length) {
      createForm.containers = resolved.container.containers.map(c => ({ name: c.name || '', image: c.image || '' }))
    }
    if (resolved?.container?.account) createForm.provider = resolved.container.account
  } catch { /* use raw template */ }
})

function statusType(s: string) {
  const m: Record<string, string> = { Running: 'success', Pending: 'warning', Failed: 'danger', Stopped: 'info', Terminated: 'info', Deleted: 'info', Scheduling: 'warning' }
  return m[s] || 'info'
}
function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }
function fmtNetwork(net: any): string {
  if (!net) return '-'
  const o = typeof net === 'string' ? tryParse(net) : net
  return o?.privateIp || o?.ip || o?.publicIp || JSON.stringify(o)
}
function tryParse(s: string) { try { return JSON.parse(s) } catch { return null } }

function exportConfig() {
  const data = { provider: createForm.provider, containers: createForm.containers.filter(c => c.image), templateId: createForm.templateId || undefined }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob); const a = document.createElement('a')
  a.href = url; a.download = 'sandbox-config.json'; a.click()
  URL.revokeObjectURL(url)
}

function importConfig(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result as string)
      createForm.provider = data.provider || ''
      createForm.templateId = data.templateId || ''
      createForm.containers = data.containers?.length ? data.containers.map((c: any) => ({ name: c.name || '', image: c.image || '' })) : [{ name: '', image: '' }]
      ElMessage.success('配置已导入')
    } catch { ElMessage.error('无效的 JSON 文件') }
  }
  reader.readAsText(file)
  ;(e.target as HTMLInputElement).value = ''
}

async function fetchData() {
  loading.value = true
  nextCursor.value = undefined
  try {
    const opts: any = { params: { limit: PAGE_LIMIT } }
    if (filter.status) opts.params.status = filter.status
    const res = await api.sandboxes.apiSandboxesGet(opts)
    const d = (res.data as any)?.data as { items: Sandbox[]; nextCursor?: string } | undefined
    sandboxes.value = d?.items ?? []
    nextCursor.value = d?.nextCursor
  } catch { ElMessage.error('获取容器实例列表失败') }
  finally { loading.value = false }
}

async function loadMore() {
  if (!nextCursor.value) return
  loading.value = true
  try {
    const opts: any = { params: { limit: PAGE_LIMIT, cursor: nextCursor.value } }
    if (filter.status) opts.params.status = filter.status
    const res = await api.sandboxes.apiSandboxesGet(opts)
    const d = (res.data as any)?.data as { items: Sandbox[]; nextCursor?: string } | undefined
    sandboxes.value.push(...(d?.items ?? []))
    nextCursor.value = d?.nextCursor
  } catch { ElMessage.error('加载失败') }
  finally { loading.value = false }
}

async function handleStop(row: Sandbox) {
  try { await api.sandboxes.apiSandboxesIdStopPost(row.id); ElMessage.success('已停止'); await fetchData() }
  catch { ElMessage.error('停止失败') }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除此容器实例？所有数据将丢失。', '确认删除', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    await api.sandboxes.apiSandboxesIdDelete(id)
    ElMessage.success('已删除')
    await fetchData()
  } catch { /* canceled or error */ }
}

async function handleCreate() {
  creating.value = true
  try {
    if (createForm.templateId) {
      const applyBody: Record<string, any> = { name: 'sandbox-' + Date.now() }
      if (createForm.provider) applyBody.provider = createForm.provider
      await api.templates.apiTemplatesIdApplyPost(createForm.templateId, applyBody as any)
    }
    ElMessage.success('容器实例创建中')
    showCreate.value = false
    await fetchData()
  } catch { ElMessage.error('创建失败') }
  finally { creating.value = false }
}

onMounted(async () => {
  await fetchData()
  try { templates.value = await api.extractArray<SandboxTemplate>(api.templates.apiTemplatesGet()) } catch { /* ignore */ }
  try {
  const plats = await api.extractArray<any>(api.platforms.apiPlatformsGet())
  platforms.value = plats.map(p => p.name)
} catch { /* ignore */ }
})
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-container { padding: 0; }
.filters { margin-bottom: 16px; }
.page-footer { text-align: center; padding: 12px; }
.footer-left { display: flex; gap: 6px; }
</style>

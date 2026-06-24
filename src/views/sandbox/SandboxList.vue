<template>
  <div class="page-container">
    <div class="page-head">
      <h2>{{ $t('sandbox.title') }}</h2>
      <el-button type="primary" @click="showCreate = true">{{ $t('sandbox.create') }}</el-button>
    </div>

    <!-- Filters -->
    <el-card class="filters">
      <el-form :inline="true" @submit.prevent>
        <el-form-item :label="$t('sandbox.filterStatus')">
          <el-select v-model="filter.status" clearable :placeholder="$t('sandbox.filterAll')" style="width:140px">
            <el-option :label="$t('sandbox.statusRunning')" value="Running" />
            <el-option :label="$t('sandbox.statusStopped')" value="Stopped" />
            <el-option :label="$t('sandbox.statusPending')" value="Pending" />
            <el-option :label="$t('sandbox.statusFailed')" value="Failed" />
            <el-option :label="$t('sandbox.statusTerminated')" value="Terminated" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">{{ $t('table.query') }}</el-button>
          <el-button @click="filter.status='';fetchData()">{{ $t('table.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Table -->
    <el-table :data="sandboxes || []" v-loading="loading" stripe style="width:100%" :empty-text="$t('table.empty')">
      <el-table-column label="" width="50">
        <template #default>
          <el-icon :size="20"><Monitor /></el-icon>
        </template>
      </el-table-column>
      <el-table-column prop="id" label="ID" width="200" show-overflow-tooltip />
      <el-table-column prop="status" :label="$t('table.status')" width="120">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small" effect="dark">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.containerCount')" width="90">
        <template #default="{ row }">{{ row.containers?.length || 0 }}</template>
      </el-table-column>
      <el-table-column prop="providerId" label="Provider" width="130" />
      <el-table-column :label="$t('table.network')" width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ fmtNetwork(row.network) }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.createdAt')" width="170">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.actions')" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/sandboxes/${row.id}`)">{{ $t('table.detail') }}</el-button>
          <el-button size="small" :type="row.status==='Running'?'warning':''" @click="handleStop(row)" :disabled="row.status!=='Running'">{{ $t('table.stop') }}</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">{{ $t('table.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="page-footer">
      <el-button v-if="nextCursor" :loading="loading" @click="loadMore">{{ $t('table.loadMore') }}</el-button>
    </div>

    <!-- Create Dialog -->
    <el-dialog v-model="showCreate" :title="$t('sandbox.createTitle')" width="700px">
      <el-form :model="createForm" label-width="100px" v-loading="creating">
        <el-form-item :label="$t('sandbox.template')">
          <el-select v-model="createForm.templateId" filterable :placeholder="$t('sandbox.selectTemplate')" style="width:100%">
            <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('topology.instanceTitle')">
          <el-select v-model="createForm.instanceId" filterable clearable placeholder="Optional" style="width:100%">
            <el-option v-for="inst in instances" :key="inst.id" :label="`${inst.name} (${inst.platform}/${inst.region})`" :value="inst.id" />
          </el-select>
        </el-form-item>
        <el-divider>{{ $t('sandbox.containerConfig') }}</el-divider>
        <el-form-item v-for="(c, i) in createForm.containers" :key="i" :label="`${$t('sandbox.containerLabel')} ${i+1}`">
          <el-input v-model="c.image" :placeholder="$t('table.image')" style="width:300px;margin-right:8px" />
          <el-input v-model="c.name" :placeholder="$t('table.name')" style="width:150px" />
          <el-button type="danger" size="small" @click="createForm.containers.splice(i,1)" circle>−</el-button>
        </el-form-item>
        <el-form-item>
          <el-button size="small" @click="createForm.containers.push({name:'',image:''})">{{ $t('sandbox.addContainer') }}</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="footer-left">
          <el-button size="small" @click="exportConfig">{{ $t('table.export') }}</el-button>
          <el-button size="small" @click="fileInput.value?.click()">{{ $t('table.import') }}</el-button>
          <input ref="fileInput" type="file" accept=".json" style="display:none" @change="importConfig" />
        </div>
        <div>
          <el-button @click="showCreate=false">{{ $t('table.cancel') }}</el-button>
          <el-button type="primary" :loading="creating" @click="handleCreate">{{ $t('table.create') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { api } from '../../api'
import { useReferenceCache } from '../../composables/useReferenceCache'

const { t } = useI18n()
const refCache = useReferenceCache()
const loading = ref(false)
const creating = ref(false)
const sandboxes = ref<Sandbox[]>([])
const templates = ref<SandboxTemplate[]>([])
const instances = ref<ComputeInstance[]>([])
const nextCursor = ref<string | undefined>(undefined)
const PAGE_LIMIT = 15
const showCreate = ref(false)
const fileInput = ref<HTMLInputElement>()
watch(showCreate, (v) => { if (!v) { createForm.templateId = ''; createForm.provider = ''; createForm.instanceId = ''; createForm.containers = [{ name: '', image: '' }] } })
const filter = reactive({ status: '' })
const createForm = reactive({ templateId: '', provider: '', instanceId: '', containers: [{ name: '', image: '' }] })
const resolvedTpl = ref<SandboxTemplate | null>(null)

watch(() => createForm.templateId, async (id) => {
  createForm.containers = [{ name: '', image: '' }]
  createForm.provider = ''
  resolvedTpl.value = null
  if (!id) return
  try {
    const resolved = await api.templates.resolved(id) as SandboxTemplate
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
  return o?.externalIp || o?.eipAddress || o?.publicIp || o?.privateIp || o?.internalIp || o?.ip || JSON.stringify(o)
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
      createForm.instanceId = data.instanceId || ''
      createForm.templateId = data.templateId || ''
      createForm.containers = data.containers?.length ? data.containers.map((c: any) => ({ name: c.name || '', image: c.image || '' })) : [{ name: '', image: '' }]
      ElMessage.success(t('table.importSuccess'))
    } catch { ElMessage.error(t('table.invalidJson')) }
  }
  reader.readAsText(file)
  ;(e.target as HTMLInputElement).value = ''
}

async function fetchData() {
  loading.value = true
  nextCursor.value = undefined
  try {
    const params: any = { limit: PAGE_LIMIT }
    if (filter.status) params.status = filter.status
    const d = await api.sandboxes.list(params)
    sandboxes.value = (d as any).items ?? []
    nextCursor.value = (d as any).nextCursor
  } catch { ElMessage.error(t('sandbox.loadFailed')) }
  finally { loading.value = false }
}

async function loadMore() {
  if (!nextCursor.value) return
  loading.value = true
  try {
    const params: any = { limit: PAGE_LIMIT, cursor: nextCursor.value }
    if (filter.status) params.status = filter.status
    const d = await api.sandboxes.list(params)
    sandboxes.value.push(...((d as any).items ?? []))
    nextCursor.value = (d as any).nextCursor
  } catch { ElMessage.error(t('sandbox.loadFailed')) }
  finally { loading.value = false }
}

async function handleStop(row: Sandbox) {
  try { await api.sandboxes.stop(row.id); ElMessage.success(t('sandbox.stopSuccess')); await fetchData() }
  catch { ElMessage.error(t('sandbox.actionFailed')) }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('sandbox.deleteConfirm'), t('table.confirm'), { confirmButtonText: t('table.delete'), cancelButtonText: t('table.cancel'), type: 'warning' })
    await api.sandboxes.delete(id)
    ElMessage.success(t('sandbox.deleteSuccess'))
    await fetchData()
  } catch { /* canceled or error */ }
}

async function handleCreate() {
  creating.value = true
  try {
    if (createForm.templateId) {
      const applyBody: Record<string, any> = { name: 'sandbox-' + Date.now() }
      if (createForm.provider) applyBody.provider = createForm.provider
      if (createForm.instanceId) applyBody.instanceId = createForm.instanceId
      await api.templates.apply(createForm.templateId, applyBody as any)
    }
    ElMessage.success(t('sandbox.createSuccess'))
    showCreate.value = false
    await fetchData()
  } catch { ElMessage.error(t('sandbox.createFailed')) }
  finally { creating.value = false }
}

onMounted(async () => {
  await fetchData()
  try { templates.value = await api.templates.list({ limit: 100 }).then(r => r.items) } catch { /* ignore */ }
  await refCache.instances.load()
  instances.value = refCache.instances.data.value
})
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-container { padding: 0; }
.filters { margin-bottom: 16px; }
.page-footer { text-align: center; padding: 12px; }
.footer-left { display: flex; gap: 6px; }
</style>

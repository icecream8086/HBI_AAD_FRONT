<template>
  <div>
    <div class="page-head">
      <h2>{{ $t('image.title') }}</h2>
      <div class="page-actions">
        <el-button type="primary" @click="showPull = true">{{ $t('image.pullImage') }}</el-button>
      </div>
    </div>
    <el-card class="filters">
      <el-form inline>
        <el-form-item :label="$t('topology.instanceTitle')">
          <el-select v-model="filter.instanceId" clearable :placeholder="$t('table.selectPlaceholder')" style="width:160px" filterable @change="fetchData">
            <el-option v-for="inst in instances" :key="inst.id" :label="`${inst.name} (${inst.platform})`" :value="inst.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('topology.platform')">
          <el-select v-model="filter.platform" clearable :placeholder="$t('table.selectPlaceholder')" style="width:120px" @change="fetchData">
            <el-option v-for="p in platforms" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('table.status')">
          <el-select v-model="filter.status" clearable :placeholder="$t('table.selectPlaceholder')" style="width:120px" @change="fetchData">
            <el-option label="pending" value="pending" />
            <el-option label="pulling" value="pulling" />
            <el-option label="ready" value="ready" />
            <el-option label="error" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilter">{{ $t('table.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-table :data="repos" v-loading="loading" stripe :empty-text="$t('table.empty')">
      <el-table-column prop="name" :label="$t('table.name')" min-width="140" />
      <el-table-column prop="image" :label="$t('image.imageCol')" min-width="240" show-overflow-tooltip />
      <el-table-column :label="$t('topology.instanceTitle')" min-width="140">
        <template #default="{ row }">{{ instanceName(row.instanceId) }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.status')" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.createdAt')" width="150">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.actions')" width="240" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handlePull(row)" :loading="pullingId === row.id" :disabled="row.status==='pulling'" v-if="!taskMap[row.id]">{{ $t('image.pull') }}</el-button>
          <el-button size="small" @click="checkTask(row)" v-if="taskMap[row.id]" :loading="checkingId === row.id">{{ $t('image.checkStatus') }}</el-button>
          <el-button size="small" @click="inspect(row)">{{ $t('table.detail') }}</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">{{ $t('table.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Create / Pull dialog -->
    <el-dialog v-model="showPull" :title="$t('image.pullImage')" width="520px" destroy-on-close>
      <el-form @submit.prevent="handleCreate">
        <el-form-item :label="$t('table.name')">
          <el-input v-model="formRepoName" placeholder="my-nginx" />
        </el-form-item>
        <el-form-item :label="$t('topology.instanceTitle')" required>
          <el-select v-model="formInstanceId" filterable style="width:100%">
            <el-option v-for="inst in instances" :key="inst.id" :label="`${inst.name} (${inst.platform}/${inst.region})`" :value="inst.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('image.imageCol')" required>
          <el-input v-model="formImage" :placeholder="$t('image.pullPlaceholder')" @keyup.enter="handleCreate" />
        </el-form-item>
        <el-form-item :label="$t('topology.credentialRef')">
          <el-select v-model="formCredentialRef" filterable clearable placeholder="Optional — 选择已有凭证" style="width:100%">
            <el-option v-for="c in pullCreds" :key="c.name" :label="`${c.name} (${c.platform})`" :value="c.name" />
          </el-select>
          <div class="hint inline-cred-toggle" @click="showInlineCred = !showInlineCred">{{ showInlineCred ? '−' : '+' }} {{ $t('image.inlineCred') }}</div>
          <template v-if="showInlineCred">
            <el-input v-model="formRegistryServer" placeholder="registry.mycompany.com" size="small" style="width:100%;margin-bottom:4px;margin-top:4px" />
            <el-row :gutter="8">
              <el-col :span="12"><el-input v-model="formRegistryUser" placeholder="Username" size="small" style="width:100%" /></el-col>
              <el-col :span="12"><el-input v-model="formRegistryPass" placeholder="Password" size="small" type="password" style="width:100%" /></el-col>
            </el-row>
          </template>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPull=false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">{{ $t('image.pull') }}</el-button>
      </template>
    </el-dialog>

    <!-- Inspect dialog -->
    <el-dialog v-model="showDetail" :title="$t('image.imageDetail')" width="550px">
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item :label="$t('table.name')">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item :label="$t('image.imageCol')"><code>{{ detail.image }}</code></el-descriptions-item>
        <el-descriptions-item :label="$t('topology.credentialRef')" v-if="detail.credentialRef">{{ detail.credentialRef }}</el-descriptions-item>
        <el-descriptions-item label="ID"><code>{{ detail.id }}</code></el-descriptions-item>
        <el-descriptions-item :label="$t('topology.instanceTitle')">{{ instanceName(detail.instanceId) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('table.status')">
          <el-tag :type="statusType(detail.status)" size="small">{{ detail.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Message" v-if="detail.message">{{ detail.message }}</el-descriptions-item>
        <el-descriptions-item :label="$t('table.createdAt')">{{ fmt(detail.createdAt) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('table.updatedAt')">{{ fmt(detail.updatedAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../api'
import { useReferenceCache } from '../composables/useReferenceCache'

const { t } = useI18n()
const refCache = useReferenceCache()

const loading = ref(false)
const creating = ref(false)
const repos = ref<ImageRepository[]>([])
const instances = ref<ComputeInstance[]>([])
const pullingId = ref('')
const taskMap = ref<Record<string, string>>({})
const checkingId = ref('')
const showPull = ref(false)
const showDetail = ref(false)
const detail = ref<ImageRepository | null>(null)
const formRepoName = ref('')
const formInstanceId = ref('')
const formImage = ref('')
const formCredentialRef = ref('')
const formRegistryServer = ref('')
const formRegistryUser = ref('')
const formRegistryPass = ref('')
const showInlineCred = ref(false)

// Filters
const filter = reactive({ instanceId: '', platform: '', status: '' })
const platforms = ['alibaba', 'aws', 'podman', 'stub']

const instanceMap = ref<Record<string, string>>({})
const pullCreds = ref<MaskedCredential[]>([])

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }
function instanceName(id: string) { return instanceMap.value[id] || id.slice(0, 8) }

function statusType(s: string): 'primary' | 'warning' | 'success' | 'danger' {
  if (s === 'pending') return 'primary'
  if (s === 'pulling') return 'warning'
  if (s === 'ready') return 'success'
  return 'danger'
}

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filter.instanceId) params.instanceId = filter.instanceId
    if (filter.platform) params.platform = filter.platform
    if (filter.status) params.status = filter.status
    repos.value = await api.topology.images.list(params)
  } catch { ElMessage.error(t('image.fetchFailed')) }
  finally { loading.value = false }
}

function resetFilter() {
  filter.instanceId = ''; filter.platform = ''; filter.status = ''
  fetchData()
}

async function handleCreate() {
  if (!formInstanceId.value) { ElMessage.warning(t('topology.instanceTitle') + ' is required'); return }
  if (!formImage.value) { ElMessage.warning(t('image.imageRequired')); return }
  const name = formRepoName.value.trim() || formImage.value.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'image-repo'
  creating.value = true
  try {
    const body: CreateImageInput = {
      name,
      instanceId: formInstanceId.value,
      image: formImage.value.trim(),
    }
    if (formCredentialRef.value) {
      body.credentialRef = formCredentialRef.value
    } else if (formRegistryServer.value || formRegistryUser.value) {
      body.registryCredential = {
        server: formRegistryServer.value,
        userName: formRegistryUser.value,
        password: formRegistryPass.value,
      }
    }
    const repo = await api.topology.images.create(body)
    const { taskId } = await api.topology.images.pull(repo.id)
    ElMessage.success(t('image.pullSuccess'))
    showPull.value = false
    formRepoName.value = ''; formInstanceId.value = ''; formImage.value = ''
    formCredentialRef.value = ''; showInlineCred.value = false
    formRegistryServer.value = ''; formRegistryUser.value = ''; formRegistryPass.value = ''
    taskMap.value[repo.id] = taskId
    taskMap.value = { ...taskMap.value }
    await fetchData()
  } catch { ElMessage.error(t('image.pullFailed')) }
  finally { creating.value = false }
}

async function handlePull(repo: ImageRepository) {
  pullingId.value = repo.id
  try {
    const { taskId } = await api.topology.images.pull(repo.id)
    taskMap.value[repo.id] = taskId
    taskMap.value = { ...taskMap.value }
  } catch { ElMessage.error(t('image.pullFailed')) }
  finally { pullingId.value = '' }
}

async function checkTask(repo: ImageRepository) {
  const taskId = taskMap.value[repo.id]
  if (!taskId) return
  checkingId.value = repo.id
  try {
    const task = await api.topology.pullTasks.get(taskId)
    if (task.status === 'completed') {
      delete taskMap.value[repo.id]
      taskMap.value = { ...taskMap.value }
      ElMessage.success(t('image.pullSuccess'))
      await fetchData()
    } else if (task.status === 'failed') {
      delete taskMap.value[repo.id]
      taskMap.value = { ...taskMap.value }
      ElMessage.error(task.error || t('image.pullFailed'))
      await fetchData()
    }
    // task.status === 'pulling' → 保留按钮, 用户下次再查
  } catch { ElMessage.error(t('image.fetchDetailFailed')) }
  finally { checkingId.value = '' }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('image.deleteConfirm'), t('table.confirm'))
    await api.topology.images.delete(id)
    ElMessage.success(t('image.deleteSuccess')); await fetchData()
  } catch { /* ignore */ }
}

function inspect(repo: ImageRepository) {
  detail.value = repo
  showDetail.value = true
}

onMounted(async () => {
  await Promise.all([refCache.instances.load(), refCache.credentials.load()])
  instances.value = refCache.instances.data.value
  instanceMap.value = Object.fromEntries(refCache.instances.data.value.map(i => [i.id, i.name]))
  pullCreds.value = refCache.credentials.data.value as MaskedCredential[]
  await fetchData()
})
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { margin-bottom: 16px; }
.filters :deep(.el-form-item) { margin-bottom: 0; }
.page-actions { display: flex; align-items: center; }
.hint { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
.inline-cred-toggle { cursor: pointer; user-select: none; }
.inline-cred-toggle:hover { color: var(--el-color-primary); }
code { font-size: 12px; background: var(--el-bg-color-page); padding: 2px 6px; border-radius: 3px; }
</style>

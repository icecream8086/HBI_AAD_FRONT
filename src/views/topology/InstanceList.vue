<template>
  <div>
    <el-button text @click="$router.push('/dashboard')" class="back">← {{ $t('common.home') }}</el-button>
    <div class="page-head">
      <h2>{{ $t('topology.instanceTitle') }}</h2>
      <el-button type="primary" size="small" @click="openCreate">{{ $t('topology.createInstance') }}</el-button>
    </div>

    <el-table :data="instances" v-loading="loading" stripe :empty-text="$t('table.empty')">
      <el-table-column prop="name" :label="$t('topology.instanceName')" min-width="120" />
      <el-table-column prop="platform" :label="$t('topology.platform')" width="80">
        <template #default="{ row }"><el-tag size="small">{{ row.platform }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="region" :label="$t('topology.region')" width="130" />
      <el-table-column prop="zone" :label="$t('topology.zone')" width="110" />
      <el-table-column prop="endpoint" :label="$t('topology.endpoint')" min-width="200" show-overflow-tooltip />
      <el-table-column :label="$t('topology.labels')" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">{{ fmtLabels(row.labels) }}</template>
      </el-table-column>
      <el-table-column :label="$t('topology.capabilities')" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.capabilities?.container" size="small" type="success" style="margin-right:2px">C</el-tag>
          <el-tag v-if="row.capabilities?.image" size="small" type="warning" style="margin-right:2px">I</el-tag>
          <el-tag v-if="row.capabilities?.network" size="small" style="margin-right:2px">N</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" :label="$t('topology.status')" width="70">
        <template #default="{ row }">
          <el-tag :type="row.status==='online'?'success':'danger'" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.createdAt')" width="150">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.actions')" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">{{ $t('table.edit') }}</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">{{ $t('table.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog.show" :title="dialog.isEdit ? $t('topology.editInstance') : $t('topology.createInstance')" width="620px" destroy-on-close>
      <el-form :model="form" label-width="120px">
        <el-form-item :label="$t('topology.instanceName')">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item :label="$t('topology.platform')">
            <el-select v-model="form.platform" style="width:100%" @change="onPlatformChange">
              <el-option v-for="p in ['alibaba','aws','podman','stub']" :key="p" :label="p" :value="p" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('topology.region')" required>
            <el-select v-model="form.region" :disabled="!form.platform" style="width:100%" filterable allow-create>
              <el-option v-for="r in regions" :key="r" :label="r" :value="r" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-form-item :label="$t('topology.zone')" required>
          <el-input v-model="form.zone" :placeholder="$t('topology.zoneHint')" />
          <div class="hint">{{ $t('topology.zoneHint') }}</div>
        </el-form-item>
        <el-form-item :label="$t('topology.endpoint')">
          <el-input v-model="form.endpoint" placeholder="http://192.168.1.1:8080" />
        </el-form-item>
        <el-form-item :label="$t('topology.credentialRef')">
          <el-select v-model="form.credentialRef" filterable allow-create clearable placeholder="Optional / 输入自定义" style="width:100%">
            <el-option v-for="c in creds" :key="c.id" :label="`${c.name} (${c.platform})`" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('topology.labels')">
          <el-input v-model="form.labelsStr" type="textarea" :rows="3" placeholder='{"instanceTypes":"ecs.g6.large,ecs.g7.large","networkDomain":"vlan-100"}' />
          <div class="hint">instanceTypes / networkDomain / faultDomain 等扩展信息放在 labels 中</div>
        </el-form-item>
        <el-form-item :label="$t('topology.capabilities')">
          <el-checkbox v-model="form.capContainer">Container</el-checkbox>
          <el-checkbox v-model="form.capImage">Image</el-checkbox>
          <el-checkbox v-model="form.capNetwork">Network</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.show=false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ dialog.isEdit ? $t('table.save') : $t('table.create') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const instances = ref<ComputeInstance[]>([])
const regions = ref<string[]>([])
const creds = ref<MaskedCredential[]>([])
const loadingRegions = ref(false)
const dialog = reactive({ show: false, isEdit: false, editId: '' })
const form = reactive({
  name: '', platform: '' as Platform | '', region: '', zone: '', endpoint: '',
  credentialRef: '', labelsStr: '',
  capContainer: true, capImage: true, capNetwork: false,
})

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }
function fmtLabels(labels?: Record<string, string>): string {
  if (!labels) return '-'
  return Object.entries(labels).map(([k, v]) => `${k}=${v}`).join('; ')
}
function buildLabels(): Record<string, string> | undefined {
  if (!form.labelsStr) return undefined
  try { return JSON.parse(form.labelsStr) } catch { return undefined }
}

function buildCapabilities() {
  const caps: InstanceCapabilities = {}
  if (form.capContainer) caps.container = true
  if (form.capImage) caps.image = true
  if (form.capNetwork) caps.network = true
  return caps
}

async function onPlatformChange() {
  form.region = ''
  regions.value = []
  if (!form.platform) return
  loadingRegions.value = true
  try {
    const pr = await api.topology.regions.list(form.platform) as any
    regions.value = pr?.regions ?? []
  } catch { /* ignore */ }
  finally { loadingRegions.value = false }
}

function openCreate() {
  dialog.isEdit = false; dialog.editId = ''
  form.name = ''; form.platform = ''; form.region = ''; form.zone = ''; form.endpoint = ''
  form.credentialRef = ''; form.labelsStr = ''
  form.capContainer = true; form.capImage = true; form.capNetwork = false
  dialog.show = true
}

function openEdit(row: ComputeInstance) {
  dialog.isEdit = true; dialog.editId = row.id
  form.name = row.name; form.platform = row.platform; form.region = row.region; form.zone = row.zone
  form.endpoint = row.endpoint; form.credentialRef = row.credentialRef || ''
  form.labelsStr = row.labels ? JSON.stringify(row.labels, null, 2) : ''
  form.capContainer = row.capabilities?.container ?? true
  form.capImage = row.capabilities?.image ?? true
  form.capNetwork = row.capabilities?.network ?? false
  dialog.show = true
}

async function fetchData() {
  loading.value = true
  try { instances.value = await api.topology.instances.list() }
  catch { ElMessage.error(t('topology.fetchFailed')) }
  finally { loading.value = false }
}

async function handleSave() {
  if (!form.name) { ElMessage.warning(t('topology.nameRequired')); return }
  if (!form.region) { ElMessage.warning(t('topology.region')); return }
  if (!form.zone) { ElMessage.warning(t('topology.zone')); return }
  saving.value = true
  try {
    const body: CreateInstanceInput = {
      name: form.name, platform: form.platform as Platform,
      region: form.region, zone: form.zone, endpoint: form.endpoint,
      credentialRef: form.credentialRef || undefined,
      labels: buildLabels(),
      capabilities: buildCapabilities(),
    }
    if (dialog.isEdit) {
      await api.topology.instances.update(dialog.editId, body as any)
      ElMessage.success(t('topology.updateSuccess'))
    } else {
      await api.topology.instances.create(body)
      ElMessage.success(t('topology.createSuccess'))
    }
    dialog.show = false; await fetchData()
  } catch { ElMessage.error(t('topology.actionFailed')) }
  finally { saving.value = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('topology.instanceDeleteConfirm'), t('table.confirm'))
    await api.topology.instances.delete(id)
    ElMessage.success(t('topology.deleteSuccess')); await fetchData()
  } catch { /* ignore */ }
}

onMounted(async () => {
  await fetchData()
  try { creds.value = await api.topology.credentials.list() } catch { /* ignore */ }
})
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.hint { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
</style>

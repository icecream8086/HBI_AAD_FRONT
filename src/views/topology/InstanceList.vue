<template>
  <div>
    <el-button
      text
      class="back"
      @click="$router.push('/dashboard')"
    >
      ← {{ $t('common.home') }}
    </el-button>
    <div class="page-head">
      <h2>{{ $t('topology.instanceTitle') }}</h2>
      <el-button
        type="primary"
        size="small"
        @click="openCreate"
      >
        {{ $t('topology.createInstance') }}
      </el-button>
    </div>

    <el-card class="filters">
      <el-form inline>
        <el-form-item :label="$t('topology.platform')">
          <el-select
            v-model="filter.platform"
            clearable
            :placeholder="$t('table.selectPlaceholder')"
            style="width:120px"
            @change="fetchData"
          >
            <el-option
              v-for="p in platforms"
              :key="p"
              :label="p"
              :value="p"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('topology.region')">
          <el-select
            v-model="filter.region"
            clearable
            :placeholder="$t('table.selectPlaceholder')"
            style="width:140px"
            @change="fetchData"
          >
            <el-option
              v-for="r in regionOptions"
              :key="r"
              :label="r"
              :value="r"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('topology.status')">
          <el-select
            v-model="filter.status"
            clearable
            :placeholder="$t('table.selectPlaceholder')"
            style="width:120px"
            @change="fetchData"
          >
            <el-option
              label="online"
              value="online"
            />
            <el-option
              label="offline"
              value="offline"
            />
            <el-option
              label="error"
              value="error"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilter">
            {{ $t('table.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table
      v-loading="loading"
      :data="instances"
      stripe
      :empty-text="$t('table.empty')"
    >
      <el-table-column
        prop="name"
        :label="$t('topology.instanceName')"
        min-width="120"
      />
      <el-table-column
        prop="platform"
        :label="$t('topology.platform')"
        width="80"
      >
        <template #default="{ row }">
          <el-tag size="small">
            {{ row.platform }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="region"
        :label="$t('topology.region')"
        width="130"
      />
      <el-table-column
        prop="zone"
        :label="$t('topology.zone')"
        width="110"
      />
      <el-table-column
        prop="endpoint"
        :label="$t('topology.endpoint')"
        min-width="200"
        show-overflow-tooltip
      />
      <el-table-column
        :label="$t('topology.labels')"
        min-width="200"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <el-tag
            v-for="(v, k) in row.labels"
            :key="k"
            size="small"
            style="margin:1px"
          >
            {{ k }}={{ v }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('topology.capabilities')"
        width="100"
      >
        <template #default="{ row }">
          <el-tag
            v-if="row.capabilities?.container"
            size="small"
            type="success"
            style="margin-right:2px"
          >
            C
          </el-tag>
          <el-tag
            v-if="row.capabilities?.image"
            size="small"
            type="warning"
            style="margin-right:2px"
          >
            I
          </el-tag>
          <el-tag
            v-if="row.capabilities?.network"
            size="small"
            style="margin-right:2px"
          >
            N
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="status"
        :label="$t('topology.status')"
        width="70"
      >
        <template #default="{ row }">
          <el-tag
            :type="statusTagType(row.status, colByProp('status'))"
            size="small"
          >
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('table.createdAt')"
        width="150"
      >
        <template #default="{ row }">
          {{ fmtCell(row.createdAt, colByProp('createdAt')) }}
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('table.actions')"
        width="160"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button
            size="small"
            @click="openEdit(row)"
          >
            {{ $t('table.edit') }}
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(row.id)"
          >
            {{ $t('table.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
     
      v-model:current-page="page"
      :page-size="limit"
      :total="total"
      layout="total, prev, pager, next"
      background
      small
      style="margin-top:16px;justify-content:center"
      @current-change="fetchData"
    />

    <el-dialog
      v-model="dialog.show"
      :title="dialog.isEdit ? $t('topology.editInstance') : $t('topology.createInstance')"
      width="620px"
      destroy-on-close
    >
      <el-form
        :model="form"
        label-width="120px"
      >
        <el-form-item :label="$t('topology.instanceName')">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item :label="$t('topology.platform')">
              <el-select
                v-model="form.platform"
                style="width:100%"
                @change="onPlatformChange"
              >
                <el-option
                  v-for="p in ['alibaba','aws','podman','stub']"
                  :key="p"
                  :label="p"
                  :value="p"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              :label="$t('topology.region')"
              required
            >
              <el-select
                v-model="form.region"
                :disabled="!form.platform"
                style="width:100%"
                filterable
                allow-create
              >
                <el-option
                  v-for="r in regions"
                  :key="r"
                  :label="r"
                  :value="r"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('topology.zone')">
          <el-input
            v-model="form.zone"
            :placeholder="$t('topology.zoneHint')"
          />
        </el-form-item>
        <el-form-item :label="$t('topology.endpoint')">
          <el-input
            v-model="form.endpoint"
            placeholder="http://192.168.1.1:8080"
          />
        </el-form-item>
        <el-form-item :label="$t('topology.credentialRef')">
          <el-select
            v-model="form.credentialRef"
            filterable
            allow-create
            clearable
            placeholder="Optional / 输入自定义"
            style="width:100%"
          >
            <el-option
              v-for="c in creds"
              :key="c.id"
              :label="`${c.name} (${c.platform})`"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('topology.labels')">
          <div
            v-for="(pair, i) in labelsEntries"
            :key="i"
            class="label-row"
          >
            <el-input
              v-model="pair.key"
              placeholder="Key"
              size="small"
              style="width:160px"
            />
            <span style="margin:0 4px">=</span>
            <el-input
              v-model="pair.value"
              placeholder="Value"
              size="small"
              style="width:200px"
            />
            <el-button
              type="danger"
              text
              size="small"
              :disabled="labelsEntries.length<=1"
              @click="removeLabel(i)"
            >
              ✕
            </el-button>
          </div>
          <el-button
            text
            size="small"
            class="add-label-btn"
            @click="addLabel"
          >
            + Add label
          </el-button>
          <div class="hint">
            扩展信息，如 networkDomain / instanceTypes / faultDomain
          </div>
        </el-form-item>
        <el-form-item :label="$t('topology.capabilities')">
          <el-checkbox v-model="form.capContainer">
            Container
          </el-checkbox>
          <el-checkbox v-model="form.capImage">
            Image
          </el-checkbox>
          <el-checkbox v-model="form.capNetwork">
            Network
          </el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.show=false">
          {{ $t('table.cancel') }}
        </el-button>
        <el-button
          type="primary"
          :loading="saving"
          @click="handleSave"
        >
          {{ dialog.isEdit ? $t('table.save') : $t('table.create') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api/typed'
import { useReferenceCache } from '../../composables/useReferenceCache'
import { instanceColumns } from '../../constants/field-descriptors'
import { useEntityColumns } from '../../composables/useEntityColumns'

const { t } = useI18n()
const refCache = useReferenceCache()
const { fmtCell, statusTagType, colByProp } = useEntityColumns(instanceColumns)

const loading = ref(false)
const saving = ref(false)
const instances = ref<ComputeInstance[]>([])
const creds = ref<MaskedCredential[]>([])
const regions = ref<string[]>([])
const loadingRegions = ref(false)
const dialog = reactive({ show: false, isEdit: false, editId: '' })

// Filters + pagination
const filter = reactive({ platform: '', region: '', status: '' })
const page = ref(1)
const limit = 20
const total = ref(0)

const platforms = ['alibaba', 'aws', 'podman', 'stub']
const regionOptions = computed(() => {
  const all = instances.value.map(i => i.region)
  return [...new Set(all)].sort()
})
const form = reactive({
  name: '', platform: '' as Platform | '', region: '', zone: '', endpoint: '',
  credentialRef: '',
  capContainer: true, capImage: true, capNetwork: false,
})
const labelsEntries = reactive<{ key: string; value: string }[]>([])

function addLabel(key = '', value = '') { labelsEntries.push({ key, value }) }
function removeLabel(i: number) { labelsEntries.splice(i, 1) }

function buildLabels(): Record<string, string> | undefined {
  const entries = labelsEntries.filter(e => e.key.trim())
  return entries.length ? Object.fromEntries(entries.map(e => [e.key.trim(), e.value])) : undefined
}

watch(() => form.platform, (p) => {
  if (p === 'podman' && !labelsEntries.some(e => e.key === 'networkDomain')) {
    addLabel('networkDomain', 'podman-default')
  }
})

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
    const res = await api.platforms.regions({ platform: form.platform })
    regions.value = (res.regions ?? []).map((r: { RegionId: string }) => r.RegionId)
  } catch (e) {
    console.error('Failed to load regions:', e)
  }
  finally { loadingRegions.value = false }
}

function resetLabels() {
  labelsEntries.length = 0
  addLabel()
}

function openCreate() {
  dialog.isEdit = false; dialog.editId = ''
  form.name = ''; form.platform = ''; form.region = ''; form.zone = ''; form.endpoint = ''
  form.credentialRef = ''
  form.capContainer = true; form.capImage = true; form.capNetwork = false
  resetLabels()
  dialog.show = true
}

function openEdit(row: ComputeInstance) {
  dialog.isEdit = true; dialog.editId = row.id
  form.name = row.name; form.platform = row.platform; form.region = row.region; form.zone = row.zone
  form.endpoint = row.endpoint; form.credentialRef = row.credentialRef || ''
  form.capContainer = row.capabilities?.container ?? true
  form.capImage = row.capabilities?.image ?? true
  form.capNetwork = row.capabilities?.network ?? false
  labelsEntries.length = 0
  if (row.labels) {
    Object.entries(row.labels).forEach(([k, v]) => addLabel(k, v))
  } else {
    addLabel()
  }
  dialog.show = true
}

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, limit }
    if (filter.platform) params.platform = filter.platform
    if (filter.region) params.region = filter.region
    if (filter.status) params.status = filter.status
    const res = await api.topology.instances.list(params)
    instances.value = (res.items ?? []) as ComputeInstance[]
    total.value = res.total ?? instances.value.length
  } catch { ElMessage.error(t('topology.fetchFailed')) }
  finally { loading.value = false }
}

function resetFilter() {
  filter.platform = ''; filter.region = ''; filter.status = ''
  page.value = 1; fetchData()
}

async function handleSave() {
  if (!form.name) { ElMessage.warning(t('topology.nameRequired')); return }
  if (!form.region) { ElMessage.warning(t('topology.region')); return }
  // zone 可选，ECI 自动跨可用区调度
  saving.value = true
  try {
    const body: CreateInstanceInput = {
      name: form.name, platform: form.platform as Platform,
      region: form.region, zone: form.zone || undefined, endpoint: form.endpoint,
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
  await refCache.credentials.load()
  creds.value = refCache.credentials.data.value as MaskedCredential[]
})
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.hint { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
.label-row { display: flex; align-items: center; margin-bottom: 6px; gap: 0; }
.add-label-btn { margin-top: 2px; }
.filters { margin-bottom: 16px; }
.filters :deep(.el-form-item) { margin-bottom: 0; }
</style>

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
      <h2>{{ $t('topology.volumeTitle') }}</h2>
      <el-button
        type="primary"
        size="small"
        @click="openCreate"
      >
        {{ $t('topology.createVolume') }}
      </el-button>
    </div>

    <el-card class="filters">
      <el-form inline>
        <el-form-item :label="$t('table.name')">
          <el-input
            v-model="filter.name"
            :placeholder="$t('table.name')"
            clearable
            style="width:160px"
            @clear="fetchData"
            @keyup.enter="fetchData"
          />
        </el-form-item>
        <el-form-item :label="$t('topology.instanceTitle')">
          <el-select
            v-model="filter.instanceId"
            clearable
            filterable
            :placeholder="$t('table.selectPlaceholder')"
            style="width:160px"
            @change="fetchData"
          >
            <el-option
              v-for="inst in instances"
              :key="inst.id"
              :label="`${inst.name} (${inst.platform})`"
              :value="inst.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('topology.volumeType')">
          <el-select
            v-model="filter.type"
            clearable
            :placeholder="$t('table.selectPlaceholder')"
            style="width:140px"
            @change="fetchData"
          >
            <el-option
              v-for="vt in volumeTypes"
              :key="vt"
              :label="typeLabel(vt)"
              :value="vt"
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
              label="Active"
              value="Active"
            />
            <el-option
              label="Detached"
              value="Detached"
            />
            <el-option
              label="Attached"
              value="Attached"
            />
            <el-option
              label="Orphaned"
              value="Orphaned"
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
      :data="volumes"
      stripe
      :empty-text="$t('table.empty')"
    >
      <el-table-column
        prop="name"
        :label="$t('topology.volumeName')"
        min-width="140"
      />
      <el-table-column
        :label="$t('topology.instanceTitle')"
        min-width="140"
      >
        <template #default="{ row }">
          {{ instanceName(row.instanceId) }}
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('topology.volumeType')"
        width="120"
      >
        <template #default="{ row }">
          <el-tag
            :type="typeTag(row.type)"
            size="small"
          >
            {{ typeLabel(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="status"
        :label="$t('topology.status')"
        width="80"
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
        width="160"
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
      :title="dialog.isEdit ? $t('topology.editVolume') : $t('topology.createVolume')"
      width="600px"
      destroy-on-close
    >
      <el-form
        :model="form"
        label-width="120px"
      >
        <el-form-item
          :label="$t('topology.volumeName')"
          required
        >
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('table.description')">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item
          :label="$t('topology.instanceTitle')"
          required
        >
          <el-select
            v-model="form.instanceId"
            filterable
            style="width:100%"
          >
            <el-option
              v-for="inst in instances"
              :key="inst.id"
              :label="`${inst.name} (${inst.platform}/${inst.region})`"
              :value="inst.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          :label="$t('topology.volumeType')"
          required
        >
          <el-select
            v-model="form.type"
            :disabled="dialog.isEdit"
            style="width:100%"
          >
            <el-option
              v-for="vt in volumeTypes"
              :key="vt"
              :label="typeLabel(vt)"
              :value="vt"
            />
          </el-select>
        </el-form-item>

        <!-- NFSVolume fields -->
        <template v-if="form.type === 'NFSVolume'">
          <el-form-item
            :label="$t('topology.nfsServer')"
            required
          >
            <el-input
              v-model="form.nfsServer"
              placeholder="192.168.1.100"
            />
          </el-form-item>
          <el-form-item
            :label="$t('topology.nfsPath')"
            required
          >
            <el-input
              v-model="form.nfsPath"
              placeholder="/data"
            />
          </el-form-item>
          <el-form-item :label="$t('topology.nfsReadOnly')">
            <el-switch v-model="form.nfsReadOnly" />
          </el-form-item>
          <el-form-item :label="$t('topology.credentialRef')">
            <el-select
              v-model="form.credentialRef"
              filterable
              clearable
              :placeholder="$t('table.selectPlaceholder')"
              style="width:100%"
            >
              <el-option
                v-for="c in creds"
                :key="c.name"
                :label="`${c.name} (${c.platform})`"
                :value="c.name"
              />
            </el-select>
          </el-form-item>
        </template>

        <!-- HostPathVolume / EmptyDirVolume: no extra fields -->

        <!-- DiskVolume fields -->
        <template v-if="form.type === 'DiskVolume'">
          <el-form-item
            :label="$t('topology.diskId')"
            required
          >
            <el-input v-model="form.diskId" />
          </el-form-item>
          <el-form-item
            :label="$t('topology.diskFsType')"
            required
          >
            <el-input
              v-model="form.diskFsType"
              placeholder="ext4"
            />
          </el-form-item>
          <el-form-item :label="$t('topology.diskSizeGiB')">
            <el-input-number
              v-model="form.diskSizeGiB"
              :min="0"
              style="width:100%"
            />
          </el-form-item>
          <el-form-item :label="$t('topology.diskReadOnly')">
            <el-switch v-model="form.diskReadOnly" />
          </el-form-item>
          <el-form-item :label="$t('topology.diskDeleteWithInstance')">
            <el-switch v-model="form.diskDeleteWithInstance" />
          </el-form-item>
        </template>

        <!-- ConfigMapVolume fields -->
        <template v-if="form.type === 'ConfigMapVolume'">
          <el-form-item
            :label="$t('topology.configMapName')"
            required
          >
            <el-input v-model="form.configMapName" />
          </el-form-item>
          <el-form-item :label="$t('topology.configMapItems')">
            <div
              v-for="(item, i) in configMapItems"
              :key="i"
              class="item-row"
            >
              <el-input
                v-model="item.key"
                :placeholder="$t('topology.configMapKey')"
                size="small"
                style="width:140px"
              />
              <el-input
                v-model="item.path"
                :placeholder="$t('topology.configMapPath')"
                size="small"
                style="width:200px"
              />
              <el-input-number
                v-model="item.mode"
                :min="0"
                :max="777"
                size="small"
                style="width:100px"
              />
              <el-button
                type="danger"
                text
                size="small"
                :disabled="configMapItems.length <= 1"
                @click="removeConfigMapItem(i)"
              >
                ✕
              </el-button>
            </div>
            <el-button
              text
              size="small"
              class="add-btn"
              @click="addConfigMapItem"
            >
              + {{ $t('topology.addItem') }}
            </el-button>
          </el-form-item>
        </template>

        <!-- SecretVolume fields -->
        <template v-if="form.type === 'SecretVolume'">
          <el-form-item
            :label="$t('topology.secretName')"
            required
          >
            <el-input v-model="form.secretName" />
          </el-form-item>
          <el-form-item :label="$t('topology.configMapItems')">
            <div
              v-for="(item, i) in secretItems"
              :key="i"
              class="item-row"
            >
              <el-input
                v-model="item.key"
                :placeholder="$t('topology.configMapKey')"
                size="small"
                style="width:140px"
              />
              <el-input
                v-model="item.path"
                :placeholder="$t('topology.configMapPath')"
                size="small"
                style="width:200px"
              />
              <el-input-number
                v-model="item.mode"
                :min="0"
                :max="777"
                size="small"
                style="width:100px"
              />
              <el-button
                type="danger"
                text
                size="small"
                :disabled="secretItems.length <= 1"
                @click="removeSecretItem(i)"
              >
                ✕
              </el-button>
            </div>
            <el-button
              text
              size="small"
              class="add-btn"
              @click="addSecretItem"
            >
              + {{ $t('topology.addItem') }}
            </el-button>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialog.show = false">
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
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api/typed'
import { useReferenceCache } from '../../composables/useReferenceCache'
import { volumeColumns } from '../../constants/field-descriptors'
import { useEntityColumns } from '../../composables/useEntityColumns'

const { t } = useI18n()
const refCache = useReferenceCache()
const { fmtCell, statusTagType, colByProp } = useEntityColumns(volumeColumns)

const loading = ref(false)
const saving = ref(false)
const volumes = ref<Volume[]>([])
const instances = ref<ComputeInstance[]>([])
const creds = ref<MaskedCredential[]>([])
const page = ref(1)
const limit = 20
const total = ref(0)
const filter = reactive({ name: '', instanceId: '', type: '' as VolumeType | '', status: '' })

const volumeTypes: VolumeType[] = ['NFSVolume', 'HostPathVolume', 'EmptyDirVolume', 'DiskVolume', 'ConfigMapVolume', 'SecretVolume']

const typeLabels: Record<VolumeType, string> = {
  NFSVolume: t('topology.volumeTypeNFS'),
  HostPathVolume: t('topology.volumeTypeHostPath'),
  EmptyDirVolume: t('topology.volumeTypeEmptyDir'),
  DiskVolume: t('topology.volumeTypeDisk'),
  ConfigMapVolume: t('topology.volumeTypeConfigMap'),
  SecretVolume: t('topology.volumeTypeSecret'),
}

const typeTags: Record<VolumeType, string> = {
  NFSVolume: '',
  HostPathVolume: 'success',
  EmptyDirVolume: 'warning',
  DiskVolume: 'info',
  ConfigMapVolume: 'primary',
  SecretVolume: 'danger',
}

function typeLabel(t: VolumeType) { return typeLabels[t] || t }
function typeTag(t: VolumeType) { return typeTags[t] || '' }

const dialog = reactive({ show: false, isEdit: false, editId: '' })
const form = reactive({
  name: '', description: '', instanceId: '', credentialRef: '',
  type: '' as VolumeType | '',
  // NFS
  nfsServer: '', nfsPath: '', nfsReadOnly: false,
  // Disk
  diskId: '', diskFsType: 'ext4', diskSizeGiB: 0, diskReadOnly: false, diskDeleteWithInstance: false,
  // ConfigMap
  configMapName: '',
  // Secret
  secretName: '',
})

const configMapItems = reactive<{ key: string; path: string; mode: number }[]>([])
const secretItems = reactive<{ key: string; path: string; mode: number }[]>([])

function addConfigMapItem(key = '', path = '', mode = 0o644) {
  configMapItems.push({ key, path, mode })
}
function removeConfigMapItem(i: number) { configMapItems.splice(i, 1) }

function addSecretItem(key = '', path = '', mode = 0o644) {
  secretItems.push({ key, path, mode })
}
function removeSecretItem(i: number) { secretItems.splice(i, 1) }

function instanceName(id: string | undefined) {
  if (!id) return '-'
  const inst = instances.value.find(i => i.id === id)
  return inst ? `${inst.name} (${inst.platform})` : id.slice(0, 12)
}

function resetForm() {
  form.name = ''; form.description = ''; form.instanceId = ''; form.credentialRef = ''; form.type = ''
  form.nfsServer = ''; form.nfsPath = ''; form.nfsReadOnly = false
  form.diskId = ''; form.diskFsType = 'ext4'; form.diskSizeGiB = 0
  form.diskReadOnly = false; form.diskDeleteWithInstance = false
  form.configMapName = ''; form.secretName = ''
  configMapItems.length = 0; addConfigMapItem()
  secretItems.length = 0; addSecretItem()
}

function openCreate() {
  dialog.isEdit = false; dialog.editId = ''
  resetForm(); dialog.show = true
}

function openEdit(row: Volume) {
  dialog.isEdit = true; dialog.editId = row.id
  form.name = row.name; form.description = row.description || ''; form.instanceId = row.instanceId; form.credentialRef = row.credentialRef || ''; form.type = row.type
  // NFS
  form.nfsServer = row.nfs?.server || ''
  form.nfsPath = row.nfs?.path || ''
  form.nfsReadOnly = row.nfs?.readOnly || false
  // Disk
  form.diskId = row.disk?.diskId || ''
  form.diskFsType = row.disk?.fsType || 'ext4'
  form.diskSizeGiB = row.disk?.sizeGiB || 0
  form.diskReadOnly = row.disk?.readOnly || false
  form.diskDeleteWithInstance = row.disk?.deleteWithInstance || false
  // ConfigMap
  form.configMapName = row.configMap?.name || ''
  configMapItems.length = 0
  if (row.configMap?.items?.length) {
    row.configMap.items.forEach(i => addConfigMapItem(i.key, i.path, i.mode ?? 0o644))
  } else {
    addConfigMapItem()
  }
  // Secret
  form.secretName = row.secret?.name || ''
  secretItems.length = 0
  if (row.secret?.items?.length) {
    row.secret.items.forEach(i => addSecretItem(i.key, i.path, i.mode ?? 0o644))
  } else {
    addSecretItem()
  }
  dialog.show = true
}

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, limit }
    if (filter.name) params.name = filter.name
    if (filter.instanceId) params.instanceId = filter.instanceId
    if (filter.type) params.type = filter.type
    if (filter.status) params.status = filter.status
    const res = await api.topology.volumes.list(params)
    volumes.value = (res.items ?? []) as Volume[]
    total.value = res.total ?? volumes.value.length
  } catch { ElMessage.error(t('topology.fetchFailed')) }
  finally { loading.value = false }
}

function resetFilter() {
  filter.name = ''; filter.instanceId = ''; filter.type = ''; filter.status = ''
  page.value = 1; fetchData()
}

function buildBody(): CreateVolumeInput {
  const body: CreateVolumeInput = { name: form.name, description: form.description || undefined, instanceId: form.instanceId, type: form.type as VolumeType }
  switch (form.type) {
    case 'NFSVolume':
      body.nfs = { server: form.nfsServer, path: form.nfsPath, readOnly: form.nfsReadOnly || undefined }
      if (form.credentialRef) body.credentialRef = form.credentialRef
      break
    case 'DiskVolume':
      body.disk = {
        diskId: form.diskId, fsType: form.diskFsType,
        sizeGiB: form.diskSizeGiB || undefined,
        readOnly: form.diskReadOnly || undefined,
        deleteWithInstance: form.diskDeleteWithInstance || undefined,
      }
      break
    case 'ConfigMapVolume': {
      const items = configMapItems.filter(i => i.key && i.path)
      body.configMap = { name: form.configMapName, items: items.length ? items : undefined }
      break
    }
    case 'SecretVolume': {
      const items = secretItems.filter(i => i.key && i.path)
      body.secret = { name: form.secretName, items: items.length ? items : undefined }
      break
    }
  }
  return body
}

function validate(): boolean {
  if (!form.name) { ElMessage.warning(t('topology.nameRequired')); return false }
  if (!form.instanceId) { ElMessage.warning(t('topology.instanceTitle')); return false }
  if (!form.type) { ElMessage.warning(t('topology.volumeType')); return false }
  if (form.type === 'NFSVolume') {
    if (!form.nfsServer) { ElMessage.warning(t('topology.nfsServer')); return false }
    if (!form.nfsPath) { ElMessage.warning(t('topology.nfsPath')); return false }
  }
  if (form.type === 'DiskVolume') {
    if (!form.diskId) { ElMessage.warning(t('topology.diskId')); return false }
    if (!form.diskFsType) { ElMessage.warning(t('topology.diskFsType')); return false }
  }
  if (form.type === 'ConfigMapVolume' && !form.configMapName) {
    ElMessage.warning(t('topology.configMapName')); return false
  }
  if (form.type === 'SecretVolume' && !form.secretName) {
    ElMessage.warning(t('topology.secretName')); return false
  }
  return true
}

async function handleSave() {
  if (!validate()) return
  saving.value = true
  try {
    if (dialog.isEdit) {
      await api.topology.volumes.update(dialog.editId, buildBody() as UpdateVolumeInput)
      ElMessage.success(t('topology.updateSuccess'))
    } else {
      await api.topology.volumes.create(buildBody())
      ElMessage.success(t('topology.createSuccess'))
    }
    dialog.show = false; await fetchData()
  } catch { ElMessage.error(t('topology.actionFailed')) }
  finally { saving.value = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('topology.volumeDeleteConfirm'), t('table.confirm'))
    await api.topology.volumes.delete(id)
    ElMessage.success(t('topology.deleteSuccess')); await fetchData()
  } catch { /* ignore */ }
}

onMounted(async () => {
  await Promise.all([refCache.instances.load(), refCache.credentials.load()])
  instances.value = refCache.instances.data.value
  creds.value = refCache.credentials.data.value as MaskedCredential[]
  await fetchData()
})
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { margin-bottom: 16px; }
.filters :deep(.el-form-item) { margin-bottom: 0; }
.item-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.add-btn { margin-top: 2px; }
</style>

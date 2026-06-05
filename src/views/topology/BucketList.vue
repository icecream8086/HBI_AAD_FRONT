<template>
  <div>
    <el-button text @click="$router.push('/dashboard')" class="back">← {{ $t('common.home') }}</el-button>
    <div class="page-head">
      <h2>{{ $t('topology.bucketTitle') }}</h2>
      <el-button type="primary" size="small" @click="openCreate">{{ $t('topology.createBucket') }}</el-button>
    </div>

    <el-table :data="buckets" v-loading="loading" stripe :empty-text="$t('table.empty')">
      <el-table-column prop="name" :label="$t('topology.bucketName')" min-width="140" />
      <el-table-column :label="$t('topology.instanceTitle')" min-width="160">
        <template #default="{ row }">{{ fmtInstance(row.instanceId) }}</template>
      </el-table-column>
      <el-table-column prop="bucketType" :label="$t('topology.bucketType')" width="120">
        <template #default="{ row }"><el-tag size="small">{{ row.bucketType }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="credentialRef" :label="$t('topology.credentialRef')" width="130" />
      <el-table-column prop="status" :label="$t('topology.status')" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status==='Active'?'success':'info'" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.createdAt')" width="160">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.actions')" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">{{ $t('table.edit') }}</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">{{ $t('table.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog.show" :title="dialog.isEdit ? $t('topology.editBucket') : $t('topology.createBucket')" width="500px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item :label="$t('topology.bucketName')">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('topology.instanceTitle')" required>
          <el-select v-model="form.instanceId" filterable style="width:100%">
            <el-option v-for="inst in instances" :key="inst.id" :label="`${inst.name} (${inst.platform}/${inst.region})`" :value="inst.id" />
          </el-select>
          <div v-if="selectedInst" class="inherit-hint">
            ← {{ selectedInst.platform }} · {{ selectedInst.region }} · {{ selectedInst.endpoint }}
          </div>
        </el-form-item>
        <el-form-item :label="$t('topology.bucketType')">
          <el-select v-model="form.bucketType" style="width:100%">
            <el-option label="aws-s3" value="aws-s3" />
            <el-option label="alibaba-oss" value="alibaba-oss" />
            <el-option label="cloudflare-r2" value="cloudflare-r2" />
            <el-option label="minio" value="minio" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('topology.credentialRef')">
          <el-select v-model="form.credentialRef" filterable clearable placeholder="Optional — inherit from instance" style="width:100%">
            <el-option v-for="c in creds" :key="c.name" :label="`${c.name} (${c.platform})`" :value="c.name" />
          </el-select>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'
import { useReferenceCache } from '../../composables/useReferenceCache'

const { t } = useI18n()
const refCache = useReferenceCache()

const loading = ref(false)
const saving = ref(false)
const buckets = ref<RegionBucket[]>([])
const instances = ref<ComputeInstance[]>([])
const dialog = reactive({ show: false, isEdit: false, editId: '' })
const creds = ref<MaskedCredential[]>([])
const form = reactive({
  name: '', bucketType: '' as RegionBucketType | '', instanceId: '', credentialRef: '',
})

const instMap = computed(() => {
  const m: Record<string, ComputeInstance> = {}
  for (const inst of instances.value) m[inst.id] = inst
  return m
})

const selectedInst = computed(() => form.instanceId ? instMap.value[form.instanceId] : null)

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }
function fmtInstance(id: string) {
  const inst = instMap.value[id]
  return inst ? `${inst.name} (${inst.platform})` : id.slice(0, 12)
}

function openCreate() {
  dialog.isEdit = false; dialog.editId = ''
  form.name = ''; form.bucketType = ''; form.instanceId = ''; form.credentialRef = ''
  dialog.show = true
}

function openEdit(row: RegionBucket) {
  dialog.isEdit = true; dialog.editId = row.id
  form.name = row.name; form.bucketType = row.bucketType; form.instanceId = row.instanceId
  form.credentialRef = row.credentialRef || ''
  dialog.show = true
}

async function fetchData() {
  loading.value = true
  try { buckets.value = await api.topology.buckets.list() }
  catch { ElMessage.error(t('topology.fetchFailed')) }
  finally { loading.value = false }
}

async function handleSave() {
  if (!form.name) { ElMessage.warning(t('topology.nameRequired')); return }
  if (!form.instanceId) { ElMessage.warning(t('topology.nameRequired')); return }
  saving.value = true
  try {
    if (dialog.isEdit) {
      const upd: Record<string, any> = { name: form.name, instanceId: form.instanceId }
      if (form.credentialRef) upd.credentialRef = form.credentialRef
      else upd.credentialRef = null
      await api.topology.buckets.update(dialog.editId, upd)
      ElMessage.success(t('topology.updateSuccess'))
    } else {
      const body: Record<string, any> = {
        name: form.name,
        bucketType: form.bucketType as RegionBucketType,
        instanceId: form.instanceId,
      }
      if (form.credentialRef) body.credentialRef = form.credentialRef
      await api.topology.buckets.create(body as CreateBucketInput)
      ElMessage.success(t('topology.createSuccess'))
    }
    dialog.show = false; await fetchData()
  } catch { ElMessage.error(t('topology.actionFailed')) }
  finally { saving.value = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('topology.bucketDeleteConfirm'), t('table.confirm'))
    await api.topology.buckets.delete(id)
    ElMessage.success(t('topology.deleteSuccess')); await fetchData()
  } catch { /* ignore */ }
}

onMounted(async () => {
  await fetchData()
  await Promise.all([refCache.instances.load(), refCache.credentials.load()])
  instances.value = refCache.instances.data.value
  creds.value = refCache.credentials.data.value as MaskedCredential[]
})
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.inherit-hint { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
</style>

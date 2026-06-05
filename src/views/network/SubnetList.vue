<template>
  <div>
    <el-button text @click="$router.push('/dashboard')" class="back">← {{ $t('common.home') }}</el-button>
    <div class="page-head">
      <h2>{{ $t('subnet.title') }}</h2>
      <el-button type="primary" size="small" @click="openCreate">{{ $t('subnet.create') }}</el-button>
    </div>

    <el-table :data="items" v-loading="loading" stripe :empty-text="$t('table.empty')">
      <el-table-column prop="name" :label="$t('subnet.name')" min-width="140" />
      <el-table-column prop="cidr" :label="$t('subnet.cidr')" width="130" />
      <el-table-column prop="subnetPrefix" :label="$t('subnet.subnetPrefix')" width="100" />
      <el-table-column :label="$t('topology.instanceTitle')" min-width="140">
        <template #default="{ row }">{{ fmtInstance(row.instanceId) }}</template>
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

    <el-dialog v-model="dialog.show" :title="dialog.isEdit ? $t('subnet.edit') : $t('subnet.create')" width="520px" destroy-on-close>
      <el-form :model="form" label-width="110px">
        <el-form-item :label="$t('subnet.name')">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('subnet.cidr')" required>
          <el-input v-model="form.cidr" :placeholder="$t('subnet.cidrPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('subnet.subnetPrefix')">
          <el-input-number v-model="form.subnetPrefix" :min="16" :max="28" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('topology.instanceTitle')" required>
          <el-select v-model="form.instanceId" filterable style="width:100%">
            <el-option v-for="inst in instances" :key="inst.id" :label="`${inst.name} (${inst.platform}/${inst.region})`" :value="inst.id" />
          </el-select>
          <div v-if="selectedInst" class="inherit-hint">← {{ selectedInst.platform }} · {{ selectedInst.region }}</div>
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
const items = ref<Subnet[]>([])
const instances = ref<ComputeInstance[]>([])
const dialog = reactive({ show: false, isEdit: false, editId: '' })
const form = reactive({
  name: '', cidr: '', subnetPrefix: 24, instanceId: '',
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
  form.name = ''; form.cidr = ''; form.subnetPrefix = 24; form.instanceId = ''
  dialog.show = true
}

function openEdit(row: Subnet) {
  dialog.isEdit = true; dialog.editId = row.id
  form.name = row.name; form.cidr = row.cidr; form.subnetPrefix = row.subnetPrefix; form.instanceId = row.instanceId
  dialog.show = true
}

async function fetchData() {
  loading.value = true
  try {
    const res = await api.subnets.list()
    const data = (res.data as any)?.data
    items.value = data?.items ?? (Array.isArray(data) ? data : [])
  } catch { ElMessage.error(t('subnet.fetchFailed')) }
  finally { loading.value = false }
}

async function handleSave() {
  if (!form.name) { ElMessage.warning(t('subnet.nameRequired')); return }
  if (!form.cidr) { ElMessage.warning(t('subnet.cidrRequired')); return }
  if (!form.instanceId) { ElMessage.warning(t('topology.nameRequired')); return }
  saving.value = true
  try {
    if (dialog.isEdit) {
      await api.subnets.update(dialog.editId, { name: form.name, cidr: form.cidr, subnetPrefix: form.subnetPrefix } as UpdateSubnetInput)
      ElMessage.success(t('subnet.updateSuccess'))
    } else {
      await api.subnets.create({ name: form.name, cidr: form.cidr, subnetPrefix: form.subnetPrefix, instanceId: form.instanceId } as CreateSubnetInput)
      ElMessage.success(t('subnet.createSuccess'))
    }
    dialog.show = false; await fetchData()
  } catch { ElMessage.error(t('subnet.actionFailed')) }
  finally { saving.value = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('subnet.deleteConfirm'), t('table.confirm'))
    await api.subnets.delete(id)
    ElMessage.success(t('subnet.deleteSuccess')); await fetchData()
  } catch { /* ignore */ }
}

onMounted(async () => {
  await fetchData()
  await refCache.instances.load()
  instances.value = refCache.instances.data.value
})
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.inherit-hint { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
</style>

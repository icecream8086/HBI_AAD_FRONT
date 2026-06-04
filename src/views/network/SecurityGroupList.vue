<template>
  <div>
    <el-button text @click="$router.push('/dashboard')" class="back">← {{ $t('common.home') }}</el-button>
    <div class="page-head">
      <h2>{{ $t('securityGroup.title') }}</h2>
      <el-button type="primary" size="small" @click="openCreate">{{ $t('securityGroup.create') }}</el-button>
    </div>

    <el-table :data="items" v-loading="loading" stripe :empty-text="$t('table.empty')">
      <el-table-column prop="name" :label="$t('securityGroup.name')" min-width="140" />
      <el-table-column prop="securityGroupId" :label="$t('topology.securityGroupId')" width="140" />
      <el-table-column :label="$t('topology.instanceTitle')" min-width="140">
        <template #default="{ row }">{{ fmtInstance(row.instanceId) }}</template>
      </el-table-column>
      <el-table-column prop="visibility" :label="$t('securityGroup.visibility')" width="80">
        <template #default="{ row }">
          <el-tag :type="row.visibility==='public'?'success':'info'" size="small">{{ row.visibility }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('securityGroup.rules')" width="100">
        <template #default="{ row }">{{ row.rules?.length ?? 0 }}</template>
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

    <el-dialog v-model="dialog.show" :title="dialog.isEdit ? $t('securityGroup.edit') : $t('securityGroup.create')" width="520px" destroy-on-close>
      <el-form :model="form" label-width="110px">
        <el-form-item :label="$t('securityGroup.name')">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('topology.instanceTitle')" required>
          <el-select v-model="form.instanceId" filterable style="width:100%">
            <el-option v-for="inst in instances" :key="inst.id" :label="`${inst.name} (${inst.platform}/${inst.region})`" :value="inst.id" />
          </el-select>
          <div v-if="selectedInst" class="inherit-hint">← {{ selectedInst.platform }} · {{ selectedInst.region }}</div>
        </el-form-item>
        <el-form-item :label="$t('topology.securityGroupId')">
          <el-input v-model="form.securityGroupId" placeholder="sg-xxx" />
        </el-form-item>
        <el-form-item :label="$t('securityGroup.visibility')">
          <el-radio-group v-model="form.visibility">
            <el-radio value="public">public</el-radio>
            <el-radio value="private">private</el-radio>
          </el-radio-group>
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

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const items = ref<SecurityGroup[]>([])
const instances = ref<ComputeInstance[]>([])
const dialog = reactive({ show: false, isEdit: false, editId: '' })
const form = reactive({
  name: '', instanceId: '', securityGroupId: '', visibility: 'private' as 'public' | 'private',
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
  form.name = ''; form.instanceId = ''; form.securityGroupId = ''; form.visibility = 'private'
  dialog.show = true
}

function openEdit(row: SecurityGroup) {
  dialog.isEdit = true; dialog.editId = row.id
  form.name = row.name; form.instanceId = row.instanceId; form.securityGroupId = row.securityGroupId || ''
  form.visibility = row.visibility
  dialog.show = true
}

async function fetchData() {
  loading.value = true
  try {
    const res = await api.securityGroups.list()
    const data = (res.data as any)?.data
    items.value = data?.items ?? (Array.isArray(data) ? data : [])
  } catch { ElMessage.error(t('securityGroup.fetchFailed')) }
  finally { loading.value = false }
}

async function handleSave() {
  if (!form.name) { ElMessage.warning(t('securityGroup.nameRequired')); return }
  if (!form.instanceId) { ElMessage.warning(t('topology.nameRequired')); return }
  saving.value = true
  try {
    const body: CreateSecurityGroupInput = { name: form.name, instanceId: form.instanceId, visibility: form.visibility }
    if (form.securityGroupId) body.securityGroupId = form.securityGroupId
    if (dialog.isEdit) {
      await api.securityGroups.update(dialog.editId, { name: form.name, visibility: form.visibility } as UpdateSecurityGroupInput)
      ElMessage.success(t('securityGroup.updateSuccess'))
    } else {
      await api.securityGroups.create(body)
      ElMessage.success(t('securityGroup.createSuccess'))
    }
    dialog.show = false; await fetchData()
  } catch { ElMessage.error(t('securityGroup.actionFailed')) }
  finally { saving.value = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('securityGroup.deleteConfirm'), t('table.confirm'))
    await api.securityGroups.delete(id)
    ElMessage.success(t('securityGroup.deleteSuccess')); await fetchData()
  } catch { /* ignore */ }
}

onMounted(async () => {
  await fetchData()
  try { instances.value = await api.topology.instances.list() } catch { /* ignore */ }
})
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.inherit-hint { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
</style>

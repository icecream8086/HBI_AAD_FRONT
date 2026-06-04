<template>
  <div>
    <el-button text @click="$router.push('/dashboard')" class="back">← {{ $t('common.home') }}</el-button>
    <div class="page-head">
      <h2>{{ $t('topology.credentialTitle') }}</h2>
      <el-button type="primary" size="small" @click="openCreate">{{ $t('topology.createCredential') }}</el-button>
    </div>

    <el-table :data="creds" v-loading="loading" stripe :empty-text="$t('table.empty')">
      <el-table-column prop="name" :label="$t('topology.credentialName')" min-width="140" />
      <el-table-column prop="platform" :label="$t('topology.platform')" width="80">
        <template #default="{ row }"><el-tag size="small">{{ row.platform }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="accessKeyId" :label="$t('topology.accessKeyId')" width="180" />
      <el-table-column prop="accessKeySecret" :label="$t('topology.accessKeySecret')" width="140">
        <template #default="{ row }"><code class="masked">{{ row.accessKeySecret }}</code></template>
      </el-table-column>
      <el-table-column prop="status" :label="$t('topology.status')" width="70">
        <template #default="{ row }">
          <el-tag :type="row.status==='active'?'success':'info'" size="small">{{ row.status }}</el-tag>
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

    <el-dialog v-model="dialog.show" :title="dialog.isEdit ? $t('topology.editCredential') : $t('topology.createCredential')" width="550px" destroy-on-close>
      <el-form :model="form" label-width="140px">
        <el-form-item :label="$t('topology.credentialName')">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('topology.platform')">
          <el-select v-model="form.platform" style="width:100%">
            <el-option v-for="p in ['alibaba','aws','podman','stub']" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('topology.accessKeyId')">
          <el-input v-model="form.accessKeyId" />
        </el-form-item>
        <el-form-item :label="$t('topology.accessKeySecret')">
          <el-input v-model="form.accessKeySecret" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item :label="$t('topology.instanceTitle')">
          <el-select v-model="form.instanceId" filterable clearable placeholder="Optional" style="width:100%">
            <el-option v-for="inst in instances" :key="inst.id" :label="`${inst.name} (${inst.platform}/${inst.region})`" :value="inst.id" />
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
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const creds = ref<MaskedCredential[]>([])
const instances = ref<ComputeInstance[]>([])
const dialog = reactive({ show: false, isEdit: false, editId: '' })
const form = reactive({
  name: '', platform: '' as Platform | '', accessKeyId: '', accessKeySecret: '', instanceId: '',
})

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

function openCreate() {
  dialog.isEdit = false; dialog.editId = ''
  form.name = ''; form.platform = ''; form.accessKeyId = ''; form.accessKeySecret = ''; form.instanceId = ''
  dialog.show = true
}

function openEdit(row: MaskedCredential) {
  dialog.isEdit = true; dialog.editId = row.id
  form.name = row.name; form.platform = row.platform; form.accessKeyId = row.accessKeyId
  form.accessKeySecret = ''; form.instanceId = row.instanceId || ''
  dialog.show = true
  // accessKeySecret intentionally blank — backend masks it, user must re-enter
  ElMessage.info('AccessKey Secret is masked. Re-enter to update.')
}

async function fetchData() {
  loading.value = true
  try { creds.value = await api.topology.credentials.list() }
  catch { ElMessage.error(t('topology.fetchFailed')) }
  finally { loading.value = false }
}

async function handleSave() {
  if (!form.name) { ElMessage.warning(t('topology.nameRequired')); return }
  saving.value = true
  try {
    if (dialog.isEdit) {
      const body: UpdateCredentialInput = { name: form.name }
      if (form.accessKeySecret) body.accessKeySecret = form.accessKeySecret
      if (form.instanceId) body.instanceId = form.instanceId
      await api.topology.credentials.update(dialog.editId, body)
      ElMessage.success(t('topology.updateSuccess'))
    } else {
      await api.topology.credentials.create({
        name: form.name,
        platform: form.platform as Platform,
        accessKeyId: form.accessKeyId,
        accessKeySecret: form.accessKeySecret,
        instanceId: form.instanceId || undefined,
      })
      ElMessage.success(t('topology.createSuccess'))
    }
    dialog.show = false; await fetchData()
  } catch { ElMessage.error(t('topology.actionFailed')) }
  finally { saving.value = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('topology.credentialDeleteConfirm'), t('table.confirm'))
    await api.topology.credentials.delete(id)
    ElMessage.success(t('topology.deleteSuccess')); await fetchData()
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
.masked { font-family: monospace; background: var(--el-bg-color-page); padding: 2px 6px; border-radius: 3px; }
</style>

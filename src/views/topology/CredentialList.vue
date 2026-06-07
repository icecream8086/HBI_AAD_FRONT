<template>
  <div>
    <el-button text @click="$router.push('/dashboard')" class="back">← {{ $t('common.home') }}</el-button>
    <div class="page-head">
      <h2>{{ $t('topology.credentialTitle') }}</h2>
      <el-button type="primary" size="small" @click="openCreate">{{ $t('topology.createCredential') }}</el-button>
    </div>

    <el-card class="filters">
      <el-form inline>
        <el-form-item :label="$t('topology.platform')">
          <el-select v-model="filter.platform" clearable :placeholder="$t('table.selectPlaceholder')" style="width:120px" @change="fetchData">
            <el-option label="alibaba" value="alibaba" /><el-option label="aws" value="aws" /><el-option label="podman" value="podman" /><el-option label="stub" value="stub" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilter">{{ $t('table.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="creds" v-loading="loading" stripe :empty-text="$t('table.empty')">
      <el-table-column prop="name" :label="$t('topology.credentialName')" min-width="140" />
      <el-table-column :label="$t('topology.credentialType')" width="100">
        <template #default="{ row }">
          <el-tag :type="typeTag(row.type)" size="small">{{ typeLabel(row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="platform" :label="$t('topology.platform')" width="80">
        <template #default="{ row }"><el-tag size="small">{{ row.platform }}</el-tag></template>
      </el-table-column>
      <el-table-column :label="$t('topology.accessKeyId')" width="180" v-if="anyAksk">
        <template #default="{ row }">{{ row.type === 'aksk' ? row.accessKeyId : '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('topology.username')" width="140" v-if="anyPassword">
        <template #default="{ row }">{{ row.type === 'password' ? row.username : '-' }}</template>
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
        <el-form-item :label="$t('topology.credentialType')" required>
          <el-radio-group v-model="form.type" :disabled="dialog.isEdit">
            <el-radio-button value="aksk">AK/SK</el-radio-button>
            <el-radio-button value="token">Token</el-radio-button>
            <el-radio-button value="password">{{ $t('topology.password') }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('topology.platform')">
          <el-select v-model="form.platform" style="width:100%">
            <el-option v-for="p in ['alibaba','aws','podman','stub']" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>

        <!-- AK/SK fields -->
        <template v-if="form.type === 'aksk'">
          <el-form-item :label="$t('topology.accessKeyId')">
            <el-input v-model="form.accessKeyId" />
          </el-form-item>
          <el-form-item :label="$t('topology.accessKeySecret')">
            <el-input v-model="form.accessKeySecret" type="textarea" :rows="2" />
          </el-form-item>
        </template>

        <!-- Token field -->
        <template v-if="form.type === 'token'">
          <el-form-item :label="$t('topology.token')">
            <el-input v-model="form.token" type="textarea" :rows="2" />
          </el-form-item>
        </template>

        <!-- Password fields -->
        <template v-if="form.type === 'password'">
          <el-form-item :label="$t('topology.username')">
            <el-input v-model="form.username" />
          </el-form-item>
          <el-form-item :label="$t('topology.password')">
            <el-input v-model="form.password" type="textarea" :rows="2" />
          </el-form-item>
        </template>

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
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'
import { useReferenceCache } from '../../composables/useReferenceCache'

const { t } = useI18n()
const refCache = useReferenceCache()

const loading = ref(false)
const saving = ref(false)
const creds = ref<MaskedCredential[]>([])
const instances = ref<ComputeInstance[]>([])
const dialog = reactive({ show: false, isEdit: false, editId: '' })

// Filters
const filter = reactive({ platform: '' })
const form = reactive({
  name: '', type: 'aksk' as CredentialType, platform: '' as Platform | '',
  accessKeyId: '', accessKeySecret: '', token: '', username: '', password: '', instanceId: '',
})

const anyAksk = computed(() => creds.value.some(c => c.type === 'aksk'))
const anyPassword = computed(() => creds.value.some(c => c.type === 'password'))

const typeLabels: Record<CredentialType, string> = { aksk: 'AK/SK', token: 'Token', password: 'Password' }
function typeLabel(t: CredentialType) { return typeLabels[t] }
function typeTag(t: CredentialType): 'primary' | 'warning' | '' {
  if (t === 'aksk') return 'primary'
  if (t === 'token') return 'warning'
  return ''
}

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

function resetForm() {
  form.name = ''; form.type = 'aksk'; form.platform = ''
  form.accessKeyId = ''; form.accessKeySecret = ''; form.token = ''
  form.username = ''; form.password = ''; form.instanceId = ''
}

function openCreate() {
  dialog.isEdit = false; dialog.editId = ''
  resetForm()
  dialog.show = true
}

function openEdit(row: MaskedCredential) {
  dialog.isEdit = true; dialog.editId = row.id
  form.name = row.name
  form.type = row.type
  form.platform = row.platform
  form.accessKeyId = row.accessKeyId || ''
  form.accessKeySecret = ''
  form.token = ''
  form.username = row.username || ''
  form.password = ''
  form.instanceId = row.instanceId || ''
  dialog.show = true

  const hints: Record<CredentialType, string> = {
    aksk: t('topology.accessKeySecret'),
    token: t('topology.token'),
    password: t('topology.password'),
  }
  ElMessage.info(`${hints[row.type]} is masked. Re-enter to update.`)
}

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filter.platform) params.platform = filter.platform
    creds.value = await api.topology.credentials.list(params)
  } catch { ElMessage.error(t('topology.fetchFailed')) }
  finally { loading.value = false }
}

function resetFilter() {
  filter.platform = ''
  fetchData()
}

function validate(): boolean {
  if (!form.name) { ElMessage.warning(t('topology.nameRequired')); return false }
  if (!form.platform) { ElMessage.warning(t('topology.platform')); return false }
  if (form.type === 'aksk') {
    if (!form.accessKeyId) { ElMessage.warning(t('topology.accessKeyId')); return false }
    if (!dialog.isEdit && !form.accessKeySecret) { ElMessage.warning(t('topology.accessKeySecret')); return false }
  } else if (form.type === 'token') {
    if (!dialog.isEdit && !form.token) { ElMessage.warning(t('topology.token')); return false }
  } else if (form.type === 'password') {
    if (!form.username) { ElMessage.warning(t('topology.username')); return false }
    if (!dialog.isEdit && !form.password) { ElMessage.warning(t('topology.password')); return false }
  }
  return true
}

async function handleSave() {
  if (!validate()) return
  saving.value = true
  try {
    if (dialog.isEdit) {
      const body: UpdateCredentialInput = { name: form.name }
      if (form.accessKeySecret) body.accessKeySecret = form.accessKeySecret
      if (form.token) body.token = form.token
      if (form.password) body.password = form.password
      if (form.instanceId) body.instanceId = form.instanceId
      await api.topology.credentials.update(dialog.editId, body)
      ElMessage.success(t('topology.updateSuccess'))
    } else {
      const body: CreateCredentialInput = {
        name: form.name,
        type: form.type,
        platform: form.platform as Platform,
        instanceId: form.instanceId || undefined,
      }
      if (form.type === 'aksk') {
        body.accessKeyId = form.accessKeyId
        body.accessKeySecret = form.accessKeySecret
      } else if (form.type === 'token') {
        body.token = form.token
      } else if (form.type === 'password') {
        body.username = form.username
        body.password = form.password
      }
      await api.topology.credentials.create(body)
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
  await refCache.instances.load()
  instances.value = refCache.instances.data.value
})
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { margin-bottom: 16px; }
.filters :deep(.el-form-item) { margin-bottom: 0; }
</style>

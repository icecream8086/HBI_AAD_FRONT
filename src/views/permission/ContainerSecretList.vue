<template>
  <div>
    <el-button text @click="$router.push('/dashboard')" class="back">← {{ $t('common.home') }}</el-button>
    <div class="page-head">
      <h2>{{ $t('containerSecret.title') }}</h2>
      <el-button type="primary" size="small" @click="openCreate">{{ $t('containerSecret.create') }}</el-button>
    </div>

    <el-card class="filters">
      <el-form inline>
        <el-form-item :label="$t('containerSecret.name')">
          <el-input v-model="filter.name" :placeholder="$t('containerSecret.name')" clearable style="width:200px" @clear="fetchData" @keyup.enter="fetchData" />
        </el-form-item>
        <el-form-item :label="$t('containerSecret.type')">
          <el-select v-model="filter.type" clearable style="width:120px" @change="fetchData">
            <el-option :label="$t('containerSecret.typeValue')" value="value" />
            <el-option :label="$t('containerSecret.typeUpload')" value="upload" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilter">{{ $t('table.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="items" v-loading="loading" stripe :empty-text="$t('table.empty')">
      <el-table-column prop="name" :label="$t('containerSecret.name')" min-width="140" />
      <el-table-column :label="$t('containerSecret.type')" width="100">
        <template #default="{ row }">
          <el-tag :type="row.type === 'value' ? 'primary' : 'warning'" size="small">
            {{ row.type === 'value' ? $t('containerSecret.typeValue') : $t('containerSecret.typeUpload') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="visibility" :label="$t('containerSecret.visibility')" width="100" />
      <el-table-column prop="scopeCount" :label="$t('containerSecret.scope')" width="80" />
      <el-table-column :label="$t('table.createdAt')" width="150">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.actions')" width="280" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">{{ $t('table.edit') }}</el-button>
          <el-button size="small" @click="handleDownload(row)">{{ $t('containerSecret.download') }}</el-button>
          <el-button size="small" @click="openCheckAccess(row)">{{ $t('containerSecret.checkAccess') }}</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">{{ $t('table.delete') }}</el-button>
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

    <el-dialog v-model="dialog.show" :title="dialog.isEdit ? $t('containerSecret.edit') : $t('containerSecret.create')" width="520px" destroy-on-close>
      <el-form :model="form" label-width="110px">
        <el-form-item :label="$t('containerSecret.name')" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('containerSecret.type')" required>
          <el-select v-model="form.type" style="width:100%">
            <el-option :label="$t('containerSecret.typeValue')" value="value" />
            <el-option :label="$t('containerSecret.typeUpload')" value="upload" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.type === 'value'" :label="$t('containerSecret.value')">
          <el-input v-model="form.value" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item :label="$t('containerSecret.visibility')">
          <el-select v-model="form.visibility" style="width:100%">
            <el-option :label="$t('containerSecret.public')" value="public" />
            <el-option :label="$t('containerSecret.private')" value="private" />
            <el-option :label="$t('containerSecret.scope')" value="scope" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.visibility === 'scope'" :label="$t('containerSecret.scopeIds')">
          <el-select v-model="form.scopeIds" multiple filterable allow-create default-first-option style="width:100%" :placeholder="$t('containerSecret.scopePlaceholder')">
            <el-option v-for="sid in form.scopeIds" :key="sid" :label="sid" :value="sid" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('containerSecret.keyType')">
          <el-select v-model="form.keyType" style="width:100%">
            <el-option label="RSA" value="rsa" />
            <el-option label="ECDSA" value="ecdsa" />
            <el-option label="Ed25519" value="ed25519" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.show=false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ dialog.isEdit ? $t('table.save') : $t('table.create') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="checkDialog.show" :title="$t('containerSecret.checkAccessTitle')" width="480px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item :label="$t('containerSecret.scopeId')">
          <el-input v-model="checkDialog.scopeId" :placeholder="$t('containerSecret.scopeId')" />
        </el-form-item>
        <el-form-item v-if="checkDialog.result !== null" :label="$t('containerSecret.checkAccessResult')">
          <pre class="access-result">{{ typeof checkDialog.result === 'string' ? checkDialog.result : JSON.stringify(checkDialog.result, null, 2) }}</pre>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="checkDialog.show=false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" :loading="checkingAccess" @click="handleCheckAccess">{{ $t('table.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'

interface ContainerSecretItem {
  id: string
  name: string
  type: 'value' | 'upload'
  value?: string
  visibility?: string
  scopeCount?: number
  scopeIds?: string[]
  keyType?: string
  createdAt: number
  updatedAt: number
}

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const checkingAccess = ref(false)
const items = ref<ContainerSecretItem[]>([])
const dialog = reactive({ show: false, isEdit: false, editId: '' })
const checkDialog = reactive({ show: false, editId: '', scopeId: '', result: null as any })
const page = ref(1)
const limit = 20
const total = ref(0)
const filter = reactive({ name: '', type: '' })
const form = reactive({
  name: '',
  type: 'value' as 'value' | 'upload',
  value: '',
  visibility: 'private',
  scopeIds: [] as string[],
  keyType: '',
})

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

function openCreate() {
  dialog.isEdit = false; dialog.editId = ''
  form.name = ''; form.type = 'value'; form.value = ''; form.visibility = 'private'; form.scopeIds = []; form.keyType = ''
  dialog.show = true
}

function openEdit(row: ContainerSecretItem) {
  dialog.isEdit = true; dialog.editId = row.id
  form.name = row.name
  form.type = row.type
  form.value = row.value ?? ''
  form.visibility = row.visibility ?? 'private'
  form.scopeIds = row.scopeIds ?? []
  form.keyType = row.keyType ?? ''
  dialog.show = true
}

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, limit }
    if (filter.name) params.name = filter.name
    if (filter.type) params.type = filter.type
    const pageResult = await api.containerSecrets.list(params)
    items.value = (pageResult as any).items ?? []
    total.value = (pageResult as any).total ?? items.value.length
  } catch { ElMessage.error(t('containerSecret.fetchFailed')) }
  finally { loading.value = false }
}

function resetFilter() {
  filter.name = ''; filter.type = ''; page.value = 1; fetchData()
}

async function handleSave() {
  if (!form.name) { ElMessage.warning(t('containerSecret.nameRequired')); return }
  saving.value = true
  try {
    const body: Record<string, any> = {
      name: form.name,
      type: form.type,
      visibility: form.visibility,
      keyType: form.keyType,
    }
    if (form.type === 'value') body.value = form.value
    if (form.visibility === 'scope') body.scopeIds = form.scopeIds
    if (dialog.isEdit) {
      await api.containerSecrets.update(dialog.editId, body)
      ElMessage.success(t('containerSecret.updateSuccess'))
    } else {
      await api.containerSecrets.create(body)
      ElMessage.success(t('containerSecret.createSuccess'))
    }
    dialog.show = false; await fetchData()
  } catch { ElMessage.error(t('containerSecret.actionFailed')) }
  finally { saving.value = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('containerSecret.deleteConfirm'), t('table.confirm'))
    await api.containerSecrets.delete(id)
    ElMessage.success(t('containerSecret.deleteSuccess')); await fetchData()
  } catch { /* ignore */ }
}

async function handleDownload(row: ContainerSecretItem) {
  try {
    const data = await api.containerSecrets.download(row.id, {})
    ElMessage.success(t('containerSecret.download'))
    console.log('Downloaded secret:', data)
  } catch { ElMessage.error(t('containerSecret.actionFailed')) }
}

function openCheckAccess(row: ContainerSecretItem) {
  checkDialog.editId = row.id; checkDialog.scopeId = ''; checkDialog.result = null
  checkDialog.show = true
}

async function handleCheckAccess() {
  if (!checkDialog.scopeId) { ElMessage.warning(t('containerSecret.scopeId')); return }
  checkingAccess.value = true
  try {
    const result = await api.containerSecrets.checkAccess(checkDialog.editId, { scopeId: checkDialog.scopeId })
    checkDialog.result = result
  } catch { ElMessage.error(t('containerSecret.actionFailed')) }
  finally { checkingAccess.value = false }
}

onMounted(async () => {
  await fetchData()
})
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { margin-bottom: 16px; }
.filters :deep(.el-form-item) { margin-bottom: 0; }
.access-result { font-size: 13px; background: var(--el-fill-color-light); padding: 8px; border-radius: 4px; max-height: 200px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; }
</style>

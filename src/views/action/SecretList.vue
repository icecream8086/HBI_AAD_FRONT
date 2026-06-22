<template>
  <div>
    <el-button text @click="$router.push('/actions/workflows')" class="back-btn">← {{ $t('action.backToList') }}</el-button>

    <div class="page-head">
      <h2>{{ $t('action.secretTitle') }} — {{ workflowId }}</h2>
      <el-button type="primary" @click="openCreate">{{ $t('action.createSecret') }}</el-button>
    </div>

    <el-table :data="items" v-loading="loading" stripe :empty-text="$t('action.noSecrets')">
      <el-table-column prop="key" :label="$t('action.secretName')" min-width="180" />
      <el-table-column :label="$t('action.secretValue')" width="120">
        <template #default>{{ $t('action.valueMasked') }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.createdAt')" width="170">
        <template #default>{{ '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.actions')" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="handleDelete(row.id)">{{ $t('action.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dlg.show" :title="$t('action.createSecretTitle')" width="450px" destroy-on-close>
      <el-form :model="dlg.form" label-width="80px">
        <el-form-item :label="$t('action.secretName')" required>
          <el-input v-model="dlg.form.key" :placeholder="$t('action.secretNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('action.secretValue')" required>
          <el-input v-model="dlg.form.value" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlg.show = false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" :loading="dlg.saving" @click="handleSave">{{ $t('table.create') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'

const route = useRoute()
const { t } = useI18n()

const workflowId = route.params.workflowId as string
const loading = ref(false)
const items = ref<WorkflowSecret[]>([])

const dlg = reactive({ show: false, saving: false, form: { key: '', value: '' } })

function openCreate() {
  dlg.form.key = ''; dlg.form.value = ''
  dlg.show = true
}

async function fetchData() {
  loading.value = true
  try {
    items.value = await api.actions.secrets.list(workflowId)
  } catch { ElMessage.error(t('action.secretFetchFailed')) }
  finally { loading.value = false }
}

async function handleSave() {
  if (!dlg.form.key) { ElMessage.warning(t('action.secretNameRequired')); return }
  if (!dlg.form.value) { ElMessage.warning(t('action.secretValueRequired')); return }
  dlg.saving = true
  try {
    await api.actions.secrets.create(workflowId, { key: dlg.form.key, value: dlg.form.value })
    ElMessage.success(t('action.secretCreateSuccess'))
    dlg.show = false; await fetchData()
  } catch { ElMessage.error(t('action.secretSaveFailed')) }
  finally { dlg.saving = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('action.secretDeleteConfirm'), t('table.confirm'), { type: 'warning' })
    await api.actions.secrets.delete(id)
    ElMessage.success(t('action.secretDeleteSuccess'))
    await fetchData()
  } catch { /* ignore */ }
}

onMounted(fetchData)
</script>

<style scoped>
.back-btn { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>

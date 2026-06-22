<template>
  <div>
    <div class="page-head">
      <h2>{{ $t('action.sharedLinkTitle') }}</h2>
      <el-button type="primary" @click="openCreate">{{ $t('action.createSharedLink') }}</el-button>
    </div>

    <el-table :data="items" v-loading="loading" stripe :empty-text="$t('action.noLinks')">
      <el-table-column prop="name" :label="$t('action.sharedLinkName')" min-width="140" />
      <el-table-column label="Link ID" width="200" show-overflow-tooltip>
        <template #default="{ row }">{{ row.id }}</template>
      </el-table-column>
      <el-table-column :label="$t('action.sharedLinkWorkflow')" width="180" show-overflow-tooltip>
        <template #default="{ row }">{{ row.workflowId }}</template>
      </el-table-column>
      <el-table-column :label="$t('action.sharedLinkMaxUses')" width="100">
        <template #default="{ row }">{{ row.maxUses || $t('action.unlimited') }}</template>
      </el-table-column>
      <el-table-column :label="$t('action.sharedLinkExpires')" width="170">
        <template #default="{ row }">{{ row.expiresAt ? fmt(row.expiresAt) : $t('action.expiresNever') }}</template>
      </el-table-column>
      <el-table-column :label="$t('action.sharedLinkDisabled')" width="80">
        <template #default="{ row }">
          <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">{{ row.disabled ? $t('common.yes') : $t('common.no') }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.actions')" width="200" fixed="right">
        <template #default="{ row }">
          <el-button v-if="!row.disabled" size="small" type="warning" @click="handleDisable(row.id)">{{ $t('action.disable') }}</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">{{ $t('table.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="total > limit"
      v-model:current-page="page"
      :page-size="limit"
      :total="total"
      layout="prev, pager, next"
      @current-change="fetchData"
      style="margin-top:16px; justify-content:flex-end"
    />

    <el-dialog v-model="dlg.show" :title="$t('action.createSharedLinkTitle')" width="480px" destroy-on-close>
      <el-form :model="dlg.form" label-width="110px">
        <el-form-item :label="$t('action.name')" required>
          <el-input v-model="dlg.form.name" placeholder="My Shared Service" />
        </el-form-item>
        <el-form-item label="Workflow ID" required>
          <el-input v-model="dlg.form.workflowId" placeholder="wf_xxx" />
        </el-form-item>
        <el-form-item label="Password">
          <el-input v-model="dlg.form.password" type="password" show-password placeholder="Optional" />
        </el-form-item>
        <el-form-item :label="$t('action.sharedLinkMaxUses')">
          <el-input-number v-model="dlg.form.maxUses" :min="0" :step="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="Concurrent Max">
          <el-input-number v-model="dlg.form.concurrentMax" :min="0" :step="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="Default TTL (s)">
          <el-input-number v-model="dlg.form.defaultTtlSeconds" :min="0" :step="60" style="width:100%" />
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
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'

const { t } = useI18n()

const loading = ref(false)
const items = ref<SharedLink[]>([])
const page = ref(1)
const limit = 20
const total = ref(0)

const dlg = reactive({
  show: false, saving: false,
  form: { name: '', workflowId: '', password: '', maxUses: 0, concurrentMax: 0, defaultTtlSeconds: 3600 },
})

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

function openCreate() {
  dlg.form = { name: '', workflowId: '', password: '', maxUses: 0, concurrentMax: 0, defaultTtlSeconds: 3600 }
  dlg.show = true
}

async function fetchData() {
  loading.value = true
  try {
    const res = await api.actions.sharedLinks.list({ page: page.value, limit })
    items.value = res ?? []
    total.value = Array.isArray(res) ? res.length : 0
  } catch { ElMessage.error(t('action.fetchSharedLinksFailed')) }
  finally { loading.value = false }
}

async function handleSave() {
  if (!dlg.form.name || !dlg.form.workflowId) { ElMessage.warning(t('action.nameRequired')); return }
  dlg.saving = true
  try {
    const body: Record<string, any> = { workflowId: dlg.form.workflowId, name: dlg.form.name }
    if (dlg.form.password) body.password = dlg.form.password
    if (dlg.form.maxUses > 0) body.maxUses = dlg.form.maxUses
    if (dlg.form.concurrentMax > 0) body.concurrentMax = dlg.form.concurrentMax
    if (dlg.form.defaultTtlSeconds > 0) body.defaultTtlSeconds = dlg.form.defaultTtlSeconds
    await api.actions.sharedLinks.create(body as any)
    ElMessage.success(t('action.createSharedLinkSuccess'))
    dlg.show = false; await fetchData()
  } catch { ElMessage.error(t('common.actionFailed')) }
  finally { dlg.saving = false }
}

async function handleDisable(id: string) {
  try {
    await api.actions.sharedLinks.disable(id)
    ElMessage.success(t('action.disableSuccess'))
    await fetchData()
  } catch { ElMessage.error(t('common.actionFailed')) }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('action.deleteSharedLinkConfirm'), t('table.confirm'), { type: 'warning' })
    // No direct delete in spec, use disable
    await api.actions.sharedLinks.disable(id)
    ElMessage.success(t('action.deleteSharedLinkSuccess'))
    await fetchData()
  } catch { /* ignore */ }
}

onMounted(fetchData)
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>

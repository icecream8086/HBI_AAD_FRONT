<template>
  <div>
    <div class="page-head">
      <h2>{{ $t('action.title') }}</h2>
      <el-button
        type="primary"
        @click="openCreate"
      >
        {{ $t('action.create') }}
      </el-button>
    </div>

    <el-card class="filters">
      <el-form inline>
        <el-form-item :label="$t('table.name')">
          <el-input
            v-model="filter.name"
            clearable
            style="width:200px"
            @clear="fetchData"
            @keyup.enter="fetchData"
          />
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
      :data="items"
      stripe
      :empty-text="$t('table.empty')"
    >
      <el-table-column
        prop="name"
        :label="$t('action.name')"
        min-width="160"
      />
      <el-table-column
        :label="$t('action.triggerType')"
        width="120"
      >
        <template #default="{ row }">
          <el-tag
            v-if="row.on?.manual"
            size="small"
            type="primary"
          >
            {{ $t('action.triggerManual') }}
          </el-tag>
          <el-tag
            v-else-if="row.on?.cron"
            size="small"
            type="warning"
          >
            {{ $t('action.triggerCron') }}
          </el-tag>
          <el-tag
            v-else-if="row.on?.http"
            size="small"
            type="success"
          >
            {{ $t('action.triggerHttp') }}
          </el-tag>
          <el-tag
            v-else-if="row.on?.push"
            size="small"
            type="info"
          >
            {{ $t('action.triggerPush') }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('action.jobs')"
        width="80"
      >
        <template #default="{ row }">
          {{ Object.keys(row.jobs || {}).length }}
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('table.createdAt')"
        width="170"
      >
        <template #default="{ row }">
          {{ fmt(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('table.updatedAt')"
        width="170"
      >
        <template #default="{ row }">
          {{ fmt(row.updatedAt) }}
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('table.actions')"
        width="300"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button
            size="small"
            @click="$router.push(`/actions/workflows/${row.id}`)"
          >
            {{ $t('table.detail') }}
          </el-button>
          <el-button
            size="small"
            @click="openEdit(row)"
          >
            {{ $t('table.edit') }}
          </el-button>
          <el-button
            size="small"
            type="success"
            @click="openTrigger(row)"
          >
            {{ $t('action.triggerNow') }}
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(row.id)"
          >
            {{ $t('action.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
     
      v-model:current-page="page"
      :page-size="limit"
      :total="total"
      layout="prev, pager, next"
      style="margin-top:16px; justify-content:flex-end"
      @current-change="fetchData"
    />

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dlg.show"
      :title="dlg.isEdit ? $t('action.editTitle') : $t('action.createTitle')"
      width="700px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form
        :model="form"
        label-width="110px"
      >
        <el-form-item
          :label="$t('action.name')"
          required
        >
          <el-input
            v-model="form.name"
            :placeholder="$t('action.name')"
          />
        </el-form-item>
        <el-form-item :label="$t('action.triggerType')">
          <el-select
            v-model="form.triggerType"
            style="width:100%"
          >
            <el-option
              :label="$t('action.triggerManual')"
              value="manual"
            />
            <el-option
              :label="$t('action.triggerCron')"
              value="cron"
            />
            <el-option
              :label="$t('action.triggerHttp')"
              value="http"
            />
            <el-option
              :label="$t('action.triggerPush')"
              value="push"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="form.triggerType === 'cron'"
          :label="$t('action.cronExpr')"
        >
          <el-input
            v-model="form.cronExpr"
            placeholder="0 */6 * * *"
          />
        </el-form-item>
        <el-form-item
          v-if="form.triggerType === 'http'"
          label="Signature Secret"
        >
          <el-input
            v-model="form.httpSecret"
            placeholder="Optional HMAC secret"
          />
        </el-form-item>
        <el-form-item
          :label="$t('action.yaml')"
          required
        >
          <Codemirror
            v-model="form.yaml"
            :extensions="cmExtensions"
            :style="{ height: '320px' }"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlg.show = false">
          {{ $t('table.cancel') }}
        </el-button>
        <el-button
          type="primary"
          :loading="dlg.saving"
          @click="handleSave"
        >
          {{ dlg.isEdit ? $t('table.save') : $t('table.create') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Trigger Dialog -->
    <el-dialog
      v-model="triggerDlg.show"
      :title="$t('action.triggerTitle')"
      width="450px"
      destroy-on-close
    >
      <el-form
        :model="triggerDlg.form"
        label-width="90px"
      >
        <el-form-item :label="$t('action.inputs')">
          <el-input
            v-model="triggerDlg.form.inputs"
            type="textarea"
            :rows="4"
            placeholder="{&quot;key&quot;: &quot;value&quot;}"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="triggerDlg.show = false">
          {{ $t('table.cancel') }}
        </el-button>
        <el-button
          type="primary"
          :loading="triggerDlg.saving"
          @click="handleTrigger"
        >
          {{ $t('action.triggerNow') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Codemirror } from 'vue-codemirror'
import { yaml as yamlLang } from '@codemirror/lang-yaml'
import { api } from '../../api'
import YAML from 'yaml'

const cmExtensions = [yamlLang()]

const { t } = useI18n()

const loading = ref(false)
const items = ref<WorkflowDef[]>([])
const page = ref(1)
const limit = 15
const total = ref(0)
const filter = reactive({ name: '' })

const dlg = reactive({ show: false, isEdit: false, editId: '', saving: false })
const form = reactive({ name: '', triggerType: 'manual', cronExpr: '', httpSecret: '', yaml: '' })

const triggerDlg = reactive({ show: false, saving: false, workflowId: '', form: { inputs: '' } })

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

function jobsToYaml(jobs: Record<string, JobDef>): string {
  return YAML.stringify(jobs, { lineWidth: 0 })
}

function parseYamlToJobs(yaml: string): Record<string, JobDef> | null {
  if (!yaml.trim()) return null
  try {
    const parsed = YAML.parse(yaml)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    // Validate structure: each value must have a `steps` array
    for (const [, val] of Object.entries(parsed)) {
      if (!val || typeof val !== 'object') return null
      if (!Array.isArray((val as Record<string, unknown>).steps)) return null
    }
    return parsed as Record<string, JobDef>
  } catch {
    return null
  }
}

function openCreate() {
  dlg.isEdit = false; dlg.editId = ''
  form.name = ''; form.triggerType = 'manual'; form.cronExpr = ''; form.httpSecret = ''; form.yaml = ''
  dlg.show = true
}

function openEdit(row: WorkflowDef) {
  dlg.isEdit = true; dlg.editId = row.id
  form.name = row.name
  form.triggerType = row.on?.cron ? 'cron' : row.on?.http ? 'http' : row.on?.push ? 'push' : 'manual'
  form.cronExpr = row.on?.cron || ''
  form.httpSecret = row.on?.http?.signatureSecret || ''
  form.yaml = row.jobs ? jobsToYaml(row.jobs) : ''
  dlg.show = true
}

function openTrigger(row: WorkflowDef) {
  triggerDlg.workflowId = row.id
  triggerDlg.form.inputs = ''
  triggerDlg.show = true
}

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, limit }
    if (filter.name) params.name = filter.name
    const res = await api.actions.workflows.list(params)
    items.value = res.items ?? []
    total.value = res.total ?? 0
  } catch { ElMessage.error(t('action.fetchFailed')) }
  finally { loading.value = false }
}

function resetFilter() { filter.name = ''; page.value = 1; fetchData() }

async function handleSave() {
  if (!form.name) { ElMessage.warning(t('action.nameRequired')); return }
  if (!form.yaml.trim()) { ElMessage.warning(t('action.yamlRequired')); return }
  const jobs = parseYamlToJobs(form.yaml)
  if (!jobs) {
    ElMessage.error(t('action.yamlParseFailed') || 'YAML parse failed — check syntax')
    return
  }

  dlg.saving = true
  try {
    const on: Record<string, unknown> = {}
    if (form.triggerType === 'manual') on.manual = true
    else if (form.triggerType === 'cron') on.cron = form.cronExpr || '0 0 * * *'
    else if (form.triggerType === 'http') on.http = { signatureSecret: form.httpSecret || undefined }
    else if (form.triggerType === 'push') on.push = {}

    if (dlg.isEdit) {
      await api.actions.workflows.update(dlg.editId, { name: form.name, on, jobs })
      ElMessage.success(t('action.updateSuccess'))
    } else {
      await api.actions.workflows.create({ name: form.name, on, jobs })
      ElMessage.success(t('action.createSuccess'))
    }
    dlg.show = false; await fetchData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error?.message || t('action.saveFailed'))
  }
  finally { dlg.saving = false }
}

async function handleTrigger() {
  triggerDlg.saving = true
  try {
    const body: Record<string, any> = {}
    if (triggerDlg.form.inputs.trim()) {
      try { body.inputs = JSON.parse(triggerDlg.form.inputs) } catch { body.inputs = {} }
    }
    const res = await api.actions.workflows.trigger(triggerDlg.workflowId, body)
    ElMessage.success(t('action.triggerSuccess'))
    triggerDlg.show = false
    if (res?.id) {
      await ElMessageBox.confirm(
        `Run created: ${res.id}. View in Run History?`,
        t('action.triggerSuccess'),
        { confirmButtonText: t('common.yes'), cancelButtonText: t('common.no'), type: 'success' }
      ).then(() => { /* navigate */ }).catch(() => {})
    }
  } catch { ElMessage.error(t('action.triggerFailed')) }
  finally { triggerDlg.saving = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('action.deleteConfirm'), t('table.confirm'), { type: 'warning' })
    await api.actions.workflows.delete(id)
    ElMessage.success(t('action.deleteSuccess'))
    await fetchData()
  } catch { /* ignore */ }
}

onMounted(fetchData)
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { margin-bottom: 16px; }
.filters :deep(.el-form-item) { margin-bottom: 0; }
:deep(.cm-editor) { border: 1px solid var(--el-border-color); border-radius: 4px; }
:deep(.cm-editor.cm-focused) { border-color: var(--el-color-primary); outline: none; }
:deep(.cm-editor .cm-scroller) { font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace; font-size: 13px; line-height: 1.5; }
</style>

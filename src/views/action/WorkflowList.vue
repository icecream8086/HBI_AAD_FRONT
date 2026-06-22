<template>
  <div>
    <div class="page-head">
      <h2>{{ $t('action.title') }}</h2>
      <el-button type="primary" @click="openCreate">{{ $t('action.create') }}</el-button>
    </div>

    <el-card class="filters">
      <el-form inline>
        <el-form-item :label="$t('table.name')">
          <el-input v-model="filter.name" clearable style="width:200px" @clear="fetchData" @keyup.enter="fetchData" />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilter">{{ $t('table.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="items" v-loading="loading" stripe :empty-text="$t('table.empty')">
      <el-table-column prop="name" :label="$t('action.name')" min-width="160" />
      <el-table-column :label="$t('action.triggerType')" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.on?.manual" size="small" type="primary">{{ $t('action.triggerManual') }}</el-tag>
          <el-tag v-else-if="row.on?.cron" size="small" type="warning">{{ $t('action.triggerCron') }}</el-tag>
          <el-tag v-else-if="row.on?.http" size="small" type="success">{{ $t('action.triggerHttp') }}</el-tag>
          <el-tag v-else-if="row.on?.push" size="small" type="info">{{ $t('action.triggerPush') }}</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('action.jobs')" width="80">
        <template #default="{ row }">{{ Object.keys(row.jobs || {}).length }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.createdAt')" width="170">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.updatedAt')" width="170">
        <template #default="{ row }">{{ fmt(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.actions')" width="300" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/actions/workflows/${row.id}`)">{{ $t('table.detail') }}</el-button>
          <el-button size="small" @click="openEdit(row)">{{ $t('table.edit') }}</el-button>
          <el-button size="small" type="success" @click="openTrigger(row)">{{ $t('action.triggerNow') }}</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">{{ $t('action.delete') }}</el-button>
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

    <!-- Create/Edit Dialog -->
    <el-dialog v-model="dlg.show" :title="dlg.isEdit ? $t('action.editTitle') : $t('action.createTitle')" width="700px" destroy-on-close :close-on-click-modal="false">
      <el-form :model="form" label-width="110px">
        <el-form-item :label="$t('action.name')" required>
          <el-input v-model="form.name" :placeholder="$t('action.name')" />
        </el-form-item>
        <el-form-item :label="$t('action.triggerType')">
          <el-select v-model="form.triggerType" style="width:100%">
            <el-option :label="$t('action.triggerManual')" value="manual" />
            <el-option :label="$t('action.triggerCron')" value="cron" />
            <el-option :label="$t('action.triggerHttp')" value="http" />
            <el-option :label="$t('action.triggerPush')" value="push" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.triggerType === 'cron'" :label="$t('action.cronExpr')">
          <el-input v-model="form.cronExpr" placeholder="0 */6 * * *" />
        </el-form-item>
        <el-form-item v-if="form.triggerType === 'http'" label="Signature Secret">
          <el-input v-model="form.httpSecret" placeholder="Optional HMAC secret" />
        </el-form-item>
        <el-form-item :label="$t('action.yaml')" required>
          <Codemirror
            v-model="form.yaml"
            :extensions="cmExtensions"
            :style="{ height: '320px' }"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlg.show = false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" :loading="dlg.saving" @click="handleSave">
          {{ dlg.isEdit ? $t('table.save') : $t('table.create') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Trigger Dialog -->
    <el-dialog v-model="triggerDlg.show" :title="$t('action.triggerTitle')" width="450px" destroy-on-close>
      <el-form :model="triggerDlg.form" label-width="90px">
        <el-form-item :label="$t('action.inputs')">
          <el-input v-model="triggerDlg.form.inputs" type="textarea" :rows="4" placeholder='{"key": "value"}' />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="triggerDlg.show = false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" :loading="triggerDlg.saving" @click="handleTrigger">{{ $t('action.triggerNow') }}</el-button>
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

function jsonToYaml(jobs: Record<string, JobDef>): string {
  const lines: string[] = []
  for (const [name, job] of Object.entries(jobs)) {
    lines.push(`${name}:`)
    if (job.needs?.length) lines.push(`  needs: [${job.needs.join(', ')}]`)
    if (job.container?.image) {
      lines.push(`  container:`)
      lines.push(`    image: ${job.container.image}`)
    }
    if (job.steps) {
      lines.push(`  steps:`)
      for (const s of job.steps) {
        lines.push(`    - run: "${s.run || ''}"`)
      }
    }
    if (job.timeout) lines.push(`  timeout: ${job.timeout}`)
  }
  return lines.join('\n')
}

function parseYamlToJobs(yaml: string): Record<string, JobDef> | null {
  // Simple YAML → JSON conversion for workflow jobs
  try {
    const jobs: Record<string, JobDef> = {}
    const lines = yaml.split('\n')
    let currentJob = ''
    let inContainer = false
    let inSteps = false
    for (const line of lines) {
      if (line.trim() === '' || line.startsWith('#')) continue
      if (/^[a-zA-Z]/.test(line) && !line.startsWith(' ')) {
        currentJob = line.replace(/:$/, '').trim()
        jobs[currentJob] = { steps: [] }
        inContainer = false; inSteps = false
      } else if (currentJob && line.match(/^\s+needs:/)) {
        const needsStr = line.replace(/^\s+needs:\s*\[?/, '').replace(/\]$/, '').trim()
        jobs[currentJob].needs = needsStr ? needsStr.split(/,\s*/).map(s => s.replace(/['"]/g, '')) : []
      } else if (currentJob && line.match(/^\s+container:/)) {
        inContainer = true; inSteps = false
      } else if (inContainer && line.match(/^\s+image:/)) {
        const img = line.replace(/^\s+image:\s*/, '').trim()
        jobs[currentJob].container = { ...jobs[currentJob].container, image: img }
      } else if (!inContainer && line.match(/^\s+steps:/)) {
        inSteps = true; inContainer = false
      } else if (inSteps && line.match(/^\s+- run:/)) {
        const run = line.replace(/^\s+- run:\s*/, '').trim().replace(/^"/, '').replace(/"$/, '')
        jobs[currentJob].steps!.push({ run })
      }
    }
    return Object.keys(jobs).length > 0 ? jobs : null
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
  form.yaml = row.jobs ? jsonToYaml(row.jobs) : ''
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
    try {
      // Try JSON parse as fallback
      const parsed = JSON.parse(form.yaml)
      if (typeof parsed !== 'object') throw new Error()
      if (!dlg.isEdit) {
        dlg.saving = true
        const body: Record<string, any> = { name: form.name, jobs: parsed }
        const on: Record<string, any> = {}
        if (form.triggerType === 'manual') on.manual = true
        else if (form.triggerType === 'cron') on.cron = form.cronExpr || '0 0 * * *'
        else if (form.triggerType === 'http') on.http = { signatureSecret: form.httpSecret || undefined }
        else if (form.triggerType === 'push') on.push = {}
        body.on = on
        await api.actions.workflows.create(body as any)
        ElMessage.success(t('action.createSuccess'))
        dlg.show = false; await fetchData()
      } else {
        // For edit, just pass YAML as string with name/on
        await api.actions.workflows.update(dlg.editId, { name: form.name })
        ElMessage.success(t('action.updateSuccess'))
        dlg.show = false; await fetchData()
      }
    } catch (e: any) {
      ElMessage.error(e?.response?.data?.error?.message || t('action.saveFailed'))
    }
    finally { dlg.saving = false }
    return
  }

  dlg.saving = true
  try {
    const on: Record<string, any> = {}
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

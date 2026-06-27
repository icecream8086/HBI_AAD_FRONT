<template>
  <div v-loading="loading">
    <el-button
      text
      class="back-btn"
      @click="$router.push('/actions/workflows')"
    >
      {{ $t('action.backToList') }}
    </el-button>

    <div
      v-if="workflow"
      class="page-head"
    >
      <h2>{{ workflow.name }}</h2>
      <div class="head-actions">
        <el-button
          type="success"
          size="small"
          @click="openTrigger"
        >
          {{ $t('action.triggerNow') }}
        </el-button>
        <el-button
          size="small"
          @click="$router.push(`/actions/workflows/${workflow.id}/editor`)"
        >
          {{ $t('action.editor') }}
        </el-button>
      </div>
    </div>

    <el-card
      v-if="workflow"
      class="section"
    >
      <template #header>
        <strong>Workflow Info</strong>
      </template>
      <el-descriptions
        :column="2"
        border
      >
        <el-descriptions-item :label="$t('action.name')">
          {{ workflow.name }}
        </el-descriptions-item>
        <el-descriptions-item label="ID">
          {{ workflow.id }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('action.triggerType')">
          <el-tag
            v-if="workflow.on?.manual"
            size="small"
            type="primary"
          >
            {{ $t('action.triggerManual') }}
          </el-tag>
          <el-tag
            v-else-if="workflow.on?.cron"
            size="small"
            type="warning"
          >
            {{ $t('action.triggerCron') }}: {{ workflow.on.cron }}
          </el-tag>
          <el-tag
            v-else-if="workflow.on?.http"
            size="small"
            type="success"
          >
            {{ $t('action.triggerHttp') }}
          </el-tag>
          <el-tag
            v-else-if="workflow.on?.push"
            size="small"
            type="info"
          >
            {{ $t('action.triggerPush') }}
          </el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('table.createdAt')">
          {{ fmt(workflow.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('table.updatedAt')">
          {{ fmt(workflow.updatedAt) }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="workflow.orgId"
          label="Org ID"
        >
          {{ workflow.orgId }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="workflow.projectId"
          label="Project ID"
        >
          {{ workflow.projectId }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- Jobs -->
    <el-card
      v-if="workflow"
      class="section"
    >
      <template #header>
        <strong>{{ $t('action.jobs') }} ({{ Object.keys(workflow.jobs || {}).length }})</strong>
      </template>
      <div v-if="workflow.jobs && Object.keys(workflow.jobs).length">
        <el-table
          :data="jobEntries"
          stripe
          size="small"
        >
          <el-table-column
            prop="name"
            :label="$t('action.jobName')"
            width="180"
          />
          <el-table-column
            label="Depends On"
            min-width="150"
          >
            <template #default="{ row }">
              <template v-if="row.job.needs?.length">
                <el-tag
                  v-for="n in row.job.needs"
                  :key="n"
                  size="small"
                  type="info"
                  style="margin-right:4px"
                >
                  {{ n }}
                </el-tag>
              </template>
              <span
                v-else
                class="dim"
              >-</span>
            </template>
          </el-table-column>
          <el-table-column
            label="Image"
            min-width="200"
          >
            <template #default="{ row }">
              {{ row.job.container?.image || row.job.containers?.map((c: any) => c.image).join(', ') || '-' }}
            </template>
          </el-table-column>
          <el-table-column
            label="Steps"
            width="80"
          >
            <template #default="{ row }">
              {{ row.job.steps?.length || 0 }}
            </template>
          </el-table-column>
          <el-table-column
            label="Timeout"
            width="80"
          >
            <template #default="{ row }">
              {{ row.job.timeout ? row.job.timeout + 's' : '-' }}
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div
        v-else
        class="dim"
      >
        {{ $t('table.empty') }}
      </div>
    </el-card>

    <!-- YAML Preview -->
    <el-card
      v-if="workflow"
      class="section"
    >
      <template #header>
        <strong>{{ $t('action.yaml') }}</strong>
      </template>
      <pre class="yaml-preview">{{ yamlPreview }}</pre>
    </el-card>

    <!-- Recent Runs -->
    <el-card
      v-if="workflow"
      class="section"
    >
      <template #header>
        <div class="card-header-row">
          <strong>{{ $t('action.recentRuns') }}</strong>
          <el-button
            size="small"
            text
            @click="$router.push('/actions/runs')"
          >
            {{ $t('common.viewAll') || 'View All' }}
          </el-button>
        </div>
      </template>
      <div v-if="recentRuns.length">
        <el-table
          :data="recentRuns"
          size="small"
        >
          <el-table-column
            prop="id"
            label="Run ID"
            width="180"
          />
          <el-table-column
            :label="$t('action.runStatus')"
            width="100"
          >
            <template #default="{ row }">
              <el-tag
                :type="statusType(row.status)"
                size="small"
              >
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('action.runStartedAt')"
            width="170"
          >
            <template #default="{ row }">
              {{ fmt(row.startedAt) }}
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('action.runCompletedAt')"
            width="170"
          >
            <template #default="{ row }">
              {{ fmt(row.completedAt) }}
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('table.actions')"
            width="100"
          >
            <template #default="{ row }">
              <el-button
                size="small"
                @click="$router.push(`/actions/runs/${row.id}`)"
              >
                {{ $t('table.detail') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div
        v-else
        class="dim"
      >
        {{ $t('action.noRuns') }}
      </div>
    </el-card>

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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { api } from '../../api'
import { type StatusTagMap, lookup } from '../../utils/codec'

const route = useRoute()
const { t } = useI18n()

const loading = ref(false)
const workflow = ref<WorkflowDef | null>(null)
const recentRuns = ref<WorkflowRun[]>([])

const triggerDlg = reactive({ show: false, saving: false, form: { inputs: '' } })

const jobEntries = computed(() => {
  if (!workflow.value?.jobs) return []
  return Object.entries(workflow.value.jobs).map(([name, job]) => ({ name, job }))
})

const yamlPreview = computed(() => {
  if (!workflow.value) return ''
  const w = workflow.value
  let y = `name: "${w.name}"\n`
  y += 'on:\n'
  if (w.on?.manual) y += '  manual: true\n'
  if (w.on?.cron) y += `  cron: "${w.on.cron}"\n`
  if (w.on?.http) y += '  http:\n'
  if (w.on?.http?.signatureSecret) y += `    signatureSecret: "${w.on.http.signatureSecret}"\n`
  if (w.on?.push) y += '  push:\n'
  y += 'jobs:\n'
  for (const [name, job] of Object.entries(w.jobs || {})) {
    y += `  ${name}:\n`
    if (job.needs?.length) y += `    needs: [${job.needs.join(', ')}]\n`
    if (job.container?.image) {
      y += '    container:\n'
      y += `      image: ${job.container.image}\n`
    }
    if (job.steps?.length) {
      y += '    steps:\n'
      for (const s of job.steps) {
        y += `      - run: "${s.run || ''}"\n`
      }
    }
    if (job.timeout) y += `    timeout: ${job.timeout}\n`
  }
  return y
})

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

const runStatusTags: StatusTagMap<WorkflowRunStatus> = {
  Success: 'success',
  Failure: 'danger',
  Running: 'primary',
  Pending: 'info',
  Cancelled: 'warning',
  TimedOut: 'danger',
}
function statusType(status: string) { return lookup(runStatusTags, status, 'info') }

function openTrigger() {
  triggerDlg.form.inputs = ''
  triggerDlg.show = true
}

async function handleTrigger() {
  if (!workflow.value) return
  triggerDlg.saving = true
  try {
    const body: Record<string, any> = {}
    if (triggerDlg.form.inputs.trim()) {
      try { body.inputs = JSON.parse(triggerDlg.form.inputs) } catch { body.inputs = {} }
    }
    await api.actions.workflows.trigger(workflow.value.id, body)
    ElMessage.success(t('action.triggerSuccess'))
    triggerDlg.show = false
    await loadRecentRuns()
  } catch { ElMessage.error(t('action.triggerFailed')) }
  finally { triggerDlg.saving = false }
}

async function loadRecentRuns() {
  if (!workflow.value) return
  try {
    const res = await api.actions.runs.list({ workflowId: workflow.value.id, limit: 5 })
    recentRuns.value = res.items ?? []
  } catch { /* ignore */ }
}

async function loadWorkflow() {
  const id = route.params.id as string
  if (!id) return
  loading.value = true
  try {
    workflow.value = await api.actions.workflows.get(id)
    await loadRecentRuns()
  } catch {
    workflow.value = null
    ElMessage.error(t('action.fetchFailed'))
  }
  finally { loading.value = false }
}

watch(() => route.params.id, () => { if (route.params.id) loadWorkflow() })
onMounted(loadWorkflow)
</script>

<style scoped>
.back-btn { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.head-actions { display: flex; gap: 8px; }
.section { margin-bottom: 16px; }
.dim { color: var(--el-text-color-secondary); font-size: 13px; }
.yaml-preview {
  background: var(--el-fill-color-lighter);
  padding: 16px;
  border-radius: 6px;
  font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre;
  margin: 0;
}
.card-header-row { display: flex; justify-content: space-between; align-items: center; }
</style>

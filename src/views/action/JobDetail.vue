<template>
  <div v-loading="loading">
    <el-button text @click="$router.push(`/actions/runs/${runId}`)" class="back-btn">{{ $t('action.backToRun') }}</el-button>

    <div v-if="job" class="page-head">
      <h2>Job: {{ job.jobName }}</h2>
      <el-tag :type="statusType(job.status)" size="large">{{ job.status }}</el-tag>
    </div>

    <el-card v-if="job" class="section">
      <template #header><strong>Job Info</strong></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item :label="$t('action.jobName')">{{ job.jobName }}</el-descriptions-item>
        <el-descriptions-item :label="$t('action.jobStatus')">
          <el-tag :type="statusType(job.status)" size="small">{{ job.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="job.sandboxId" label="Sandbox ID">{{ job.sandboxId }}</el-descriptions-item>
        <el-descriptions-item :label="$t('action.runStartedAt')">{{ fmt(job.startedAt) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('action.runCompletedAt')">{{ fmt(job.completedAt) }}</el-descriptions-item>
        <el-descriptions-item v-if="job.error" :label="$t('action.runError')" :span="2">
          <span class="error-text">{{ job.error }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- Steps -->
    <el-card v-if="job" class="section">
      <template #header><strong>Steps ({{ job.stepRuns?.length || 0 }})</strong></template>
      <div v-if="job.stepRuns?.length">
        <el-table :data="job.stepRuns" size="small">
          <el-table-column prop="name" :label="$t('action.stepName')" min-width="140" />
          <el-table-column :label="$t('action.stepStatus')" width="100">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('action.stepExitCode')" width="100">
            <template #default="{ row }">{{ row.exitCode ?? '-' }}</template>
          </el-table-column>
          <el-table-column :label="$t('action.stepDuration')" width="120">
            <template #default="{ row }">
              <template v-if="row.startedAt && row.completedAt">{{ ((row.completedAt - row.startedAt) / 1000).toFixed(1) }}s</template>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('table.actions')" width="100">
            <template #default="{ row }">
              <el-button size="small" @click="fetchLogs(row.name)">{{ $t('action.jobLogs') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else class="dim">-</div>
    </el-card>

    <!-- Logs -->
    <el-card v-if="logText" class="section">
      <template #header>
        <div class="card-header-row">
          <strong>{{ $t('action.logText') }} — {{ currentStep }}</strong>
          <el-button size="small" @click="logText = ''">{{ $t('table.cancel') }}</el-button>
        </div>
      </template>
      <pre class="log-output" v-text="logText || $t('action.jobLogsEmpty')"></pre>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { api } from '../../api'

const route = useRoute()
const { t } = useI18n()

const runId = route.params.runId as string
const jobId = route.params.jobId as string
const loading = ref(false)
const job = ref<JobRun | null>(null)
const logText = ref('')
const currentStep = ref('')

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

function statusType(s: string) {
  const m: Record<string, string> = { Success: 'success', Failure: 'danger', Running: 'primary', Queued: 'info', Skipped: 'warning', Cancelled: 'warning' }
  return m[s] || 'info'
}

async function fetchLogs(step: string) {
  currentStep.value = step
  try {
    const res = await api.actions.jobs.logs(jobId, { step, offset: 0, limit: 500 })
    logText.value = res.text || t('action.jobLogsEmpty')
  } catch { ElMessage.error(t('action.fetchLogsFailed')) }
}

async function loadJob() {
  loading.value = true
  try {
    job.value = await api.actions.jobs.get(jobId)
  } catch { ElMessage.error(t('action.fetchRunsFailed')) }
  finally { loading.value = false }
}

onMounted(loadJob)
</script>

<style scoped>
.back-btn { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section { margin-bottom: 16px; }
.dim { color: var(--el-text-color-secondary); font-size: 13px; }
.error-text { color: var(--el-color-danger); font-size: 13px; }
.log-output {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 6px;
  font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 500px;
  overflow-y: auto;
  white-space: pre-wrap;
  margin: 0;
}
.card-header-row { display: flex; justify-content: space-between; align-items: center; }
</style>

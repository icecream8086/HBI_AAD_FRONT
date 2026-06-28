<template>
  <div v-loading="loading">
    <el-button
      text
      class="back-btn"
      @click="$router.push('/actions/runs')"
    >
      {{ $t('action.backToRuns') }}
    </el-button>

    <div
      v-if="run"
      class="page-head"
    >
      <h2>Run {{ run.id }}</h2>
      <div class="head-actions">
        <el-tag
          :type="statusType(run.status)"
          size="large"
        >
          {{ run.status }}
        </el-tag>
        <el-button
          v-if="run.status === 'Running' || run.status === 'Pending'"
          size="small"
          type="warning"
          @click="handleCancel"
        >
          {{ $t('action.cancelRun') }}
        </el-button>
        <el-button
          v-if="run.status === 'Failure' || run.status === 'Cancelled' || run.status === 'TimedOut'"
          size="small"
          @click="handleRerun"
        >
          {{ $t('action.rerun') }}
        </el-button>
      </div>
    </div>

    <el-card
      v-if="run"
      class="section"
    >
      <template #header>
        <strong>Run Info</strong>
      </template>
      <el-descriptions
        :column="2"
        border
      >
        <el-descriptions-item label="Run ID">
          {{ run.id }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('action.runStatus')">
          <el-tag
            :type="statusType(run.status)"
            size="small"
          >
            {{ run.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('action.runTrigger')">
          {{ run.trigger }}
        </el-descriptions-item>
        <el-descriptions-item label="Workflow ID">
          {{ run.workflowId }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('action.runStartedAt')">
          {{ fmt(run.startedAt) }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('action.runCompletedAt')">
          {{ fmt(run.completedAt) }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="run.error"
          :label="$t('action.runError')"
          :span="2"
        >
          <span class="error-text">{{ run.error }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- Jobs -->
    <el-card
      v-if="run"
      class="section"
    >
      <template #header>
        <strong>{{ $t('action.jobs') }}</strong>
      </template>
      <div v-if="run.jobRunRefs?.length">
        <el-table
          :data="run.jobRunRefs"
          size="small"
        >
          <el-table-column
            prop="jobName"
            :label="$t('action.jobName')"
            width="180"
          />
          <el-table-column
            label="Job Run ID"
            min-width="200"
          >
            <template #default="{ row }">
              <el-button
                size="small"
                text
                type="primary"
                @click="$router.push(`/actions/runs/${run!.id}/jobs/${row.jobRunId}`)"
              >
                {{ row.jobRunId }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('table.actions')"
            width="100"
          >
            <template #default="{ row }">
              <el-button
                size="small"
                @click="$router.push(`/actions/runs/${run!.id}/jobs/${row.jobRunId}`)"
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
        {{ $t('action.noJobs') }}
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api/typed'
import { type StatusTagMap, lookup } from '../../utils/codec'

const route = useRoute()
const { t } = useI18n()

const loading = ref(false)
const run = ref<WorkflowRun | null>(null)

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

const runStatusTags: StatusTagMap<WorkflowRunStatus> = {
  Success: 'success',
  Failure: 'danger',
  Running: 'primary',
  Pending: 'info',
  Cancelled: 'warning',
  TimedOut: 'danger',
}
function statusType(s: string) { return lookup(runStatusTags, s, 'info') }

async function handleCancel() {
  if (!run.value) return
  try {
    await ElMessageBox.confirm(t('action.cancelConfirm'), t('table.confirm'), { type: 'warning' })
    await api.actions.runs.cancel(run.value.id)
    ElMessage.success(t('action.cancelSuccess'))
    await loadRun()
  } catch { /* ignore */ }
}

async function handleRerun() {
  if (!run.value) return
  try {
    await api.actions.runs.rerun(run.value.id)
    ElMessage.success(t('action.rerunSuccess'))
    await loadRun()
  } catch { ElMessage.error(t('common.actionFailed')) }
}

async function loadRun() {
  const id = route.params.id as string
  if (!id) return
  loading.value = true
  try {
    run.value = await api.actions.runs.get(id)
  } catch { ElMessage.error(t('action.fetchRunsFailed')) }
  finally { loading.value = false }
}

onMounted(loadRun)
</script>

<style scoped>
.back-btn { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.head-actions { display: flex; gap: 8px; align-items: center; }
.section { margin-bottom: 16px; }
.dim { color: var(--el-text-color-secondary); font-size: 13px; }
.error-text { color: var(--el-color-danger); font-size: 13px; }
</style>

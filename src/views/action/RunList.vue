<template>
  <div>
    <div class="page-head">
      <h2>{{ $t('action.runTitle') }}</h2>
      <el-button @click="fetchData">
        {{ $t('table.refresh') }}
      </el-button>
    </div>

    <el-card class="filters">
      <el-form inline>
        <el-form-item :label="$t('action.runStatus')">
          <el-select
            v-model="filter.status"
            clearable
            :placeholder="$t('table.selectPlaceholder')"
            style="width:140px"
            @change="fetchData"
          >
            <el-option
              label="Pending"
              value="Pending"
            />
            <el-option
              label="Running"
              value="Running"
            />
            <el-option
              label="Success"
              value="Success"
            />
            <el-option
              label="Failure"
              value="Failure"
            />
            <el-option
              label="Cancelled"
              value="Cancelled"
            />
            <el-option
              label="TimedOut"
              value="TimedOut"
            />
          </el-select>
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
        prop="id"
        label="Run ID"
        width="200"
        show-overflow-tooltip
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
        :label="$t('action.runTrigger')"
        width="110"
      >
        <template #default="{ row }">
          <el-tag
            size="small"
            type="info"
          >
            {{ row.trigger }}
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
        :label="$t('action.runDuration')"
        width="100"
      >
        <template #default="{ row }">
          {{ duration(row) }}
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('table.actions')"
        width="240"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button
            size="small"
            @click="$router.push(`/actions/runs/${row.id}`)"
          >
            {{ $t('table.detail') }}
          </el-button>
          <el-button
            v-if="row.status === 'Running' || row.status === 'Pending'"
            size="small"
            type="warning"
            @click="handleCancel(row.id)"
          >
            {{ $t('action.cancelRun') }}
          </el-button>
          <el-button
            v-if="row.status === 'Failure' || row.status === 'Cancelled' || row.status === 'TimedOut'"
            size="small"
            @click="handleRerun(row.id)"
          >
            {{ $t('action.rerun') }}
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api/typed'
import { type StatusTagMap, lookup } from '../../utils/codec'

const route = useRoute()
const { t } = useI18n()

const loading = ref(false)
const items = ref<WorkflowRun[]>([])
const page = ref(1)
const limit = 20
const total = ref(0)
const filter = reactive({ status: '', workflowId: '' })

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

function duration(run: WorkflowRun): string {
  if (!run.startedAt) return '-'
  const end = run.completedAt || Date.now()
  const ms = end - run.startedAt
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

const runStatusTags: StatusTagMap<WorkflowRunStatus> = {
  Success: 'success',
  Failure: 'danger',
  Running: 'primary',
  Pending: 'info',
  Cancelled: 'warning',
  TimedOut: 'danger',
}
function statusType(s: string) { return lookup(runStatusTags, s, 'info') }

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, limit }
    if (filter.status) params.status = filter.status
    if (filter.workflowId) params.workflowId = filter.workflowId
    const res = await api.actions.runs.list(params)
    items.value = res.items ?? []
    total.value = res.total ?? 0
  } catch { ElMessage.error(t('action.fetchRunsFailed')) }
  finally { loading.value = false }
}

function resetFilter() { filter.status = ''; page.value = 1; fetchData() }

async function handleCancel(id: string) {
  try {
    await ElMessageBox.confirm(t('action.cancelConfirm'), t('table.confirm'), { type: 'warning' })
    await api.actions.runs.cancel(id)
    ElMessage.success(t('action.cancelSuccess'))
    await fetchData()
  } catch { /* ignore */ }
}

async function handleRerun(id: string) {
  try {
    await api.actions.runs.rerun(id)
    ElMessage.success(t('action.rerunSuccess'))
    await fetchData()
  } catch { ElMessage.error(t('common.actionFailed')) }
}

onMounted(() => {
  const wfId = route.query.workflowId as string
  if (wfId) { filter.workflowId = wfId }
  fetchData()
})
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { margin-bottom: 16px; }
.filters :deep(.el-form-item) { margin-bottom: 0; }
</style>

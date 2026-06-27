<template>
  <div>
    <div class="page-head">
      <h2>{{ $t('pod.title') }}</h2>
    </div>

    <el-card class="filters">
      <el-form
        :inline="true"
        @submit.prevent
      >
        <el-form-item :label="$t('pod.filterStatus')">
          <el-select
            v-model="filter.status"
            clearable
            :placeholder="$t('pod.filterAll')"
            style="width:140px"
          >
            <el-option
              :label="$t('pod.statusRunning')"
              value="Running"
            />
            <el-option
              :label="$t('pod.statusStopped')"
              value="Stopped"
            />
            <el-option
              :label="$t('pod.statusPending')"
              value="Pending"
            />
            <el-option
              :label="$t('pod.statusFailed')"
              value="Failed"
            />
            <el-option
              :label="$t('pod.statusTerminated')"
              value="Terminated"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="fetchData"
          >
            {{ $t('table.query') }}
          </el-button>
          <el-button @click="filter.status='';fetchData()">
            {{ $t('table.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table
      v-loading="loading"
      :data="pods || []"
      stripe
      style="width:100%"
      :empty-text="$t('table.empty')"
    >
      <el-table-column
        label=""
        width="50"
      >
        <template #default>
          <el-icon :size="20">
            <Coin />
          </el-icon>
        </template>
      </el-table-column>
      <el-table-column
        prop="id"
        :label="$t('table.id')"
        width="200"
        show-overflow-tooltip
      />
      <el-table-column
        prop="status"
        :label="$t('table.status')"
        width="120"
      >
        <template #default="{ row }">
          <el-tag
            :type="statusType(row.status)"
            size="small"
            effect="dark"
          >
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('pod.containerCount')"
        width="90"
      >
        <template #default="{ row }">
          {{ row.containers?.length || 0 }}
        </template>
      </el-table-column>
      <el-table-column
        prop="providerId"
        label="Provider ID"
        width="150"
        show-overflow-tooltip
      />
      <el-table-column
        :label="$t('table.network')"
        width="160"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          {{ fmtNetwork(row.network) }}
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
        :label="$t('table.actions')"
        width="200"
      >
        <template #default="{ row }">
          <el-button
            size="small"
            @click="$router.push(`/sandboxes/pods/${row.providerId}`)"
          >
            {{ $t('table.detail') }}
          </el-button>
          <el-button
            size="small"
            type="warning"
            @click="handleStop(row.providerId)"
          >
            {{ $t('pod.stop') }}
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(row.providerId)"
          >
            {{ $t('table.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="page-footer">
      <el-button
        v-if="nextCursor"
        :loading="loading"
        @click="loadMore"
      >
        {{ $t('table.loadMore') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { api } from '../../api'
import { type StatusTagMap, lookup } from '../../utils/codec'

const { t } = useI18n()

const PAGE_LIMIT = 15
const loading = ref(false)
const pods = ref<PodInstance[]>([])
const nextCursor = ref<string | undefined>()

const filter = reactive({ status: '' })

const podStatusTags: StatusTagMap<PodStatus> = {
  Running: 'success',
  Stopped: 'info',
  Pending: 'warning',
  Scheduling: 'warning',
  Failed: 'danger',
  Terminated: 'info',
  Deleted: 'info',
}
function statusType(status: string) { return lookup(podStatusTags, status, 'info') }

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

function fmtNetwork(net?: NetworkInfo): string {
  if (!net) return '-'
  const ips: string[] = []
  if (net.externalIp) ips.push(net.externalIp)
  if (net.internalIp) ips.push(net.internalIp)
  return ips.join(' / ') || '-'
}

async function fetchData() {
  loading.value = true
  nextCursor.value = undefined
  try {
    const params: Record<string, any> = { limit: PAGE_LIMIT }
    if (filter.status) params.status = filter.status
    const res = await api.pods.list(params)
    pods.value = res.items
    nextCursor.value = res.nextCursor
  } catch {
    ElMessage.error(t('pod.loadFailed'))
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (!nextCursor.value) return
  loading.value = true
  try {
    const params: Record<string, any> = { limit: PAGE_LIMIT, cursor: nextCursor.value }
    if (filter.status) params.status = filter.status
    const res = await api.pods.list(params)
    pods.value.push(...res.items)
    nextCursor.value = res.nextCursor
  } catch {
    ElMessage.error(t('pod.loadFailed'))
  } finally {
    loading.value = false
  }
}

async function handleDelete(providerId: string) {
  try {
    await ElMessageBox.confirm(t('pod.deleteConfirm'), t('table.confirm'), { type: 'warning' })
    await api.pods.delete(providerId)
    ElMessage.success(t('pod.deleteSuccess'))
    await fetchData()
  } catch { /* ignore */ }
}

async function handleStop(providerId: string) {
  try {
    await ElMessageBox.confirm(t('pod.stopConfirm'), t('table.confirm'), { type: 'warning' })
    await api.pods.stop(providerId)
    ElMessage.success(t('pod.stopSuccess'))
    await fetchData()
  } catch { /* ignore */ }
}

onMounted(fetchData)
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { margin-bottom: 16px; }
.page-footer { margin-top: 16px; text-align: center; }
</style>

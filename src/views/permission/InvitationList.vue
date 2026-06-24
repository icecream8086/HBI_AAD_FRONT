<template>
  <div>
    <el-button text @click="$router.push('/dashboard')" class="back">← {{ $t('common.home') }}</el-button>
    <div class="page-head">
      <h2>{{ $t('invitation.title') }}</h2>
    </div>

    <el-card class="filters">
      <el-form inline>
        <el-form-item :label="$t('invitation.filterStatus')">
          <el-select v-model="filter.status" clearable style="width:160px" :placeholder="$t('invitation.filterStatus')" @change="fetchData">
            <el-option :label="$t('invitation.pending')" value="pending" />
            <el-option :label="$t('invitation.accepted')" value="accepted" />
            <el-option :label="$t('invitation.rejected')" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilter">{{ $t('table.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="items || []" v-loading="loading" stripe :empty-text="$t('table.empty')">
      <el-table-column prop="groupName" :label="$t('invitation.groupName')" min-width="150" />
      <el-table-column prop="inviterName" :label="$t('invitation.inviterName')" min-width="120" />
      <el-table-column prop="inviteeName" :label="$t('invitation.inviteeName')" min-width="120" />
      <el-table-column :label="$t('invitation.status')" width="110">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ $t(`invitation.${row.status}`) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.createdAt')" width="170">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.actions')" width="180" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 'pending'">
            <el-button size="small" type="success" @click="handleAccept(row.id)">{{ $t('invitation.accept') }}</el-button>
            <el-button size="small" type="danger" @click="handleReject(row.id)">{{ $t('invitation.reject') }}</el-button>
          </template>
          <span v-else style="color:var(--el-text-color-secondary);font-size:12px">—</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { api } from '../../api'

const { t } = useI18n()

const loading = ref(false)
const items = ref<any[]>([])
const page = ref(1)
const limit = 20
const total = ref(0)
const filter = reactive({ status: '' as string })

function statusType(s: string) {
  const m: Record<string, string> = { pending: 'warning', accepted: 'success', rejected: 'info' }
  return m[s] || 'info'
}

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, limit }
    if (filter.status) params.status = filter.status
    const res = await api.permissions.invitations.list(params)
    items.value = res.items ?? []
    total.value = res.total ?? items.value.length
  } catch { ElMessage.error(t('invitation.fetchFailed')) }
  finally { loading.value = false }
}

function resetFilter() {
  filter.status = ''
  page.value = 1
  fetchData()
}

async function handleAccept(id: string) {
  try {
    await api.permissions.invitations.accept(id, {} as any)
    ElMessage.success(t('invitation.acceptSuccess'))
    await fetchData()
  } catch { ElMessage.error(t('invitation.actionFailed')) }
}

async function handleReject(id: string) {
  try {
    await api.permissions.invitations.reject(id, {} as any)
    ElMessage.success(t('invitation.rejectSuccess'))
    await fetchData()
  } catch { ElMessage.error(t('invitation.actionFailed')) }
}

onMounted(fetchData)
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { margin-bottom: 16px; }
.filters :deep(.el-form-item) { margin-bottom: 0; }
</style>

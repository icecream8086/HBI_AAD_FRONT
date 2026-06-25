<template>
  <div>
    <h2>{{ $t('audit.title') }}</h2>
    <el-card class="filters">
      <el-form :inline="true" @submit.prevent="fetchData">
        <el-form-item :label="$t('audit.minLevel')">
          <el-select v-model="f.levelMin" clearable :placeholder="$t('table.selectPlaceholder')" style="width:140px">
            <el-option label="0 EMERG" :value="0" />
            <el-option label="1 ALERT" :value="1" />
            <el-option label="2 CRIT" :value="2" />
            <el-option label="3 ERR" :value="3" />
            <el-option label="4 WARNING" :value="4" />
            <el-option label="5 NOTICE" :value="5" />
            <el-option label="6 INFO" :value="6" />
            <el-option label="7 DEBUG" :value="7" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('audit.facility')">
          <el-input v-model="f.facility" :placeholder="$t('audit.facilityPlaceholder')" style="width:150px" clearable />
        </el-form-item>
        <el-form-item :label="$t('audit.search')">
          <el-input v-model="f.search" :placeholder="$t('audit.searchPlaceholder')" style="width:200px" clearable />
        </el-form-item>
        <el-form-item :label="$t('audit.requestId')">
          <el-input v-model="f.requestId" placeholder="req_xxx" style="width:150px" clearable />
        </el-form-item>
        <el-form-item :label="$t('audit.actorIdRaw')">
          <el-input v-model="f.actorId" placeholder="user_xxx" style="width:150px" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">{{ $t('audit.query') }}</el-button>
          <el-button @click="resetFilter">{{ $t('audit.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="logs || []" v-loading="loading" stripe :empty-text="$t('audit.empty')" @row-click="openDetail">
      <el-table-column :label="$t('audit.time')" width="170">
        <template #default="{ row }">{{ fmt(row.timestamp) }}</template>
      </el-table-column>
      <el-table-column :label="$t('audit.level')" width="80">
        <template #default="{ row }">
          <el-tag :type="levelType(row.level)" size="small">{{ levelName(row.level) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="facility" :label="$t('audit.facility')" width="120" />
      <el-table-column :label="$t('audit.actor')" width="110" show-overflow-tooltip>
        <template #default="{ row }">{{ userName(row.actorId) }}</template>
      </el-table-column>
      <el-table-column prop="message" :label="$t('audit.message')" min-width="260" show-overflow-tooltip />
      <el-table-column :label="$t('audit.requestId')" width="110">
        <template #default="{ row }">
          <code v-if="row.requestId" style="font-size:11px">{{ shortId(row.requestId) }}</code>
          <span v-else class="no-reqid">-</span>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="total > pageSize" class="pagination-bar">
      <el-button :disabled="pageIndex <= 0" @click="goPrev">← Previous</el-button>
      <span class="page-indicator">Page {{ pageIndex + 1 }} / {{ Math.ceil(total / pageSize) || 1 }} ({{ total }} total)</span>
      <el-button :disabled="!hasNext" @click="goNext">Next →</el-button>
    </div>

    <!-- Detail dialog -->
    <el-dialog v-model="detail.show" :title="$t('audit.detailTitle')" width="700px">
      <template v-if="detail.item">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="$t('audit.id')" :span="2">
            <code style="font-size:12px">{{ detail.item.id }}</code>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('audit.time')">{{ fmt(detail.item.timestamp) }}</el-descriptions-item>
          <el-descriptions-item :label="$t('audit.level')">
            <el-tag :type="levelType(detail.item.level)" size="small">{{ levelName(detail.item.level) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('audit.facility')">{{ detail.item.facility }}</el-descriptions-item>
          <el-descriptions-item :label="$t('audit.requestId')">
            <code v-if="detail.item.requestId">{{ detail.item.requestId }}</code>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('audit.actor')">{{ userName(detail.item.actorId) }}</el-descriptions-item>
          <el-descriptions-item :label="$t('audit.actorIdRaw')" v-if="detail.item.actorId">
            <code>{{ detail.item.actorId }}</code>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('audit.message')" :span="2">
            <pre class="msg-pre">{{ detail.item.message }}</pre>
          </el-descriptions-item>
        </el-descriptions>
        <el-collapse v-if="detail.item.metadata && Object.keys(detail.item.metadata).length" style="margin-top:12px">
          <el-collapse-item :title="$t('audit.metadata')">
            <pre class="json-pre">{{ JSON.stringify(detail.item.metadata, null, 2) }}</pre>
          </el-collapse-item>
        </el-collapse>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { api } from '../api'

const { t } = useI18n()

const loading = ref(false)
const logs = ref<AuditLog[]>([])
const pageSize = ref(20)
const total = ref(0)
const pageIndex = ref(0)
const hasNext = ref(false)
const f = reactive({ levelMin: '' as number | string, facility: '', search: '', requestId: '', actorId: '' })

const LEVEL_NAMES: Record<number, string> = { 0:'EMERG',1:'ALERT',2:'CRIT',3:'ERR',4:'WARNING',5:'NOTICE',6:'INFO',7:'DEBUG' }
const LEVEL_TAGS: Record<number, string> = { 0:'danger',1:'danger',2:'danger',3:'danger',4:'warning',5:'warning',6:'info',7:'info' }
function levelName(lv: number) { return LEVEL_NAMES[lv] ?? `LEVEL_${lv}` }
function levelType(lv: number) { return LEVEL_TAGS[lv] ?? 'info' }

// User name resolution
const userMap = ref<Record<string, string>>({})
async function loadUsers() {
  try {
    const users = await api.users.list({ limit: 200 }).then(r => r.items)
    userMap.value = Object.fromEntries(users.map(u => [u.id, u.name || u.email]))
  } catch { /* ignore */ }
}
function userName(id?: string | null): string {
  if (!id) return '-'
  return userMap.value[id] || id.slice(0, 12)
}

function shortId(id: string) { return id.length > 12 ? id.slice(0, 12) + '…' : id }

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

// Detail dialog
const detail = reactive({ show: false, item: null as AuditLog | null })
function openDetail(row: AuditLog) {
  detail.item = row
  detail.show = true
}

function resetFilter() {
  f.levelMin = ''
  f.facility = ''
  f.search = ''
  f.requestId = ''
  f.actorId = ''
  pageIndex.value = 0
  hasNext.value = false
  fetchData()
}

function normalizeLogEntry(item: any): AuditLog {
  return typeof item === 'string' ? JSON.parse(item) : item
}

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: pageIndex.value, pageSize: pageSize.value }
    if (f.levelMin !== '') params.levelMin = f.levelMin
    if (f.facility) params.facility = f.facility
    if (f.search) params.search = f.search
    if (f.requestId) params.requestId = f.requestId
    if (f.actorId) params.actorId = f.actorId
    const res = await api.audit.logs.list(params)
    const raw = res.entries ?? res.lines ?? res.items ?? []
    logs.value = raw.map(normalizeLogEntry)
    total.value = res.total ?? logs.value.length
    hasNext.value = !!res.hasNext
    if (res.page !== undefined) pageIndex.value = res.page
    if (res.pageSize !== undefined) pageSize.value = res.pageSize
  } catch (e) { console.error(e); ElMessage.error(t('audit.fetchFailed')) }
  finally { loading.value = false }
}

function goNext() {
  if (!hasNext.value) return
  pageIndex.value++
  fetchData()
}

function goPrev() {
  if (pageIndex.value <= 0) return
  pageIndex.value--
  fetchData()
}

onMounted(async () => {
  await loadUsers()
  await fetchData()
})
</script>

<style scoped>
.filters { margin-bottom: 16px; }
.pagination-bar { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 16px; }
.page-indicator { font-size: 14px; color: var(--el-text-color-secondary); }
.no-reqid { color: var(--el-text-color-placeholder); }
.msg-pre {
  margin: 0; white-space: pre-wrap; word-break: break-word;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 12px; line-height: 1.5; background: var(--el-fill-color-light);
  padding: 8px; border-radius: 4px; max-height: 200px; overflow-y: auto;
}
.json-pre {
  margin: 0; white-space: pre-wrap; word-break: break-word;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 12px; line-height: 1.5;
}
</style>

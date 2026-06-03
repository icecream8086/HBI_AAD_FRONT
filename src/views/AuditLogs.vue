<template>
  <div>
    <h2>审计日志</h2>
    <el-card class="filters">
      <el-form :inline="true" @submit.prevent="fetchData">
        <el-form-item label="最低级别">
          <el-select v-model="f.levelMin" clearable placeholder="全部" style="width:140px">
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
        <el-form-item label="设施">
          <el-input v-model="f.facility" placeholder="过滤设施" style="width:150px" clearable />
        </el-form-item>
        <el-form-item label="搜索">
          <el-input v-model="f.search" placeholder="搜索消息内容" style="width:200px" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="f={levelMin:'',facility:'',search:''};fetchData()">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="logs || []" v-loading="loading" stripe empty-text="暂无日志">
      <el-table-column label="时间" width="180">
        <template #default="{ row }">{{ fmt(row.timestamp) }}</template>
      </el-table-column>
      <el-table-column prop="level" label="级别" width="100">
        <template #default="{ row }">
          <el-tag :type="levelType(row.level)" size="small">{{ levelName(row.level) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="facility" label="设施" width="130" />
      <el-table-column prop="message" label="消息" min-width="300" show-overflow-tooltip />
    </el-table>
    <el-pagination
      v-if="total > pageSize"
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 15, 30, 50]"
      layout="total, sizes, prev, pager, next"
      @size-change="fetchData"
      @current-change="fetchData"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../api'

const loading = ref(false)
const logs = ref<AuditLog[]>([])
const page = ref(1)
const pageSize = ref(15)
const total = ref(0)
const f = reactive({ levelMin: '' as number | string, facility: '', search: '' })

const LEVEL_NAMES: Record<number, string> = { 0:'EMERG',1:'ALERT',2:'CRIT',3:'ERR',4:'WARNING',5:'NOTICE',6:'INFO',7:'DEBUG' }
const LEVEL_TAGS: Record<number, string> = { 0:'danger',1:'danger',2:'danger',3:'danger',4:'warning',5:'warning',6:'info',7:'info' }
function levelName(lv: number) { return LEVEL_NAMES[lv] ?? `LEVEL_${lv}` }
function levelType(lv: number) { return LEVEL_TAGS[lv] ?? 'info' }

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, limit: pageSize.value }
    if (f.levelMin !== '') params.levelMin = f.levelMin
    if (f.facility) params.facility = f.facility
    if (f.search) params.search = f.search
    const res = await api.extract<{ lines: AuditLog[]; total: number }>(api.audit.apiAuditLogsGet({ params }))
    logs.value = (res.lines || []).map((l: any) => typeof l === 'string' ? JSON.parse(l) : l)
    total.value = res.total ?? logs.value.length
  } catch (e) { console.error(e); ElMessage.error('获取日志失败') }
  finally { loading.value = false }
}

onMounted(fetchData)
</script>

<style scoped>
.filters { margin-bottom: 16px; }
</style>

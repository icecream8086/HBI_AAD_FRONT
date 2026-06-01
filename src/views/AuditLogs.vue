<template>
  <div>
    <h2>审计日志</h2>
    <el-card class="filters">
      <el-form :inline="true" @submit.prevent="fetchData">
        <el-form-item label="级别">
          <el-select v-model="f.levelMax" clearable placeholder="最大级别" style="width:120px">
            <el-option label="DEBUG" value="DEBUG" />
            <el-option label="INFO" value="INFO" />
            <el-option label="WARN" value="WARN" />
            <el-option label="ERROR" value="ERROR" />
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
          <el-button @click="f={levelMax:'',facility:'',search:''};fetchData()">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="logs" v-loading="loading" stripe empty-text="暂无日志">
      <el-table-column label="时间" width="180">
        <template #default="{ row }">{{ fmt(row.timestamp) }}</template>
      </el-table-column>
      <el-table-column prop="level" label="级别" width="80">
        <template #default="{ row }">
          <el-tag :type="row.level==='ERROR'?'danger':row.level==='WARN'?'warning':'info'" size="small">{{ row.level }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="facility" label="设施" width="130" />
      <el-table-column prop="message" label="消息" min-width="300" show-overflow-tooltip />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../api'

const loading = ref(false)
const logs = ref<AuditLog[]>([])
const f = reactive({ levelMax: '', facility: '', search: '' })

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

async function fetchData() {
  loading.value = true
  try { logs.value = await api.extractLines<AuditLog>(api.audit.apiAuditLogsGet()) }
  catch { ElMessage.error('获取日志失败') }
  finally { loading.value = false }
}

onMounted(fetchData)
</script>

<style scoped>
.filters { margin-bottom: 16px; }
</style>

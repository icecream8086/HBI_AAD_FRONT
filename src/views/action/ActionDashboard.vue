<template>
  <div v-loading="loading">
    <div class="page-head">
      <h2>{{ $t('action.dashboardTitle') }}</h2>
    </div>

    <el-row
      v-if="stats"
      :gutter="16"
    >
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">
            {{ stats.totalRuns }}
          </div>
          <div class="stat-label">
            {{ $t('action.totalRuns') }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value active">
            {{ stats.activeRuns }}
          </div>
          <div class="stat-label">
            {{ $t('action.activeRuns') }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div
            class="stat-value"
            :class="stats.successRate >= 80 ? 'success' : 'warning'"
          >
            {{ stats.successRate?.toFixed(1) }}%
          </div>
          <div class="stat-label">
            {{ $t('action.successRate') }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">
            {{ stats.runnersOnline }}
          </div>
          <div class="stat-label">
            {{ $t('action.runnersOnline') }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row
      v-if="stats"
      :gutter="16"
      style="margin-top:16px"
    >
      <el-col :span="12">
        <el-card>
          <template #header>
            <strong>{{ $t('action.byTrigger') }}</strong>
          </template>
          <div v-if="stats.byTrigger && Object.keys(stats.byTrigger).length">
            <div
              v-for="(v, k) in stats.byTrigger"
              :key="k"
              class="trigger-row"
            >
              <span class="trigger-name">{{ k }}</span>
              <el-progress
                :percentage="pct(v, totalFromTrigger)"
                :color="triggerColor(k)"
                :show-text="false"
                style="flex:1;margin:0 12px"
              />
              <span class="trigger-count">{{ v }}</span>
            </div>
          </div>
          <div
            v-else
            class="dim"
          >
            -
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <strong>{{ $t('action.byStatus') }}</strong>
          </template>
          <div v-if="stats.byStatus && Object.keys(stats.byStatus).length">
            <div
              v-for="(v, k) in stats.byStatus"
              :key="k"
              class="trigger-row"
            >
              <span class="trigger-name">{{ k }}</span>
              <el-progress
                :percentage="pct(v, totalFromStatus)"
                :color="statusBarColor(k)"
                :show-text="false"
                style="flex:1;margin:0 12px"
              />
              <span class="trigger-count">{{ v }}</span>
            </div>
          </div>
          <div
            v-else
            class="dim"
          >
            -
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { api } from '../../api'

const { t } = useI18n()

const loading = ref(false)
const stats = ref<ActionDashboard | null>(null)

const totalFromTrigger = computed(() => stats.value ? Object.values(stats.value.byTrigger || {}).reduce((a, b) => a + b, 0) : 1)
const totalFromStatus = computed(() => stats.value ? Object.values(stats.value.byStatus || {}).reduce((a, b) => a + b, 0) : 1)

function pct(v: number, total: number) { return total ? Math.round((v / total) * 100) : 0 }

function triggerColor(k: string) {
  const m: Record<string, string> = { manual: '#409EFF', cron: '#E6A23C', webhook: '#67C23A', http: '#909399', shared_link: '#F56C6C' }
  return m[k] || '#409EFF'
}

function statusBarColor(k: string) {
  const m: Record<string, string> = { Success: '#67C23A', Failure: '#F56C6C', Pending: '#909399', Running: '#409EFF' }
  return m[k] || '#409EFF'
}

async function fetchStats() {
  loading.value = true
  try {
    stats.value = await api.actions.dashboard.stats()
  } catch { ElMessage.error(t('action.fetchStatsFailed')) }
  finally { loading.value = false }
}

onMounted(fetchStats)
</script>

<style scoped>
.page-head { margin-bottom: 16px; }
.stat-card { text-align: center; }
.stat-value { font-size: 32px; font-weight: bold; color: var(--el-text-color-primary); }
.stat-value.active { color: var(--el-color-primary); }
.stat-value.success { color: var(--el-color-success); }
.stat-value.warning { color: var(--el-color-warning); }
.stat-label { font-size: 13px; color: var(--el-text-color-secondary); margin-top: 4px; }
.trigger-row { display: flex; align-items: center; margin-bottom: 12px; }
.trigger-name { width: 80px; font-size: 13px; text-transform: capitalize; }
.trigger-count { width: 40px; text-align: right; font-size: 13px; color: var(--el-text-color-secondary); }
.dim { color: var(--el-text-color-secondary); font-size: 13px; }
</style>

<template>
  <div class="dashboard">
    <h2>{{ $t('page.dashboard') }}</h2>

    <!-- Stat cards -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6" v-for="card in statCards" :key="card.label">
        <el-card shadow="hover" :body-style="{ padding: '20px' }">
          <div class="stat-card">
            <div class="stat-label">{{ card.label }}</div>
            <div class="stat-value">{{ card.value }}</div>
            <el-tag :type="card.tagType" size="small" v-if="card.tag">{{ card.tag }}</el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="row-section">
      <!-- Server info -->
      <el-col :span="14">
        <el-card>
          <template #header>{{ $t('dashboard.serverInfo') }}</template>
          <el-descriptions :column="2" border>
            <el-descriptions-item :label="$t('dashboard.name')">{{ info.name || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="$t('dashboard.version')">{{ info.version || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="$t('dashboard.platform')">{{ info.platform || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="$t('dashboard.uptime')">{{ formatUptime(info.uptime) }}</el-descriptions-item>
            <el-descriptions-item :label="$t('dashboard.features')" :span="2">
              <el-tag v-for="f in info.features" :key="f" size="small" class="tag">{{ f }}</el-tag>
              <span v-if="!info.features?.length">-</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- Quick actions -->
      <el-col :span="10">
        <el-card>
          <template #header>{{ $t('dashboard.quickActions') }}</template>
          <div class="quick-actions">
            <el-button type="primary" @click="$router.push('/sandboxes')">
              {{ $t('dashboard.manageSandboxes') }}
            </el-button>
            <el-button @click="$router.push('/templates')">
              {{ $t('dashboard.manageTemplates') }}
            </el-button>
            <el-button @click="$router.push('/audit')">
              {{ $t('dashboard.viewAudit') }}
            </el-button>
          </div>
        </el-card>

        <el-card class="user-card">
          <template #header>{{ $t('dashboard.currentUser') }}</template>
          <div v-if="user">
            <p><strong>{{ user.name }}</strong> ({{ user.email }})</p>
            <el-tag :type="roleTag" size="small">{{ user.role }}</el-tag>
          </div>
          <p v-else class="muted">{{ $t('dashboard.notLoggedIn') }}</p>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { api } from '../api'

const { t } = useI18n()
const store = useStore<State>()
const user = computed(() => store.state.auth.currentUser)
const roleTag = computed(() => {
  const m: Record<string, string> = { root: 'danger', Operator: 'warning', Viewer: 'info' }
  return m[user.value?.role || ''] || 'info'
})

const info = reactive<ServerInfo>({ name: '', version: '', platform: '', features: [], uptime: 0, storeMetrics: {} })
const statCards = reactive([
  { label: t('menu.sandboxes'), value: 0, tag: '', tagType: '' },
  { label: t('menu.templates'), value: 0, tag: '', tagType: '' },
  { label: t('menu.images'), value: 0, tag: '', tagType: '' },
  { label: t('menu.users'), value: 0, tag: '', tagType: '' },
])

function formatUptime(ms: number): string {
  if (!ms) return '-'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${d}d ${h}h ${m}m`
}

onMounted(async () => {
  try { Object.assign(info, await api.info.get() as ServerInfo) } catch { /* ignore */ }

  try {
    const [sb, tm, im, us] = await Promise.allSettled([
      api.sandboxes.list({ limit: 200 }).then(r => r.items),
      api.templates.list({ limit: 200 }).then(r => r.items),
      api.topology.images.list({ limit: 200 }).then(r => r.items),
      api.users.list({ limit: 200 }).then(r => r.items),
    ])
    if (sb.status === 'fulfilled') { statCards[0].value = sb.value.length; statCards[0].tag = t('dashboard.active') }
    if (tm.status === 'fulfilled') statCards[1].value = tm.value.length
    if (im.status === 'fulfilled') statCards[2].value = im.value.length
    if (us.status === 'fulfilled') statCards[3].value = us.value.length
  } catch { /* ignore */ }
})
</script>

<style scoped>
.dashboard { padding: 16px; }
.stat-cards { margin-bottom: 16px; }
.stat-card { text-align: center; }
.stat-label { color: var(--el-text-color-secondary); font-size: 14px; }
.stat-value { font-size: 32px; font-weight: bold; margin: 8px 0; }
.tag { margin-right: 4px; margin-bottom: 4px; }
.row-section { margin-top: 16px; }
.user-card { margin-top: 16px; }
.quick-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.muted { color: var(--el-text-color-secondary); }
</style>

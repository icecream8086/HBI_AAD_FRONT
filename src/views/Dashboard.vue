<template>
  <div class="dashboard">
    <h2>{{ $t('page.dashboard') }}</h2>

    <!-- Stat cards -->
    <el-row
      :gutter="16"
      class="stat-cards"
    >
      <el-col
        v-for="card in statCards"
        :key="card.label"
        :span="6"
      >
        <el-card
          shadow="hover"
          :body-style="{ padding: '20px' }"
        >
          <div class="stat-card">
            <div class="stat-label">
              {{ card.label }}
            </div>
            <div class="stat-value">
              {{ card.value }}
            </div>
            <div
              v-if="card.breakdown"
              class="stat-tags"
            >
              <el-tag
                v-for="b in card.breakdown"
                :key="b.label"
                :type="b.type"
                size="small"
                effect="plain"
              >
                {{ b.label }} {{ b.count }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Resource summary -->
    <el-row
      v-if="resourceSummary"
      :gutter="16"
      class="row-section"
    >
      <el-col :span="24">
        <el-card>
          <template #header>
            {{ $t('dashboard.resourceSummary') || 'Resource Summary' }}
          </template>
          <el-descriptions
            :column="6"
            border
            size="small"
          >
            <el-descriptions-item label="CPU">
              {{ resourceSummary.totalCpu }} cores
            </el-descriptions-item>
            <el-descriptions-item label="Memory">
              {{ resourceSummary.totalMem }} Mi
            </el-descriptions-item>
            <el-descriptions-item label="GPU">
              {{ resourceSummary.totalGpu || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="Containers">
              {{ resourceSummary.totalContainers }}
            </el-descriptions-item>
            <el-descriptions-item label="Instances">
              {{ resourceSummary.instanceCount }}
            </el-descriptions-item>
            <el-descriptions-item label="Regions">
              {{ resourceSummary.regions.join(', ') || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row
      :gutter="16"
      class="row-section"
    >
      <!-- Server info -->
      <el-col :span="14">
        <el-card>
          <template #header>
            {{ $t('dashboard.serverInfo') }}
          </template>
          <el-descriptions
            :column="2"
            border
          >
            <el-descriptions-item :label="$t('dashboard.name')">
              {{ info.name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="$t('dashboard.version')">
              {{ info.version || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="$t('dashboard.platform')">
              {{ info.platform || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="$t('dashboard.uptime')">
              {{ formatUptime(info.uptime) }}
            </el-descriptions-item>
            <el-descriptions-item
              :label="$t('dashboard.features')"
              :span="2"
            >
              <el-tag
                v-for="f in info.features"
                :key="f"
                size="small"
                class="tag"
              >
                {{ f }}
              </el-tag>
              <span v-if="!info.features?.length">-</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- Quick actions -->
      <el-col :span="10">
        <el-card>
          <template #header>
            {{ $t('dashboard.quickActions') }}
          </template>
          <div class="quick-actions">
            <el-button
              type="primary"
              @click="$router.push('/sandboxes')"
            >
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
          <template #header>
            {{ $t('dashboard.currentUser') }}
          </template>
          <div v-if="user">
            <p><strong>{{ user.name }}</strong> ({{ user.email }})</p>
            <el-tag
              :type="roleTag"
              size="small"
            >
              {{ user.role }}
            </el-tag>
          </div>
          <p
            v-else
            class="muted"
          >
            {{ $t('dashboard.notLoggedIn') }}
          </p>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useTypedI18n } from '../composables/useTypedI18n'
import { api } from '../api/typed'

const { t } = useTypedI18n()
const store = useStore<State>()
const user = computed(() => store.state.auth.currentUser)
const roleTag = computed(() => {
  const m: Partial<Record<UserRole, string>> = { root: 'danger', Operator: 'warning', Viewer: 'info', wheel: 'success' }
  return m[user.value?.role || ''] || 'info'
})

const info = reactive<ServerInfo>({ name: '', version: '', platform: '', features: [], uptime: 0, storeMetrics: {} })
const statCards = reactive([
  { label: t('menu.sandboxes'), value: 0, breakdown: [] as { label: string; count: number; type: string }[] },
  { label: t('menu.templates'), value: 0, breakdown: [] as { label: string; count: number; type: string }[] },
  { label: t('menu.images'), value: 0, breakdown: [] as { label: string; count: number; type: string }[] },
  { label: t('menu.users'), value: 0, breakdown: [] as { label: string; count: number; type: string }[] },
])
const resourceSummary = ref<{
  totalCpu: number; totalMem: number; totalGpu: number
  totalContainers: number; instanceCount: number; regions: string[]
} | null>(null)

function formatUptime(ms: number): string {
  if (!ms) return '-'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${d}d ${h}h ${m}m`
}

function statusBreakdown(items: { status?: string }[]): { label: string; count: number; type: string }[] {
  const m: Record<string, { label: string; type: string }> = {
    Running: { label: 'Running', type: 'success' },
    Stopped: { label: 'Stopped', type: 'info' },
    Pending: { label: 'Pending', type: 'warning' },
    Scheduling: { label: 'Scheduling', type: 'warning' },
    Failed: { label: 'Failed', type: 'danger' },
    Terminated: { label: 'Terminated', type: 'info' },
    Deleted: { label: 'Deleted', type: 'info' },
  }
  const counts: Record<string, number> = {}
  for (const item of items) {
    const s = item.status || 'Unknown'
    counts[s] = (counts[s] || 0) + 1
  }
  return Object.entries(counts).map(([k, v]) => ({ label: m[k]?.label || k, count: v, type: m[k]?.type || 'info' }))
}

onMounted(async () => {
  try { Object.assign(info, await api.info.get()) } catch { /* ignore */ }

  try {
    const [sb, tm, im, us] = await Promise.allSettled([
      api.sandboxes.list({ limit: 200 }).then(r => r.items),
      api.templates.list({ limit: 200 }).then(r => r.items),
      api.topology.images.list({ limit: 200 }).then(r => r.items),
      api.users.list({ limit: 200 }).then(r => r.items),
    ])

    if (sb.status === 'fulfilled') {
      const items = sb.value
      statCards[0].value = items.length
      statCards[0].breakdown = statusBreakdown(items)

      let totalCpu = 0, totalMem = 0, totalGpu = 0, totalContainers = 0
      const regions = new Set<string>()
      for (const s of items) {
        const spec = s.config?.resourceSpec
        if (spec) {
          totalCpu += spec.cpu || 0
          totalMem += spec.memory || 0
          totalGpu += spec.gpu || 0
        }
        totalContainers += (s.containers?.length || s.config?.containers?.length || 0)
        if (s.config?.region) regions.add(s.config.region)
      }
      resourceSummary.value = {
        totalCpu, totalMem, totalGpu, totalContainers,
        instanceCount: items.length, regions: [...regions],
      }
    }
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
.stat-tags { display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; }
.tag { margin-right: 4px; margin-bottom: 4px; }
.row-section { margin-top: 16px; }
.user-card { margin-top: 16px; }
.quick-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.muted { color: var(--el-text-color-secondary); }
</style>

<template>
  <div class="dashboard">
    <h2>仪表盘</h2>

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
          <template #header>服务器信息</template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="名称">{{ info.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="版本">{{ info.version || '-' }}</el-descriptions-item>
            <el-descriptions-item label="平台">{{ info.platform || '-' }}</el-descriptions-item>
            <el-descriptions-item label="运行时间">{{ formatUptime(info.uptime) }}</el-descriptions-item>
            <el-descriptions-item label="功能" :span="2">
              <el-tag v-for="f in info.features" :key="f" size="small" class="tag">{{ f }}</el-tag>
              <span v-if="!info.features?.length">-</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- Quick actions -->
      <el-col :span="10">
        <el-card>
          <template #header>快捷操作</template>
          <div class="quick-actions">
            <el-button type="primary" @click="$router.push('/sandboxes')">
              管理容器实例
            </el-button>
            <el-button @click="$router.push('/templates')">
              管理模板
            </el-button>
            <el-button @click="$router.push('/audit')">
              查看审计
            </el-button>
          </div>
        </el-card>

        <el-card class="user-card">
          <template #header>当前用户</template>
          <div v-if="user">
            <p><strong>{{ user.name }}</strong> ({{ user.email }})</p>
            <el-tag :type="roleTag" size="small">{{ user.role }}</el-tag>
          </div>
          <p v-else class="muted">未登录</p>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { api } from '../api'

const store = useStore<State>()
const user = computed(() => store.state.auth.currentUser)
const roleTag = computed(() => {
  const m: Record<string, string> = { root: 'danger', Operator: 'warning', Viewer: 'info' }
  return m[user.value?.role || ''] || 'info'
})

const info = reactive<ServerInfo>({ name: '', version: '', platform: '', features: [], uptime: 0, storeMetrics: {} })
const statCards = reactive([
  { label: '容器实例', value: 0, tag: '', tagType: '' },
  { label: '模板', value: 0, tag: '', tagType: '' },
  { label: '镜像', value: 0, tag: '', tagType: '' },
  { label: '用户', value: 0, tag: '', tagType: '' },
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
  try { Object.assign(info, await api.extract<ServerInfo>(api.info.infoGet())) } catch { /* ignore */ }

  try {
    const [sb, tm, im, us] = await Promise.allSettled([
      api.extractItems<unknown>(api.sandboxes.apiSandboxesGet()),
      api.extractArray<unknown>(api.templates.apiTemplatesGet()),
      api.extractArray<unknown>(api.images.apiImagesGet()),
      api.extractArray<unknown>(api.users.apiUsersGet()),
    ])
    if (sb.status === 'fulfilled') { statCards[0].value = sb.value.length; statCards[0].tag = '活跃' }
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
.stat-label { color: var(--color-text-secondary); font-size: 14px; }
.stat-value { font-size: 32px; font-weight: bold; margin: 8px 0; }
.tag { margin-right: 4px; margin-bottom: 4px; }
.row-section { margin-top: 16px; }
.user-card { margin-top: 16px; }
.quick-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.muted { color: var(--color-text-secondary); }
</style>

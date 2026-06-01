<template>
  <div v-loading="loading">
    <el-button text @click="$router.push('/templates')" class="back">← 返回模板列表</el-button>

    <div v-if="template">
      <div class="page-head">
        <h2>{{ template.name }}</h2>
        <el-button type="primary" @click="handleApply">应用此模板</el-button>
      </div>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="ID" :span="2"><code>{{ template.id }}</code></el-descriptions-item>
        <el-descriptions-item label="可见性">
          <el-tag :type="template.visibility==='public'?'success':'info'" size="small">{{ template.visibility }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建者">{{ template.creatorId }}</el-descriptions-item>
        <el-descriptions-item label="依赖">{{ template.dependsOn?.join(', ') || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ fmt(template.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ fmt(template.updatedAt) }}</el-descriptions-item>
        <el-descriptions-item label="实例限制">
          {{ fmtLimit(template.instanceLimit) }}
        </el-descriptions-item>
        <el-descriptions-item label="资源绑定">
          {{ template.resourceBinding ? `${template.resourceBinding.domain||'*'}:${template.resourceBinding.port||'*'}` : '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-card class="section">
        <template #header>容器规格 ({{ template.spec?.containers?.length || 0 }})</template>
        <el-table :data="template.spec?.containers || []" stripe empty-text="无容器">
          <el-table-column prop="name" label="名称" width="150" />
          <el-table-column prop="image" label="镜像" min-width="200" />
          <el-table-column label="命令" width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ row.command?.join(' ') || '-' }}</template>
          </el-table-column>
          <el-table-column label="端口" width="150">
            <template #default="{ row }">{{ row.ports?.map((p:any)=>p.container+(p.host?`→${p.host}`:'')).join(', ') || '-' }}</template>
          </el-table-column>
          <el-table-column label="资源" width="120">
            <template #default="{ row }">{{ row.resources?.cpu ? `${row.resources.cpu}核` : '' }}{{ row.resources?.memory || '' }}</template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card class="section">
        <template #header>网络</template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="DNS">{{ template.spec?.network?.dns?.join(', ') || '-' }}</el-descriptions-item>
          <el-descriptions-item label="主机名">{{ template.spec?.network?.hostname || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>
    <el-empty v-else-if="!loading" description="模板不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '../../api'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const template = ref<SandboxTemplate | null>(null)

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }
function fmtLimit(l?: { fixed?: number; perSystem?: number; perUser?: number }) {
  if (!l) return '-'
  const parts: string[] = []
  if (l.fixed) parts.push(`固定:${l.fixed}`)
  if (l.perSystem) parts.push(`系统:${l.perSystem}`)
  if (l.perUser) parts.push(`用户:${l.perUser}`)
  return parts.join(' ') || '-'
}

onMounted(async () => {
  loading.value = true
  try { template.value = await api.extract<SandboxTemplate>(api.templates.apiTemplatesIdGet(route.params.id as string)) }
  catch { ElMessage.error('加载模板失败') }
  finally { loading.value = false }
})

async function handleApply() {
  try {
    await api.templates.apiTemplatesIdApplyPost(route.params.id as string, {} as any)
    ElMessage.success('模板已应用，沙箱创建中')
    router.push('/sandboxes')
  } catch { ElMessage.error('应用失败') }
}
</script>

<style scoped>
.back { margin-bottom: 8px; padding: 0; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section { margin-top: 16px; }
code { font-size: 12px; background: var(--color-bg); padding: 2px 6px; border-radius: 3px; }
</style>

<template>
  <div v-loading="loading">
    <el-button text @click="$router.push('/templates')" class="back">← 返回模板列表</el-button>

    <div v-if="template">
      <div class="page-head">
        <h2>{{ template.name }}</h2>
        <div class="actions">
          <el-button @click="openEdit">编辑</el-button>
          <el-button type="primary" @click="handleApply">应用此模板</el-button>
        </div>
      </div>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="ID" :span="2"><code>{{ template.id }}</code></el-descriptions-item>
        <el-descriptions-item label="可见性">
          <el-tag :type="template.visibility==='public'?'success':'info'" size="small">{{ template.visibility }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建者">{{ template.creatorId }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ fmt(template.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ fmt(template.updatedAt) }}</el-descriptions-item>
      </el-descriptions>

      <!-- DAG 继承链 -->
      <el-card class="section">
        <template #header>
          <span>DAG 继承链</span>
          <el-tag size="small" type="warning" style="margin-left:8px" v-if="template.dependsOn?.length">有依赖</el-tag>
          <el-tag size="small" type="info" style="margin-left:8px" v-else>根节点</el-tag>
        </template>
        <div v-if="template.dependsOn?.length">
          <div class="dag-chain">
            <el-tag v-for="(depId, i) in template.dependsOn" :key="depId" class="dag-node">
              <span class="dag-arrow" v-if="i > 0">→</span>
              <code>{{ depId }}</code>
            </el-tag>
          </div>
          <p class="muted">此模板继承自以上父模板，未定义的字段从父模板合并</p>
        </div>
        <el-empty v-else description="无依赖，此模板为独立根模板" :image-size="50" />
      </el-card>

      <!-- 规格 -->
      <el-card class="section">
        <template #header>
          <span>容器规格</span>
          <el-tag size="small" style="margin-left:8px" :type="hasDiff?'warning':'success'">
            {{ hasDiff ? '继承+覆盖' : '当前层定义' }}
          </el-tag>
        </template>
        <el-table :data="resolved?.spec?.containers || template.spec?.containers || []" stripe empty-text="无容器">
          <el-table-column prop="name" label="名称" width="120" />
          <el-table-column prop="image" label="镜像" min-width="200" />
          <el-table-column label="命令" width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ row.command?.join(' ') || '-' }}</template>
          </el-table-column>
          <el-table-column label="端口" width="160">
            <template #default="{ row }">{{ row.ports?.map((p:any)=>p.containerPort||p.container+(p.hostPort?`→${p.hostPort}`:'')).join(', ') || '-' }}</template>
          </el-table-column>
          <el-table-column label="资源" width="120">
            <template #default="{ row }">{{ row.resources?.limits?.cpu ? `${row.resources.limits.cpu}核` : '' }}{{ row.resources?.limits?.memory ? `/${row.resources.limits.memory}M` : '' }}</template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card class="section" v-if="resolved?.spec?.network || template.spec?.network">
        <template #header>网络</template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="DNS">{{ resolved?.spec?.network?.dns?.join(', ') || template.spec?.network?.dns?.join(', ') || '-' }}</el-descriptions-item>
          <el-descriptions-item label="主机名">{{ resolved?.spec?.network?.hostname || template.spec?.network?.hostname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="公网 IP">{{ resolved?.spec?.network?.allocatePublicIp !== false ? '分配' : '不分配' }}</el-descriptions-item>
          <el-descriptions-item label="重启策略">{{ resolved?.spec?.restartPolicy || template.spec?.restartPolicy || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="section" v-if="resolved?.spec?.provider || template.spec?.provider">
        <template #header>部署配置</template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Provider">{{ resolved?.spec?.provider || template.spec?.provider || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Region">{{ resolved?.spec?.region || template.spec?.region || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>
    <el-empty v-else-if="!loading" description="模板不存在" />

    <!-- Edit Dialog -->
    <el-dialog v-model="edit.show" title="编辑模板" width="700px">
      <el-form :model="edit.form" label-width="100px" v-loading="edit.saving">
        <el-form-item label="名称"><el-input v-model="edit.form.name" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="edit.form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="可见性">
          <el-radio-group v-model="edit.form.visibility">
            <el-radio value="public">公开</el-radio>
            <el-radio value="private">私有</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="依赖">
          <el-select v-model="edit.form.dependsOn" multiple filterable placeholder="继承模板" style="width:100%">
            <el-option v-for="t in allTemplates" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Provider">
          <el-input v-model="edit.form.provider" placeholder="如: podman" />
        </el-form-item>
        <el-form-item label="Region">
          <el-input v-model="edit.form.region" placeholder="如: local" />
        </el-form-item>
        <el-divider>容器</el-divider>
        <div v-for="(c, i) in edit.form.containers" :key="i" class="cont-row">
          <el-form-item :label="`#${i+1}`">
            <el-input v-model="c.name" placeholder="名称" style="width:120px;margin-right:6px" size="small" />
            <el-input v-model="c.image" placeholder="镜像" style="width:200px;margin-right:6px" size="small" />
            <el-button type="danger" size="small" @click="edit.form.containers.splice(i,1)" circle>−</el-button>
          </el-form-item>
        </div>
        <el-form-item><el-button size="small" @click="edit.form.containers.push({name:'',image:''})">+ 容器</el-button></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="edit.show=false">取消</el-button>
        <el-button type="primary" :loading="edit.saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '../../api'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const template = ref<SandboxTemplate | null>(null)
const resolved = ref<SandboxTemplate | null>(null)
const allTemplates = ref<SandboxTemplate[]>([])

const hasDiff = computed(() => {
  if (!template.value || !resolved.value) return false
  return JSON.stringify(template.value.spec) !== JSON.stringify(resolved.value.spec)
})

const edit = reactive({
  show: false, saving: false,
  form: { name: '', description: '', visibility: 'public' as 'public'|'private', dependsOn: [] as string[], provider: '', region: '', containers: [] as { name: string; image: string }[] },
})

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

function openEdit() {
  if (!template.value) return
  const t = template.value
  edit.form.name = t.name
  edit.form.description = (t as any).description || ''
  edit.form.visibility = t.visibility
  edit.form.dependsOn = t.dependsOn ? [...t.dependsOn] : []
  edit.form.provider = t.spec?.provider || ''
  edit.form.region = (t.spec as any)?.region || ''
  edit.form.containers = (t.spec?.containers || []).map(c => ({ name: c.name || '', image: c.image || '' }))
  if (!edit.form.containers.length) edit.form.containers.push({ name: '', image: '' })
  edit.show = true
}

async function load() {
  loading.value = true
  try {
    const [raw, res] = await Promise.all([
      api.extract<SandboxTemplate>(api.templates.apiTemplatesIdGet(route.params.id as string)),
      api.extract<SandboxTemplate>(api.templates.apiTemplatesIdResolvedGet(route.params.id as string)),
    ])
    template.value = raw; resolved.value = res
  } catch { ElMessage.error('加载模板失败') }
  finally { loading.value = false }
}

async function handleSave() {
  if (!edit.form.name) { ElMessage.warning('请输入名称'); return }
  edit.saving = true
  try {
    await api.templates.apiTemplatesIdPut(route.params.id as string, {
      name: edit.form.name,
      spec: { provider: edit.form.provider || undefined, region: edit.form.region || undefined, containers: edit.form.containers.filter(c => c.image) } as any,
      dependsOn: edit.form.dependsOn.length ? edit.form.dependsOn : undefined,
      visibility: edit.form.visibility,
    } as any)
    ElMessage.success('已保存')
    edit.show = false
    await load()
  } catch { ElMessage.error('保存失败') }
  finally { edit.saving = false }
}

async function handleApply() {
  try {
    await api.templates.apiTemplatesIdApplyPost(route.params.id as string, {} as any)
    ElMessage.success('模板已应用，沙箱创建中')
    router.push('/sandboxes')
  } catch { ElMessage.error('应用失败') }
}

onMounted(async () => {
  await load()
  try { allTemplates.value = await api.extract<SandboxTemplate[]>(api.templates.apiTemplatesGet()) } catch { /* ignore */ }
})
</script>

<style scoped>
.back { margin-bottom: 8px; padding: 0; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.actions { display: flex; gap: 8px; }
.section { margin-top: 16px; }
code { font-size: 12px; background: var(--el-bg-color-page); padding: 2px 6px; border-radius: 3px; }
.dag-chain { display: flex; flex-direction: column; gap: 8px; }
.dag-node { display: flex; align-items: center; gap: 4px; }
.dag-arrow { color: var(--el-color-warning); font-weight: bold; margin-right: 4px; }
.muted { color: var(--el-text-color-secondary); font-size: 12px; margin-top: 8px; }
.cont-row { margin-bottom: 8px; }
</style>

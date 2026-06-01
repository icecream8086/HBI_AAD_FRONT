<template>
  <div>
    <div class="page-head">
      <h2>模板</h2>
      <el-button type="primary" @click="openCreate">新建模板</el-button>
    </div>

    <el-table :data="templates" v-loading="loading" stripe empty-text="暂无模板">
      <el-table-column prop="name" label="名称" min-width="150" />
      <el-table-column label="容器" width="80">
        <template #default="{ row }">{{ row.spec?.containers?.length || 0 }}</template>
      </el-table-column>
      <el-table-column label="Provider" width="100">
        <template #default="{ row }">{{ row.spec?.provider || '-' }}</template>
      </el-table-column>
      <el-table-column label="Region" width="120">
        <template #default="{ row }">{{ row.spec?.region || '-' }}</template>
      </el-table-column>
      <el-table-column prop="dependsOn" label="DAG 依赖" width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ row.dependsOn?.join(', ') || '-' }}</template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/templates/${row.id}`)">详情</el-button>
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" @click="handleApply(row)">应用</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Create / Edit Dialog -->
    <el-dialog v-model="dlg.show" :title="dlg.isEdit ? '编辑模板' : '新建模板'" width="720px" :close-on-click-modal="false">
      <el-form :model="f" label-width="100px" v-loading="dlg.saving">
        <el-form-item label="名称"><el-input v-model="f.name" placeholder="模板名称" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="f.description" type="textarea" :rows="2" placeholder="可选" /></el-form-item>

        <el-divider>部署目标</el-divider>
        <el-form-item label="Provider"><el-input v-model="f.provider" placeholder="如: podman" style="width:200px" /></el-form-item>
        <el-form-item label="Region"><el-input v-model="f.region" placeholder="如: local" style="width:200px" /></el-form-item>

        <el-divider>DAG 继承</el-divider>
        <el-form-item label="父模板">
          <el-select v-model="f.dependsOn" multiple filterable placeholder="选择父模板继承" style="width:100%" @change="onDependsChange">
            <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>

        <!-- Inherited containers from parent -->
        <div v-if="inherited.length" class="inherited-box">
          <p class="inherited-title">从父模板继承的容器 (只读)</p>
          <el-tag v-for="(c, i) in inherited" :key="i" class="inherited-tag" type="info">
            {{ c.name || '?' }}:{{ c.image }}
          </el-tag>
        </div>

        <el-divider>容器 (当前层定义)</el-divider>
        <p v-if="inherited.length" class="hint">
          新增同名容器会覆盖父模板的容器定义
        </p>
        <div v-for="(c, i) in f.containers" :key="i" class="cont">
          <el-form-item :label="`#${i+1}`">
            <el-input v-model="c.name" placeholder="名称" style="width:140px;margin-right:8px" size="small" />
            <el-input v-model="c.image" placeholder="镜像 (如: nginx:latest)" style="width:300px;margin-right:8px" size="small" />
            <el-button type="danger" size="small" @click="f.containers.splice(i,1)" circle>−</el-button>
          </el-form-item>
        </div>
        <el-form-item>
          <el-button size="small" @click="f.containers.push({name:'',image:''})">+ 添加容器</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlg.show = false">取消</el-button>
        <el-button type="primary" :loading="dlg.saving" @click="handleSave">
          {{ dlg.isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'

const loading = ref(false)
const templates = ref<SandboxTemplate[]>([])
const inherited = ref<{ name: string; image: string }[]>([])

const dlg = reactive({ show: false, isEdit: false, editId: '', saving: false })
const f = reactive({
  name: '', description: '', provider: '', region: '',
  dependsOn: [] as string[],
  containers: [] as { name: string; image: string }[],
})

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

function specFromForm() {
  const spec: Record<string, any> = {}
  if (f.provider) spec.provider = f.provider
  if (f.region) spec.region = f.region
  const imgs = f.containers.filter(c => c.image)
  if (imgs.length) spec.containers = imgs
  return Object.keys(spec).length ? spec : undefined
}

/** When dependsOn changes, fetch parent's resolved spec to show inherited containers */
async function onDependsChange(ids: string[]) {
  inherited.value = []
  if (!ids.length) return
  // Fetch resolved spec of the LAST parent to get merged containers
  const parentId = ids[ids.length - 1]
  try {
    const resolved = await api.extract<SandboxTemplate>(api.templates.apiTemplatesIdResolvedGet(parentId))
    if (resolved?.spec?.containers?.length) {
      inherited.value = resolved.spec.containers.map(c => ({ name: c.name || '', image: c.image || '' }))
    }
  } catch { /* no resolved */ }
}

function openCreate() {
  dlg.isEdit = false; dlg.editId = ''
  f.name = ''; f.description = ''; f.provider = ''; f.region = ''
  f.dependsOn = []; f.containers = [{ name: '', image: '' }]
  inherited.value = []
  dlg.show = true
}

function openEdit(row: SandboxTemplate) {
  dlg.isEdit = true; dlg.editId = row.id
  f.name = row.name; f.description = (row as any).description || ''
  f.provider = row.spec?.provider || ''
  f.region = ((row.spec as any)?.region) || ''
  f.dependsOn = row.dependsOn ? [...row.dependsOn] : []
  f.containers = (row.spec?.containers || []).map(c => ({ name: c.name || '', image: c.image || '' }))
  if (!f.containers.length) f.containers.push({ name: '', image: '' })
  // Load inherited from parent
  if (f.dependsOn.length) onDependsChange(f.dependsOn)
  else inherited.value = []
  dlg.show = true
}

async function fetchData() {
  loading.value = true
  try { templates.value = await api.extract<SandboxTemplate[]>(api.templates.apiTemplatesGet()) }
  catch { ElMessage.error('获取模板失败') }
  finally { loading.value = false }
}

async function handleSave() {
  if (!f.name) { ElMessage.warning('请输入名称'); return }
  dlg.saving = true
  try {
    const body: Record<string, any> = { name: f.name, spec: specFromForm() }
    if (f.description) body.description = f.description
    if (f.dependsOn.length) body.dependsOn = f.dependsOn

    if (dlg.isEdit) {
      await api.templates.apiTemplatesIdPut(dlg.editId, body as any)
      ElMessage.success('已更新')
    } else {
      await api.templates.apiTemplatesPost(body as any)
      ElMessage.success('已创建')
    }
    dlg.show = false; await fetchData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error?.message || '操作失败')
  }
  finally { dlg.saving = false }
}

async function handleApply(row: SandboxTemplate) {
  try {
    await api.templates.apiTemplatesIdApplyPost(row.id, { name: row.name } as any)
    ElMessage.success('模板已应用，沙箱创建中')
  } catch { ElMessage.error('应用失败') }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除此模板？', '确认删除', { type: 'warning' })
    await api.templates.apiTemplatesIdDelete(id)
    ElMessage.success('已删除'); await fetchData()
  } catch { /* ignore */ }
}

onMounted(fetchData)
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.cont { margin-bottom: 6px; }
.inherited-box { margin: -8px 0 8px 100px; padding: 8px 12px; background: var(--el-bg-color-page); border-radius: 4px; }
.inherited-title { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 6px; }
.inherited-tag { margin-right: 4px; margin-bottom: 4px; }
.hint { font-size: 12px; color: var(--el-color-warning); margin: -12px 0 8px 100px; }
</style>

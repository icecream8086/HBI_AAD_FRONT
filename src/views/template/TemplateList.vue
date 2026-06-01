<template>
  <div>
    <div class="page-head">
      <h2>模板</h2>
      <el-button type="primary" @click="showCreate = true">新建模板</el-button>
    </div>

    <el-table :data="templates" v-loading="loading" stripe empty-text="暂无模板">
      <el-table-column prop="name" label="名称" min-width="150" />
      <el-table-column prop="visibility" label="可见性" width="100">
        <template #default="{ row }">
          <el-tag :type="row.visibility==='public'?'success':'info'" size="small">{{ row.visibility }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="容器数" width="80">
        <template #default="{ row }">{{ row.spec?.containers?.length || 0 }}</template>
      </el-table-column>
      <el-table-column prop="dependsOn" label="依赖" width="200" show-overflow-tooltip>
        <template #default="{ row }">{{ row.dependsOn?.join(', ') || '-' }}</template>
      </el-table-column>
      <el-table-column prop="creatorId" label="创建者" width="180" show-overflow-tooltip />
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/templates/${row.id}`)">详情</el-button>
          <el-button size="small" @click="handleApply(row)">应用</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Create dialog -->
    <el-dialog v-model="showCreate" title="新建模板" width="650px">
      <el-form :model="form" label-width="100px" v-loading="creating">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="模板名称" />
        </el-form-item>
        <el-form-item label="可见性">
          <el-radio-group v-model="form.visibility">
            <el-radio value="public">公开</el-radio>
            <el-radio value="private">私有</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="依赖">
          <el-select v-model="form.dependsOn" multiple filterable placeholder="继承模板" style="width:100%">
            <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-divider>容器规格</el-divider>
        <div v-for="(c, i) in form.spec.containers" :key="i" class="container-row">
          <el-form-item :label="`容器 ${i+1}`">
            <el-input v-model="c.name" placeholder="名称" style="width:140px;margin-right:8px" />
            <el-input v-model="c.image" placeholder="镜像 (如: nginx:latest)" style="width:250px;margin-right:8px" />
            <el-button type="danger" size="small" @click="form.spec.containers.splice(i,1)" circle>−</el-button>
          </el-form-item>
        </div>
        <el-form-item>
          <el-button size="small" @click="form.spec.containers.push({name:'',image:''})">+ 添加容器</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate=false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'

const router = useRouter()
const loading = ref(false)
const creating = ref(false)
const templates = ref<SandboxTemplate[]>([])
const showCreate = ref(false)

const form = reactive({
  name: '',
  visibility: 'public' as 'public' | 'private',
  dependsOn: [] as string[],
  spec: { containers: [{ name: '', image: '' }] },
})

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

async function fetchData() {
  loading.value = true
  try { templates.value = await api.extract<SandboxTemplate[]>(api.templates.apiTemplatesGet()) }
  catch { ElMessage.error('获取模板列表失败') }
  finally { loading.value = false }
}

async function handleCreate() {
  if (!form.name) { ElMessage.warning('请输入模板名称'); return }
  creating.value = true
  try {
    await api.templates.apiTemplatesPost({ name: form.name, spec: form.spec, dependsOn: form.dependsOn || undefined, visibility: form.visibility } as any)
    ElMessage.success('创建成功')
    showCreate.value = false
    form.name = ''; form.spec.containers = [{ name: '', image: '' }]; form.dependsOn = []
    await fetchData()
  } catch { ElMessage.error('创建失败') }
  finally { creating.value = false }
}

async function handleApply(t: SandboxTemplate) {
  try {
    await api.templates.apiTemplatesIdApplyPost(t.id, {} as any)
    ElMessage.success('模板已应用，沙箱创建中')
  } catch { ElMessage.error('应用失败') }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除此模板？', '确认删除', { type: 'warning' })
    await api.templates.apiTemplatesIdDelete(id)
    ElMessage.success('已删除')
    await fetchData()
  } catch { /* ignore */ }
}

onMounted(fetchData)
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.container-row { margin-bottom: 8px; }
</style>

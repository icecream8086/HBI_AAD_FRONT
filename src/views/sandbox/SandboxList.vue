<template>
  <div>
    <div class="page-head">
      <h2>沙箱</h2>
      <el-button type="primary" @click="showCreate = true">创建沙箱</el-button>
    </div>

    <!-- Filters -->
    <el-card class="filters">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="状态">
          <el-select v-model="filter.status" clearable placeholder="全部" style="width:140px">
            <el-option label="运行中" value="Running" />
            <el-option label="暂停" value="Stopped" />
            <el-option label="待定" value="Pending" />
            <el-option label="失败" value="Failed" />
            <el-option label="已终止" value="Terminated" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="filter.status='';fetchData()">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Table -->
    <el-table :data="sandboxes" v-loading="loading" stripe style="width:100%" empty-text="暂无沙箱">
      <el-table-column prop="id" label="ID" width="200" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small" effect="dark">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="容器数" width="90">
        <template #default="{ row }">{{ row.containers?.length || 0 }}</template>
      </el-table-column>
      <el-table-column prop="providerId" label="Provider" width="130" />
      <el-table-column label="网络" width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ row.network || '-' }}</template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/sandboxes/${row.id}`)">详情</el-button>
          <el-button size="small" :type="row.status==='Running'?'warning':''" @click="handleStop(row)" :disabled="row.status!=='Running'">停止</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Create Dialog -->
    <el-dialog v-model="showCreate" title="创建沙箱" width="700px">
      <el-form :model="createForm" label-width="100px" v-loading="creating">
        <el-form-item label="模板">
          <el-select v-model="createForm.templateId" filterable placeholder="选择模板" style="width:100%">
            <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Provider">
          <el-select v-model="createForm.provider" placeholder="选择平台" style="width:100%">
            <el-option v-for="p in platforms" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-divider>容器配置</el-divider>
        <el-form-item v-for="(c, i) in createForm.containers" :key="i" :label="`容器 ${i+1}`">
          <el-input v-model="c.image" placeholder="镜像名" style="width:300px;margin-right:8px" />
          <el-input v-model="c.name" placeholder="名称" style="width:150px" />
          <el-button type="danger" size="small" @click="createForm.containers.splice(i,1)" circle>−</el-button>
        </el-form-item>
        <el-form-item>
          <el-button size="small" @click="createForm.containers.push({name:'',image:''})">+ 添加容器</el-button>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'

const loading = ref(false)
const creating = ref(false)
const sandboxes = ref<Sandbox[]>([])
const templates = ref<SandboxTemplate[]>([])
const platforms = ref<string[]>([])
const showCreate = ref(false)
const filter = reactive({ status: '' })
const createForm = reactive({ templateId: '', provider: '', containers: [{ name: '', image: '' }] })

function statusType(s: string) {
  const m: Record<string, string> = { Running: 'success', Pending: 'warning', Failed: 'danger', Stopped: 'info', Terminated: 'info', Deleted: 'info', Scheduling: 'warning' }
  return m[s] || 'info'
}
function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

async function fetchData() {
  loading.value = true
  try { sandboxes.value = await api.extractItems<Sandbox>(api.sandboxes.apiSandboxesGet()) }
  catch { ElMessage.error('获取沙箱列表失败') }
  finally { loading.value = false }
}

async function handleStop(row: Sandbox) {
  try { await api.sandboxes.apiSandboxesIdStopPost(row.id); ElMessage.success('已停止'); await fetchData() }
  catch { ElMessage.error('停止失败') }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除此沙箱？所有数据将丢失。', '确认删除', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    await api.sandboxes.apiSandboxesIdDelete(id)
    ElMessage.success('已删除')
    await fetchData()
  } catch { /* canceled or error */ }
}

async function handleCreate() {
  creating.value = true
  try {
    // Use template apply if template selected
    if (createForm.templateId) {
      await api.templates.apiTemplatesIdApplyPost(createForm.templateId, {} as any)
    }
    ElMessage.success('沙箱创建中')
    showCreate.value = false
    await fetchData()
  } catch { ElMessage.error('创建失败') }
  finally { creating.value = false }
}

onMounted(async () => {
  await fetchData()
  try { templates.value = await api.extract<SandboxTemplate[]>(api.templates.apiTemplatesGet()) } catch { /* ignore */ }
  try { platforms.value = await api.extract<string[]>(api.platforms.apiPlatformsGet()) } catch { /* ignore */ }
})
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { margin-bottom: 16px; }
</style>

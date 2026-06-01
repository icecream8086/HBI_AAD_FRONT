<template>
  <div>
    <el-button text @click="$router.push('/permissions')" class="back">← 权限管理</el-button>
    <div class="page-head">
      <h2>权限组</h2>
      <el-button type="primary" size="small" @click="openCreate">新建权限组</el-button>
    </div>
    <el-table :data="groups" v-loading="loading" stripe empty-text="暂无权限组">
      <el-table-column prop="name" label="名称" min-width="150" />
      <el-table-column label="规则数" width="80">
        <template #default="{ row }">{{ row.rules?.length || 0 }}</template>
      </el-table-column>
      <el-table-column label="绑定用户组" width="150" show-overflow-tooltip>
        <template #default="{ row }">{{ row.userGroupIds?.join(', ') || '-' }}</template>
      </el-table-column>
      <el-table-column label="绑定用户" width="150" show-overflow-tooltip>
        <template #default="{ row }">{{ row.userIds?.join(', ') || '-' }}</template>
      </el-table-column>
      <el-table-column prop="dependsOn" label="依赖" width="200" show-overflow-tooltip>
        <template #default="{ row }">{{ row.dependsOn?.join(', ') || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog.show" :title="dialog.isEdit?'编辑权限组':'新建权限组'" width="650px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="权限组名称" />
        </el-form-item>
        <el-form-item label="依赖">
          <el-select v-model="form.dependsOn" multiple filterable placeholder="继承" style="width:100%">
            <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>

        <el-divider>规则</el-divider>
        <div v-for="(r, i) in form.rules" :key="i" class="rule-row">
          <el-radio-group v-model="r.effect" size="small">
            <el-radio-button value="allow">允许</el-radio-button>
            <el-radio-button value="deny">拒绝</el-radio-button>
          </el-radio-group>
          <el-input v-model="r.actions" placeholder="action1,action2" style="width:200px;margin:0 8px" size="small" />
          <el-input-number v-model="r.priority" :min="0" size="small" style="width:100px" />
          <el-button type="danger" size="small" @click="form.rules.splice(i,1)" circle>−</el-button>
        </div>
        <el-button size="small" @click="form.rules.push({effect:'allow',actions:'',priority:100})">+ 添加规则</el-button>
      </el-form>
      <template #footer>
        <el-button @click="dialog.show=false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ dialog.isEdit?'保存':'创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'

const loading = ref(false)
const saving = ref(false)
const groups = ref<PermissionGroup[]>([])
const dialog = reactive({ show: false, isEdit: false, editId: '' })
const form = reactive({
  name: '', dependsOn: [] as string[],
  rules: [] as { effect: 'allow' | 'deny'; actions: string; priority: number }[],
})

function openCreate() {
  dialog.isEdit = false; dialog.editId = ''
  form.name = ''; form.dependsOn = []; form.rules = []
  dialog.show = true
}
function openEdit(row: PermissionGroup) {
  dialog.isEdit = true; dialog.editId = row.id
  form.name = row.name; form.dependsOn = [...(row.dependsOn || [])]
  form.rules = (row.rules || []).map(r => ({ effect: r.effect, actions: r.actions.join(','), priority: r.priority }))
  dialog.show = true
}

async function fetchData() {
  loading.value = true
  try { groups.value = await api.extractItems<PermissionGroup>(api.permissions.apiPermissionsGroupsGet()) }
  catch { ElMessage.error('获取权限组失败') }
  finally { loading.value = false }
}

async function handleSave() {
  if (!form.name) { ElMessage.warning('请输入名称'); return }
  saving.value = true
  const rules = form.rules.map(r => ({
    effect: r.effect,
    actions: r.actions.split(',').map((a: string) => a.trim()).filter(Boolean),
    priority: r.priority,
  }))
  try {
    if (dialog.isEdit) {
      await api.permissions.apiPermissionsGroupsIdPut(dialog.editId, { rules } as any)
      ElMessage.success('已更新')
    } else {
      await api.permissions.apiPermissionsGroupsPost({ name: form.name, rules, dependsOn: form.dependsOn || undefined } as any)
      ElMessage.success('已创建')
    }
    dialog.show = false; await fetchData()
  } catch { ElMessage.error('操作失败') }
  finally { saving.value = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除？', '确认')
    await api.permissions.apiPermissionsGroupsIdDelete(id)
    ElMessage.success('已删除'); await fetchData()
  } catch { /* ignore */ }
}

onMounted(fetchData)
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.rule-row { display: flex; align-items: center; margin-bottom: 8px; }
</style>

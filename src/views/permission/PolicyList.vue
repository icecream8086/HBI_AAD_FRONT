<template>
  <div>
    <el-button text @click="$router.push('/permissions')" class="back">← 权限管理</el-button>
    <div class="page-head">
      <h2>策略</h2>
      <el-button type="primary" size="small" @click="openCreate">新建策略</el-button>
    </div>
    <el-table :data="policies" v-loading="loading" stripe empty-text="暂无策略" @sort-change="onSort">
      <el-table-column prop="name" label="名称" min-width="150" sortable="custom" />
      <el-table-column prop="effect" label="效果" width="80">
        <template #default="{ row }">
          <el-tag :type="row.effect==='allow'?'success':'danger'" size="small">{{ row.effect }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="动作" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">{{ row.actions?.join(', ') }}</template>
      </el-table-column>
      <el-table-column prop="resource" label="资源" min-width="150" show-overflow-tooltip />
      <el-table-column prop="priority" label="优先级" width="80" sortable="custom" />
      <el-table-column label="启用" width="70">
        <template #default="{ row }">
          <el-tag :type="row.enabled?'success':'info'" size="small">{{ row.enabled?'是':'否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-if="total > limit"
      v-model:current-page="page"
      v-model:page-size="limit"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next"
      @size-change="fetchData"
      @current-change="fetchData"
    />

    <el-dialog v-model="dialog.show" :title="dialog.isEdit?'编辑策略':'新建策略'" width="550px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name" placeholder="策略名称" /></el-form-item>
        <el-form-item label="效果">
          <el-radio-group v-model="form.effect">
            <el-radio value="allow">允许</el-radio><el-radio value="deny">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="动作">
          <el-select v-model="form.actions" multiple filterable allow-create default-first-option style="width:100%" placeholder="输入动作名后回车">
            <el-option v-for="a in actionPresets" :key="a" :label="a" :value="a" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源"><el-input v-model="form.resource" placeholder="如: sandbox:*" /></el-form-item>
        <el-form-item label="优先级"><el-input-number v-model="form.priority" :min="0" :max="9999" /></el-form-item>
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
const policies = ref<StoredPolicy[]>([])
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const dialog = reactive({ show: false, isEdit: false, editId: '' })
const form = reactive({ name: '', effect: 'allow' as 'allow' | 'deny', actions: [] as string[], resource: '', priority: 100 })
const actionPresets = ['sandbox:create', 'sandbox:delete', 'sandbox:stop', 'sandbox:view', 'template:create', 'template:edit', 'template:delete', 'template:view', 'image:pull', 'image:delete', 'user:manage', 'permission:manage']

function openCreate() { dialog.isEdit = false; dialog.editId = ''; form.name = ''; form.effect = 'allow'; form.actions = []; form.resource = ''; form.priority = 100; dialog.show = true }
function openEdit(row: StoredPolicy) { dialog.isEdit = true; dialog.editId = row.id; form.name = row.name; form.effect = row.effect; form.actions = [...row.actions]; form.resource = row.resource || ''; form.priority = row.priority; dialog.show = true }
function onSort(_: any) { fetchData() }

async function fetchData() {
  loading.value = true
  try {
    const res = await api.extractPage<StoredPolicy>(api.permissions.apiPermissionsPoliciesGet({ params: { page: page.value, limit: limit.value } }))
    policies.value = res.items; total.value = res.total
  } catch { ElMessage.error('获取策略失败') }
  finally { loading.value = false }
}

async function handleSave() {
  if (!form.name) { ElMessage.warning('请输入名称'); return }
  saving.value = true
  try {
    if (dialog.isEdit) {
      await api.permissions.apiPermissionsPoliciesIdPut(dialog.editId, { name: form.name, priority: form.priority })
      ElMessage.success('已更新')
    } else {
      await api.permissions.apiPermissionsPoliciesPost({ name: form.name, effect: form.effect, actions: form.actions, resource: form.resource })
      ElMessage.success('已创建')
    }
    dialog.show = false; await fetchData()
  } catch { ElMessage.error('操作失败') }
  finally { saving.value = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除此策略？', '确认')
    await api.permissions.apiPermissionsPoliciesIdDelete(id)
    ElMessage.success('已删除'); await fetchData()
  } catch { /* ignore */ }
}

onMounted(fetchData)
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>

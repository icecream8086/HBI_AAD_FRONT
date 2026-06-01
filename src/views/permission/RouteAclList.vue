<template>
  <div>
    <el-button text @click="$router.push('/permissions')" class="back">← 权限管理</el-button>
    <div class="page-head">
      <h2>路由 ACL</h2>
      <el-button type="primary" size="small" @click="openCreate">新建 ACL</el-button>
    </div>
    <el-table :data="acls" v-loading="loading" stripe empty-text="暂无 ACL">
      <el-table-column prop="method" label="方法" width="80">
        <template #default="{ row }"><el-tag size="small">{{ row.method }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="pathPrefix" label="路径" min-width="200" show-overflow-tooltip />
      <el-table-column prop="matchType" label="匹配" width="80" />
      <el-table-column prop="effect" label="效果" width="70">
        <template #default="{ row }">
          <el-tag :type="row.effect==='allow'?'success':'danger'" size="small">{{ row.effect }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="用户/组" width="180" show-overflow-tooltip>
        <template #default="{ row }">{{ row.userId || row.userGroupId || '-' }}</template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="80" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog.show" :title="dialog.isEdit?'编辑 ACL':'新建 ACL'" width="550px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="方法">
          <el-select v-model="form.method">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
            <el-option label="PATCH" value="PATCH" />
            <el-option label="*" value="*" />
          </el-select>
        </el-form-item>
        <el-form-item label="路径前缀">
          <el-input v-model="form.pathPrefix" placeholder="如: /api/sandboxes" />
        </el-form-item>
        <el-form-item label="匹配方式">
          <el-radio-group v-model="form.matchType">
            <el-radio value="prefix">前缀</el-radio>
            <el-radio value="exact">精确</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="效果">
          <el-radio-group v-model="form.effect">
            <el-radio value="allow">允许</el-radio>
            <el-radio value="deny">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="用户/组 ID">
          <el-input v-model="form.userId" placeholder="用户 ID 或用户组 ID" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="form.priority" :min="0" :max="9999" />
        </el-form-item>
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
const acls = ref<RouteAcl[]>([])
const dialog = reactive({ show: false, isEdit: false, editId: '' })
const form = reactive({ method: 'GET', pathPrefix: '', matchType: 'prefix' as 'prefix' | 'exact', effect: 'allow' as 'allow' | 'deny', userId: '', priority: 500 })

function openCreate() { dialog.isEdit = false; dialog.editId = ''; form.method = 'GET'; form.pathPrefix = ''; form.matchType = 'prefix'; form.effect = 'allow'; form.userId = ''; form.priority = 500; dialog.show = true }
function openEdit(row: RouteAcl) { dialog.isEdit = true; dialog.editId = row.id; form.method = row.method; form.pathPrefix = row.pathPrefix; form.matchType = row.matchType; form.effect = row.effect; form.userId = row.userId || row.userGroupId || ''; form.priority = row.priority; dialog.show = true }

async function fetchData() {
  loading.value = true
  try { acls.value = await api.extractItems<RouteAcl>(api.permissions.apiPermissionsRouteAclsGet()) } catch { ElMessage.error('获取 ACL 失败') }
  finally { loading.value = false }
}

async function handleSave() {
  if (!form.pathPrefix) { ElMessage.warning('请填写路径'); return }
  saving.value = true
  try {
    const payload = { method: form.method, pathPrefix: form.pathPrefix, matchType: form.matchType, effect: form.effect, userId: form.userId || undefined, priority: form.priority }
    if (dialog.isEdit) {
      await api.permissions.apiPermissionsRouteAclsIdPut(dialog.editId, payload as any)
      ElMessage.success('已更新')
    } else {
      await api.permissions.apiPermissionsRouteAclsPost(payload as any)
      ElMessage.success('已创建')
    }
    dialog.show = false; await fetchData()
  } catch { ElMessage.error('操作失败') }
  finally { saving.value = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除？', '确认')
    await api.permissions.apiPermissionsRouteAclsIdDelete(id)
    ElMessage.success('已删除'); await fetchData()
  } catch { /* ignore */ }
}

onMounted(fetchData)
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>

<template>
  <div>
    <el-button text @click="$router.push('/permissions')" class="back">← 权限管理</el-button>
    <div class="page-head">
      <h2>用户组</h2>
      <el-button type="primary" size="small" @click="openCreate">新建用户组</el-button>
    </div>
    <el-table :data="items" v-loading="loading" stripe empty-text="暂无用户组">
      <el-table-column prop="name" label="名称" min-width="150" />
      <el-table-column label="成员" width="300" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag v-for="mid in row.memberIds?.slice(0,5)" :key="mid" size="small" style="margin-right:4px">{{ shortId(mid) }}</el-tag>
          <span v-if="(row.memberIds?.length||0) > 5">+{{ row.memberIds.length - 5 }}</span>
          <span v-else-if="!row.memberIds?.length">-</span>
        </template>
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

    <el-dialog v-model="dialog.show" :title="dialog.isEdit?'编辑用户组':'新建用户组'" width="550px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="用户组名称" />
        </el-form-item>
        <el-form-item label="依赖">
          <el-select v-model="form.dependsOn" multiple filterable placeholder="继承" style="width:100%">
            <el-option v-for="g in items" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="成员">
          <el-select v-model="form.memberIds" multiple filterable placeholder="选择用户" style="width:100%">
            <el-option v-for="u in users" :key="u.id" :label="`${u.name} (${u.email})`" :value="u.id" />
          </el-select>
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
const items = ref<UserGroup[]>([])
const users = ref<User[]>([])
const dialog = reactive({ show: false, isEdit: false, editId: '' })
const form = reactive({ name: '', memberIds: [] as string[], dependsOn: [] as string[] })

function shortId(id: string) { return id.slice(0, 8) }

function openCreate() { dialog.isEdit = false; dialog.editId = ''; form.name = ''; form.memberIds = []; form.dependsOn = []; dialog.show = true }
function openEdit(row: UserGroup) { dialog.isEdit = true; dialog.editId = row.id; form.name = row.name; form.memberIds = [...(row.memberIds || [])]; form.dependsOn = [...(row.dependsOn || [])]; dialog.show = true }

async function fetchData() {
  loading.value = true
  try { items.value = await api.extractItems<UserGroup>(api.permissions.apiPermissionsUserGroupsGet()) } catch { ElMessage.error('获取用户组失败') }
  finally { loading.value = false }
}

async function handleSave() {
  if (!form.name) { ElMessage.warning('请输入名称'); return }
  saving.value = true
  try {
    if (dialog.isEdit) {
      await api.permissions.apiPermissionsUserGroupsIdPut(dialog.editId, { name: form.name, memberIds: form.memberIds } as any)
      ElMessage.success('已更新')
    } else {
      await api.permissions.apiPermissionsUserGroupsPost({ name: form.name, memberIds: form.memberIds, dependsOn: form.dependsOn || undefined } as any)
      ElMessage.success('已创建')
    }
    dialog.show = false; await fetchData()
  } catch { ElMessage.error('操作失败') }
  finally { saving.value = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除？', '确认')
    await api.permissions.apiPermissionsUserGroupsIdDelete(id)
    ElMessage.success('已删除'); await fetchData()
  } catch { /* ignore */ }
}

onMounted(async () => {
  await fetchData()
  try { users.value = await api.extract<User[]>(api.users.apiUsersGet()) } catch { /* ignore */ }
})
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>

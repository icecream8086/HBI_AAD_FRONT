<template>
  <div>
    <el-button text @click="$router.push('/permissions')" class="back">← 权限管理</el-button>
    <div class="page-head"><h2>用户组</h2><el-button type="primary" size="small" @click="openCreate">新建用户组</el-button></div>
    <el-table :data="items || []" v-loading="loading" stripe empty-text="暂无用户组">
      <el-table-column prop="name" label="名称" min-width="150" />
      <el-table-column label="成员" width="250" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag v-for="mid in (row.memberIds?.slice(0,4)||[])" :key="mid" size="small" style="margin-right:4px">{{ userName(mid) }}</el-tag>
          <span v-if="(row.memberIds?.length||0) > 4">+{{ row.memberIds.length - 4 }}</span>
          <span v-else-if="!row.memberIds?.length">-</span>
        </template>
      </el-table-column>
      <el-table-column label="绑定权限组" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag v-for="g in boundGroups(row.id)" :key="g.id" size="small" style="margin-right:4px;margin-bottom:4px">{{ g.name }}</el-tag>
          <span v-if="!boundGroups(row.id).length">-</span>
        </template>
      </el-table-column>
      <el-table-column label="依赖" width="160" show-overflow-tooltip><template #default="{ row }">{{ row.dependsOn?.map(id => groupName(id)).join(', ') || '-' }}</template></el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }"><el-button size="small" @click="openEdit(row)">编辑</el-button><el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button></template>
      </el-table-column>
    </el-table>
    <el-pagination v-if="total > limit" v-model:current-page="page" v-model:page-size="limit" :total="total" :page-sizes="[10,15,30,50]" layout="total, sizes, prev, pager, next" @size-change="fetchData" @current-change="fetchData" />

    <!-- 绑定权限组弹窗 -->
    <el-dialog v-model="permDlg.show" title="绑定权限组" width="600px">
      <div v-if="permDlg.groups.length">
        <div v-for="g in permDlg.groups" :key="g.id" class="perm-group-card">
          <div class="pg-header"><strong>{{ g.name }}</strong><el-tag size="small" type="info" style="margin-left:6px">{{ g.rules?.length || 0 }} 条规则</el-tag></div>
          <div v-if="g.dependsOn?.length" class="pg-deps">继承: {{ g.dependsOn.map(id => permGroupName(id)).join(', ') }}</div>
          <el-table :data="g.rules || []" size="small" empty-text="无规则">
            <el-table-column label="效果" width="60"><template #default="{ row: r }"><el-tag :type="r.effect==='allow'?'success':'danger'" size="small">{{ r.effect }}</el-tag></template></el-table-column>
            <el-table-column label="动作" min-width="180"><template #default="{ row: r }">{{ r.actions?.join(', ') }}</template></el-table-column>
            <el-table-column label="资源" width="120"><template #default="{ row: r }">{{ r.resource || '*' }}</template></el-table-column>
            <el-table-column label="优先级" width="70" prop="priority" />
          </el-table>
        </div>
      </div>
      <el-empty v-else description="此用户组未绑定任何权限组" :image-size="60" />
    </el-dialog>

    <el-dialog v-model="dialog.show" :title="dialog.isEdit?'编辑用户组':'新建用户组'" width="550px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="依赖"><el-select v-model="form.dependsOn" multiple filterable placeholder="继承" style="width:100%"><el-option v-for="g in items" :key="g.id" :label="g.name" :value="g.id" /></el-select></el-form-item>
        <el-form-item label="成员"><el-select v-model="form.memberIds" multiple filterable placeholder="选择用户" style="width:100%"><el-option v-for="u in users" :key="u.id" :label="`${u.name} (${u.email})`" :value="u.id" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialog.show=false">取消</el-button><el-button type="primary" :loading="saving" @click="handleSave">{{ dialog.isEdit?'保存':'创建' }}</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useResolver } from '../../composables/useResolver'
import { api } from '../../api'

const { load: loadRefs, userName, groupName, permGroupName } = useResolver()
const loading = ref(false); const saving = ref(false)
const items = ref<UserGroup[]>([]); const users = ref<User[]>([]); const page = ref(1); const limit = ref(15); const total = ref(0)
const allPermGroups = ref<PermissionGroup[]>([])
const dialog = reactive({ show: false, isEdit: false, editId: '' })
const form = reactive({ name: '', memberIds: [] as string[], dependsOn: [] as string[] })
const permDlg = reactive({ show: false, groups: [] as PermissionGroup[] })

function shortId(id: string) { return id.slice(0,8) }

function boundGroups(ugId: string): PermissionGroup[] {
  return allPermGroups.value.filter(pg => pg.userGroupIds?.includes(ugId))
}

function showPerms(row: UserGroup) {
  permDlg.groups = boundGroups(row.id)
  permDlg.show = true
}

function openCreate() { dialog.isEdit = false; dialog.editId = ''; form.name = ''; form.memberIds = []; form.dependsOn = []; dialog.show = true }
function openEdit(row: UserGroup) { dialog.isEdit = true; dialog.editId = row.id; form.name = row.name; form.memberIds = [...(row.memberIds||[])]; form.dependsOn = [...(row.dependsOn||[])]; dialog.show = true }
async function fetchData() {
  loading.value = true
  try { const r = await api.extractPage<UserGroup>(api.permissions.apiPermissionsUserGroupsGet({params:{page:page.value,limit:limit.value}})); items.value = r.items; total.value = r.total }
  catch { ElMessage.error('获取用户组失败') }
  finally { loading.value = false }
}
async function handleSave() {
  if (!form.name) { ElMessage.warning('请输入名称'); return }
  saving.value = true
  try {
    if (dialog.isEdit) { await api.permissions.apiPermissionsUserGroupsIdPut(dialog.editId, { name: form.name, memberIds: form.memberIds } as any); ElMessage.success('已更新') }
    else { await api.permissions.apiPermissionsUserGroupsPost({ name: form.name, memberIds: form.memberIds, dependsOn: form.dependsOn||undefined } as any); ElMessage.success('已创建') }
    dialog.show = false; await fetchData()
  } catch { ElMessage.error('操作失败') }
  finally { saving.value = false }
}
async function handleDelete(id: string) { try { await ElMessageBox.confirm('确定删除？','确认'); await api.permissions.apiPermissionsUserGroupsIdDelete(id); ElMessage.success('已删除'); await fetchData() } catch {/* ignore */} }
onMounted(async () => {
  await loadRefs()
  await fetchData()
  try { users.value = await api.extractArray<User>(api.users.apiUsersGet()) } catch {/* ignore */}
  try { allPermGroups.value = await api.extractItems<PermissionGroup>(api.permissions.apiPermissionsGroupsGet()) } catch {/* ignore */}
})
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.perm-group-card { margin-bottom: 12px; padding: 12px; border: 1px solid var(--el-border-color); border-radius: 6px; }
.pg-header { margin-bottom: 6px; }
.pg-deps { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 6px; }
</style>

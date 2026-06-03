<template>
  <div>
    <el-button
      text
      class="back"
      @click="$router.push('/permissions')"
    >
      ← 权限管理
    </el-button>
    <div class="page-head">
      <h2>权限组</h2><el-button
        type="primary"
        size="small"
        @click="openCreate"
      >
        新建权限组
      </el-button>
    </div>
    <el-table
      v-loading="loading" stripe
      :data="groups || []"
     
      empty-text="暂无权限组"
    >
      <el-table-column
        prop="name"
        label="名称"
        min-width="150"
      />
      <el-table-column
        label="规则数"
        width="70"
      >
        <template #default="{ row }">
          {{ row.rules?.length || 0 }}
        </template>
      </el-table-column>
      <el-table-column
        label="绑定用户组"
        min-width="180"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <el-tag
            v-for="g in resolveGroups(row.userGroupIds)"
            :key="g.id"
            size="small"
            style="margin-right:4px"
          >
            {{ g.name }}
          </el-tag>
          <span v-if="!row.userGroupIds?.length">-</span>
        </template>
      </el-table-column>
      <el-table-column
        label="绑定用户"
        min-width="180"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <el-tag
            v-for="u in resolveUsers(row.userIds)"
            :key="u.id"
            size="small"
            style="margin-right:4px"
          >
            {{ u.name }}
          </el-tag>
          <span v-if="!row.userIds?.length">-</span>
        </template>
      </el-table-column>
      <el-table-column
        label="依赖"
        min-width="180"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <el-tag
            v-for="g in resolveGroups(row.dependsOn)"
            :key="g.id"
            size="small"
            style="margin-right:4px"
          >
            {{ g.name }}
          </el-tag>
          <span v-if="!row.dependsOn?.length">-</span>
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        width="160"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button
            size="small"
            @click="openEdit(row)"
          >
            编辑
          </el-button><el-button
            size="small"
            type="danger"
            @click="handleDelete(row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-if="total > limit"
      v-model:current-page="page"
      v-model:page-size="limit"
      :total="total"
      :page-sizes="[10,15,30,50]"
      layout="total, sizes, prev, pager, next"
      @size-change="fetchData"
      @current-change="fetchData"
    />
    <el-dialog
      v-model="dialog.show"
      :title="dialog.isEdit?'编辑权限组':'新建权限组'"
      width="650px"
    >
      <el-form
        :model="form"
        label-width="100px"
      >
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="绑定用户组">
          <el-select
            v-model="form.userGroupIds"
            multiple
            filterable
            placeholder="选择用户组"
            style="width:100%"
          >
            <el-option
              v-for="g in allUg"
              :key="g.id"
              :label="g.name"
              :value="g.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="绑定用户">
          <el-select
            v-model="form.userIds"
            multiple
            filterable
            placeholder="选择用户"
            style="width:100%"
          >
            <el-option
              v-for="u in allUsers"
              :key="u.id"
              :label="`${u.name} (${u.email})`"
              :value="u.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="依赖">
          <el-select
            v-model="form.dependsOn"
            multiple
            filterable
            placeholder="继承权限组"
            style="width:100%"
          >
            <el-option
              v-for="g in groups"
              :key="g.id"
              :label="g.name"
              :value="g.id"
            />
          </el-select>
        </el-form-item>
        <el-divider>规则</el-divider>
        <div
          v-for="(r, i) in form.rules"
          :key="i"
          class="rule-row"
        >
          <el-radio-group
            v-model="r.effect"
            size="small"
          >
            <el-radio-button value="allow">
              允许
            </el-radio-button><el-radio-button value="deny">
              拒绝
            </el-radio-button>
          </el-radio-group>
          <el-input
            v-model="r.actions"
            placeholder="action1,action2"
            style="width:200px;margin:0 8px"
            size="small"
          />
          <el-input-number
            v-model="r.priority"
            :min="0"
            size="small"
            style="width:100px"
          />
          <el-button
            type="danger"
            size="small"
            circle
            @click="form.rules.splice(i,1)"
          >
            −
          </el-button>
        </div>
        <el-button
          size="small"
          @click="form.rules.push({effect:'allow',actions:'',priority:100})"
        >
          + 添加规则
        </el-button>
      </el-form>
      <template #footer>
        <el-button @click="dialog.show=false">
          取消
        </el-button><el-button
          type="primary"
          :loading="saving"
          @click="handleSave"
        >
          {{ dialog.isEdit?'保存':'创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'
const loading = ref(false); const saving = ref(false)
const groups = ref<PermissionGroup[]>([]); const page = ref(1); const limit = ref(15); const total = ref(0)
const allUg = ref<UserGroup[]>([]); const allUsers = ref<User[]>([])
const dialog = reactive({ show: false, isEdit: false, editId: '' })
const form = reactive({ name: '', userGroupIds: [] as string[], userIds: [] as string[], dependsOn: [] as string[], rules: [] as { effect: 'allow'|'deny'; actions: string; priority: number }[] })

function resolveGroups(ids?: string[]) {
  if (!ids?.length) return []
  return ids.map(id => {
    const g = allUg.value.find(x => x.id === id)
    return { id: g?.id || id, name: g?.name || id.slice(0,12) }
  })
}
function resolveUsers(ids?: string[]) {
  if (!ids?.length) return []
  return ids.map(id => {
    const u = allUsers.value.find(u => u.id === id)
    return { id: u?.id || id, name: u?.name || u?.email || id.slice(0,12) }
  })
}
function openCreate() { dialog.isEdit=false; dialog.editId=''; form.name=''; form.userGroupIds=[]; form.userIds=[]; form.dependsOn=[]; form.rules=[]; dialog.show=true }
function openEdit(row: PermissionGroup) { dialog.isEdit=true; dialog.editId=row.id; form.name=row.name; form.userGroupIds=[...(row.userGroupIds||[])]; form.userIds=[...(row.userIds||[])]; form.dependsOn=[...(row.dependsOn||[])]; form.rules=(row.rules||[]).map(r=>({effect:r.effect,actions:r.actions.join(','),priority:r.priority})); dialog.show=true }
async function fetchData() {
  loading.value = true
  try { const r = await api.extractPage<PermissionGroup>(api.permissions.apiPermissionsGroupsGet({params:{page:page.value,limit:limit.value}})); groups.value = r.items; total.value = r.total }
  catch { ElMessage.error('获取权限组失败') }
  finally { loading.value = false }
}
async function handleSave() {
  if (!form.name) { ElMessage.warning('请输入名称'); return }
  saving.value = true
  const rules = form.rules.map(r=>({effect:r.effect,actions:r.actions.split(',').map((a:string)=>a.trim()).filter(Boolean),priority:r.priority}))
  try {
    const body = { name: form.name, rules, userGroupIds: form.userGroupIds.length ? form.userGroupIds : undefined, userIds: form.userIds.length ? form.userIds : undefined, dependsOn: form.dependsOn.length ? form.dependsOn : undefined }
    if (dialog.isEdit) { await api.permissions.apiPermissionsGroupsIdPut(dialog.editId, body as any); ElMessage.success('已更新') }
    else { await api.permissions.apiPermissionsGroupsPost(body as any); ElMessage.success('已创建') }
    dialog.show=false; await fetchData()
  } catch { ElMessage.error('操作失败') }
  finally { saving.value = false }
}
async function handleDelete(id: string) { try { await ElMessageBox.confirm('确定删除？','确认'); await api.permissions.apiPermissionsGroupsIdDelete(id); ElMessage.success('已删除'); await fetchData() } catch {/* ignore */} }
onMounted(async () => { await fetchData(); try { allUg.value = await api.extractItems<UserGroup>(api.permissions.apiPermissionsUserGroupsGet()) } catch { /* ignore */ } try { allUsers.value = await api.extractArray<User>(api.users.apiUsersGet()) } catch { /* ignore */ } })
</script>
<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.rule-row { display: flex; align-items: center; margin-bottom: 8px; }
</style>

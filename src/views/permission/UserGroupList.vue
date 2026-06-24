<template>
  <div>
    <el-button text @click="$router.push('/permissions')" class="back">{{ $t('permission.back') }}</el-button>
    <div class="page-head"><h2>{{ $t('permission.userGroupTitle') }}</h2><el-button type="primary" size="small" @click="openCreate">{{ $t('permission.createUserGroup') }}</el-button></div>
    <el-card class="filters">
      <el-form inline>
        <el-form-item :label="$t('table.name')">
          <el-input v-model="filter.name" clearable style="width:200px" @clear="fetchData" @keyup.enter="fetchData" />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilter">{{ $t('table.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-table :data="items || []" v-loading="loading" stripe :empty-text="$t('table.empty')">
      <el-table-column prop="name" :label="$t('table.name')" min-width="150" />
      <el-table-column :label="$t('permission.members')" width="280" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag v-for="mid in (row.memberIds?.slice(0,3)||[])" :key="mid" size="small" style="margin-right:4px">
            {{ userName(mid) }}
            <el-tag v-if="row.adminIds?.includes(mid)" size="small" type="warning" style="margin-left:2px">admin</el-tag>
          </el-tag>
          <span v-if="(row.memberIds?.length||0) > 3">+{{ row.memberIds.length - 3 }}</span>
          <span v-else-if="!row.memberIds?.length">{{ $t('common.none') }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('permission.admins')" width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag v-for="aid in (row.adminIds||[])" :key="aid" size="small" type="warning" style="margin-right:4px">{{ userName(aid) }}</el-tag>
          <span v-if="!row.adminIds?.length">{{ $t('common.none') }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('permission.boundPermGroups')" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag v-for="g in boundGroups(row.id)" :key="g.id" size="small" style="margin-right:4px;margin-bottom:4px">{{ g.name }}</el-tag>
          <span v-if="!boundGroups(row.id).length">{{ $t('common.none') }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('permission.dependencies')" width="160" show-overflow-tooltip><template #default="{ row }">{{ row.dependsOn?.map(id => groupName(id)).join(', ') || $t('common.none') }}</template></el-table-column>
      <el-table-column :label="$t('table.actions')" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">{{ $t('table.edit') }}</el-button>
          <el-button size="small" @click="openInvite(row)">{{ $t('permission.invite') }}</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">{{ $t('table.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-if="total > limit" v-model:current-page="page" v-model:page-size="limit" :total="total" :page-sizes="[10,15,30,50]" layout="total, sizes, prev, pager, next" @size-change="fetchData" @current-change="fetchData" />

    <!-- Bound permission groups dialog -->
    <el-dialog v-model="permDlg.show" :title="$t('permission.boundPermGroups')" width="600px">
      <div v-if="permDlg.groups.length">
        <div v-for="g in permDlg.groups" :key="g.id" class="perm-group-card">
          <div class="pg-header"><strong>{{ g.name }}</strong><el-tag size="small" type="info" style="margin-left:6px">{{ $t('permission.ruleCount', { count: g.rules?.length || 0 }) }}</el-tag></div>
          <div v-if="g.dependsOn?.length" class="pg-deps">{{ $t('permission.inheritsFrom') }}{{ g.dependsOn.map(id => permGroupName(id)).join(', ') }}</div>
          <el-table :data="g.rules || []" size="small" :empty-text="$t('table.empty')">
            <el-table-column :label="$t('permission.effect')" width="60"><template #default="{ row: r }"><el-tag :type="r.effect==='allow'?'success':'danger'" size="small">{{ r.effect }}</el-tag></template></el-table-column>
            <el-table-column :label="$t('permission.actions')" min-width="180"><template #default="{ row: r }">{{ r.actions?.join(', ') }}</template></el-table-column>
            <el-table-column :label="$t('permission.resource')" width="120"><template #default="{ row: r }">{{ r.resource || '*' }}</template></el-table-column>
            <el-table-column :label="$t('permission.priority')" width="70" prop="priority" />
          </el-table>
        </div>
      </div>
      <el-empty v-else :description="$t('permission.noBoundPermGroups')" :image-size="60" />
    </el-dialog>

    <!-- Invite dialog -->
    <el-dialog v-model="inviteDlg.show" :title="$t('permission.inviteMember')" width="450px">
      <p style="margin-bottom:12px;color:var(--el-text-color-secondary);font-size:13px">
        {{ $t('permission.inviteTo') }}: <strong>{{ inviteDlg.groupName }}</strong>
      </p>
      <el-select v-model="inviteDlg.userId" filterable :placeholder="$t('permission.userSelectPlaceholder')" style="width:100%">
        <el-option v-for="u in users" :key="u.id" :label="`${u.name} (${u.email})`" :value="u.id" />
      </el-select>
      <template #footer>
        <el-button @click="inviteDlg.show=false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" :loading="inviting" @click="handleInvite">{{ $t('permission.invite') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialog.show" :title="dialog.isEdit?$t('permission.editUserGroup'):$t('permission.createUserGroup')" width="550px">
      <el-form :model="form" label-width="100px">
        <el-form-item :label="$t('permission.name')"><el-input v-model="form.name" /></el-form-item>
        <el-form-item :label="$t('permission.admins')"><el-select v-model="form.adminIds" multiple filterable :placeholder="$t('permission.userSelectPlaceholder')" style="width:100%"><el-option v-for="u in users" :key="u.id" :label="`${u.name} (${u.email})`" :value="u.id" /></el-select></el-form-item>
        <el-form-item :label="$t('permission.members')"><el-select v-model="form.memberIds" multiple filterable :placeholder="$t('permission.userSelectPlaceholder')" style="width:100%"><el-option v-for="u in users" :key="u.id" :label="`${u.name} (${u.email})`" :value="u.id" /></el-select></el-form-item>
        <el-form-item :label="$t('permission.dependencies')"><el-select v-model="form.dependsOn" multiple filterable :placeholder="$t('permission.depSelectPlaceholder')" style="width:100%"><el-option v-for="g in items" :key="g.id" :label="g.name" :value="g.id" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialog.show=false">{{ $t('table.cancel') }}</el-button><el-button type="primary" :loading="saving" @click="handleSave">{{ dialog.isEdit?$t('table.save'):$t('table.create') }}</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useResolver } from '../../composables/useResolver'
import { api } from '../../api'

const { t } = useI18n()
const { load: loadRefs, userName, groupName, permGroupName, users: refUsers, permGroups } = useResolver()
const loading = ref(false); const saving = ref(false); const inviting = ref(false)
const items = ref<UserGroup[]>([]); const users = ref<User[]>([]); const page = ref(1); const limit = ref(15); const total = ref(0)
const filter = reactive({ name: '' })
const allPermGroups = ref<PermissionGroup[]>([])
const dialog = reactive({ show: false, isEdit: false, editId: '' })
const form = reactive({ name: '', memberIds: [] as string[], adminIds: [] as string[], dependsOn: [] as string[] })
const permDlg = reactive({ show: false, groups: [] as PermissionGroup[] })
const inviteDlg = reactive({ show: false, groupId: '', groupName: '', userId: '' })

function shortId(id: string) { return id.slice(0,8) }

function boundGroups(ugId: string): PermissionGroup[] {
  return allPermGroups.value.filter(pg => pg.userGroupIds?.includes(ugId))
}

function showPerms(row: UserGroup) {
  permDlg.groups = boundGroups(row.id)
  permDlg.show = true
}

function openCreate() { dialog.isEdit = false; dialog.editId = ''; form.name = ''; form.memberIds = []; form.adminIds = []; form.dependsOn = []; dialog.show = true }
function openEdit(row: UserGroup) {
  dialog.isEdit = true; dialog.editId = row.id; form.name = row.name
  form.memberIds = [...(row.memberIds||[])]
  form.adminIds = [...(row.adminIds||[])]
  form.dependsOn = [...(row.dependsOn||[])]
  dialog.show = true
}
function openInvite(row: UserGroup) {
  inviteDlg.groupId = row.id
  inviteDlg.groupName = row.name
  inviteDlg.userId = ''
  inviteDlg.show = true
}

async function fetchData() {
  loading.value = true
  try { const params: Record<string, any> = {page:page.value,limit:limit.value}; if (filter.name) params.name = filter.name; const r = await api.permissions.userGroups.list(params); items.value = r.items; total.value = r.total }
  catch { ElMessage.error(t('permission.userGroupFetchFailed')) }
  finally { loading.value = false }
}
function resetFilter() { filter.name = ''; fetchData() }

async function handleInvite() {
  if (!inviteDlg.userId) { ElMessage.warning(t('permission.selectUserFirst')); return }
  inviting.value = true
  try {
    await api.perm.invite({ groupId: inviteDlg.groupId, inviteeId: inviteDlg.userId })
    ElMessage.success(t('permission.inviteSuccess'))
    inviteDlg.show = false
    await fetchData()
  } catch { ElMessage.error(t('permission.actionFailed')) }
  finally { inviting.value = false }
}

async function handleSave() {
  if (!form.name) { ElMessage.warning(t('permission.nameRequired')); return }
  saving.value = true
  try {
    const payload = {
      name: form.name,
      memberIds: form.memberIds,
      adminIds: form.adminIds.length ? form.adminIds : undefined,
      dependsOn: form.dependsOn.length ? form.dependsOn : undefined,
    }
    if (dialog.isEdit) { await api.perm.updateUserGroup(dialog.editId, payload); ElMessage.success(t('permission.updated')) }
    else { await api.perm.createUserGroup(payload as any); ElMessage.success(t('permission.created')) }
    dialog.show = false; await fetchData()
  } catch { ElMessage.error(t('permission.actionFailed')) }
  finally { saving.value = false }
}
async function handleDelete(id: string) { try { await ElMessageBox.confirm(t('permission.groupDeleteConfirm'), t('table.confirm')); await api.permissions.userGroups.delete(id); ElMessage.success(t('permission.deleteSuccess')); await fetchData() } catch {/* ignore */} }
onMounted(async () => {
  await loadRefs()
  await fetchData()
  users.value = refUsers.value
  allPermGroups.value = permGroups.value
})
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { margin-bottom: 16px; }
.filters :deep(.el-form-item) { margin-bottom: 0; }
.perm-group-card { margin-bottom: 12px; padding: 12px; border: 1px solid var(--el-border-color); border-radius: 6px; }
.pg-header { margin-bottom: 6px; }
.pg-deps { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 6px; }
</style>

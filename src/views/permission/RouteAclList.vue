<template>
  <div>
    <el-button text @click="$router.push('/permissions')" class="back">{{ $t('permission.back') }}</el-button>
    <div class="page-head"><h2>{{ $t('permission.aclTitle') }}</h2><el-button type="primary" size="small" @click="openCreate">{{ $t('permission.createAcl') }}</el-button></div>
    <el-table :data="acls || []" v-loading="loading" stripe :empty-text="$t('table.empty')">
      <el-table-column prop="method" :label="$t('permission.method')" width="80"><template #default="{ row }"><el-tag size="small">{{ row.method }}</el-tag></template></el-table-column>
      <el-table-column prop="pathPrefix" :label="$t('permission.path')" min-width="200" show-overflow-tooltip />
      <el-table-column prop="matchType" :label="$t('permission.match')" width="80" />
      <el-table-column prop="effect" :label="$t('permission.effect')" width="70"><template #default="{ row }"><el-tag :type="row.effect==='allow'?'success':'danger'" size="small">{{ row.effect }}</el-tag></template></el-table-column>
      <el-table-column :label="$t('permission.userOrGroup')" width="180" show-overflow-tooltip><template #default="{ row }">{{ row.userId ? userName(row.userId) : row.userGroupId ? groupName(row.userGroupId) : '-' }}</template></el-table-column>
      <el-table-column prop="priority" :label="$t('permission.priority')" width="80" />
      <el-table-column :label="$t('table.actions')" width="160" fixed="right"><template #default="{ row }"><el-button size="small" @click="openEdit(row)">{{ $t('table.edit') }}</el-button><el-button size="small" type="danger" @click="handleDelete(row.id)">{{ $t('table.delete') }}</el-button></template></el-table-column>
    </el-table>
    <el-pagination v-if="total > limit" v-model:current-page="page" v-model:page-size="limit" :total="total" :page-sizes="[10,15,30,50]" layout="total, sizes, prev, pager, next" @size-change="fetchData" @current-change="fetchData" />

    <el-dialog v-model="dialog.show" :title="dialog.isEdit?$t('permission.editAcl'):$t('permission.createAcl')" width="550px">
      <el-form :model="form" label-width="100px">
        <el-form-item :label="$t('permission.method')"><el-select v-model="form.method"><el-option label="GET" value="GET" /><el-option label="POST" value="POST" /><el-option label="PUT" value="PUT" /><el-option label="DELETE" value="DELETE" /><el-option label="*" value="*" /></el-select></el-form-item>
        <el-form-item :label="$t('permission.pathPrefix')"><el-input v-model="form.pathPrefix" :placeholder="$t('permission.resourcePlaceholder')" /></el-form-item>
        <el-form-item :label="$t('permission.matchType')"><el-radio-group v-model="form.matchType"><el-radio value="prefix">{{ $t('permission.matchPrefix') }}</el-radio><el-radio value="exact">{{ $t('permission.matchExact') }}</el-radio></el-radio-group></el-form-item>
        <el-form-item :label="$t('permission.effect')"><el-radio-group v-model="form.effect"><el-radio value="allow">{{ $t('permission.allow') }}</el-radio><el-radio value="deny">{{ $t('permission.deny') }}</el-radio></el-radio-group></el-form-item>
        <el-form-item :label="$t('permission.userGroupId')"><el-input v-model="form.userId" :placeholder="$t('permission.userGroupIdPlaceholder')" /></el-form-item>
        <el-form-item :label="$t('permission.priority')"><el-input-number v-model="form.priority" :min="0" :max="9999" /></el-form-item>
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
const { load: loadRefs, userName, groupName } = useResolver()
const loading = ref(false); const saving = ref(false)
const acls = ref<RouteAcl[]>([]); const page = ref(1); const limit = ref(15); const total = ref(0)
const dialog = reactive({ show: false, isEdit: false, editId: '' })
const form = reactive({ method: 'GET', pathPrefix: '', matchType: 'prefix' as 'prefix'|'exact', effect: 'allow' as 'allow'|'deny', userId: '', priority: 500 })

function openCreate() { dialog.isEdit=false; dialog.editId=''; form.method='GET'; form.pathPrefix=''; form.matchType='prefix'; form.effect='allow'; form.userId=''; form.priority=500; dialog.show=true }
function openEdit(row: RouteAcl) { dialog.isEdit=true; dialog.editId=row.id; form.method=row.method; form.pathPrefix=row.pathPrefix; form.matchType=row.matchType; form.effect=row.effect; form.userId=row.userId||row.userGroupId||''; form.priority=row.priority; dialog.show=true }

async function fetchData() {
  loading.value = true
  try { const r = await api.extractPage<RouteAcl>(api.permissions.apiPermissionsRouteAclsGet({ params: { page: page.value, limit: limit.value } })); acls.value = r.items; total.value = r.total }
  catch { ElMessage.error(t('permission.aclFetchFailed')) }
  finally { loading.value = false }
}
async function handleSave() {
  if (!form.pathPrefix) { ElMessage.warning(t('permission.pathRequired')); return }
  saving.value = true
  const p = { method: form.method, pathPrefix: form.pathPrefix, matchType: form.matchType, effect: form.effect, userId: form.userId||undefined, priority: form.priority }
  try {
    if (dialog.isEdit) { await api.permissions.apiPermissionsRouteAclsIdPut(dialog.editId, p as any); ElMessage.success(t('permission.updated')) }
    else { await api.permissions.apiPermissionsRouteAclsPost(p as any); ElMessage.success(t('permission.created')) }
    dialog.show = false; await fetchData()
  } catch { ElMessage.error(t('permission.actionFailed')) }
  finally { saving.value = false }
}
async function handleDelete(id: string) { try { await ElMessageBox.confirm(t('permission.aclDeleteConfirm'), t('table.confirm')); await api.permissions.apiPermissionsRouteAclsIdDelete(id); ElMessage.success(t('permission.deleteSuccess')); await fetchData() } catch {/* ignore */} }
onMounted(async () => { await loadRefs(); await fetchData() })
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>

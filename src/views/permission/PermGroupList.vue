<template>
  <div>
    <el-button
      text
      class="back"
      @click="$router.push('/permissions')"
    >
      {{ $t('permission.back') }}
    </el-button>
    <div class="page-head">
      <h2>{{ $t('permission.groupTitle') }}</h2><el-button
        type="primary"
        size="small"
        @click="openCreate"
      >
        {{ $t('permission.createGroup') }}
      </el-button>
    </div>
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
    <el-table
      v-loading="loading" stripe
      :data="groups || []"

      :empty-text="$t('table.empty')"
    >
      <el-table-column
        prop="name"
        :label="$t('permission.groupName')"
        min-width="150"
      />
      <el-table-column
        :label="$t('permission.rules')"
        width="70"
      >
        <template #default="{ row }">
          {{ row.rules?.length || 0 }}
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('permission.boundGroups')"
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
          <span v-if="!row.userGroupIds?.length">{{ $t('common.none') }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('permission.boundUsers')"
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
          <span v-if="!row.userIds?.length">{{ $t('common.none') }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('permission.dependencies')"
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
          <span v-if="!row.dependsOn?.length">{{ $t('common.none') }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('table.actions')"
        width="160"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button
            size="small"
            @click="openEdit(row)"
          >
            {{ $t('table.edit') }}
          </el-button><el-button
            size="small"
            type="danger"
            @click="handleDelete(row.id)"
          >
            {{ $t('table.delete') }}
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
      :title="dialog.isEdit?$t('permission.editGroup'):$t('permission.createGroup')"
      width="650px"
    >
      <el-form
        :model="form"
        label-width="100px"
      >
        <el-form-item :label="$t('permission.groupName')">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('permission.boundGroups')">
          <el-select
            v-model="form.userGroupIds"
            multiple
            filterable
            :placeholder="$t('permission.groupSelectPlaceholder')"
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
        <el-form-item :label="$t('permission.boundUsers')">
          <el-select
            v-model="form.userIds"
            multiple
            filterable
            :placeholder="$t('permission.userSelectPlaceholder')"
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
        <el-form-item :label="$t('permission.dependencies')">
          <el-select
            v-model="form.dependsOn"
            multiple
            filterable
            :placeholder="$t('permission.depSelectPlaceholder')"
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
        <el-divider>{{ $t('permission.rules') }}</el-divider>
        <div class="rule-mode-bar">
          <el-radio-group v-model="ruleMode" size="small">
            <el-radio-button value="form">{{ $t('permission.formMode') }}</el-radio-button>
            <el-radio-button value="expression">{{ $t('permission.expressionMode') }}</el-radio-button>
          </el-radio-group>
        </div>

        <!-- Form mode: per-rule rows -->
        <template v-if="ruleMode === 'form'">
          <div v-for="(r, i) in form.rules" :key="i" class="rule-row">
            <el-radio-group v-model="r.effect" size="small">
              <el-radio-button value="allow">{{ $t('permission.allow') }}</el-radio-button>
              <el-radio-button value="deny">{{ $t('permission.deny') }}</el-radio-button>
            </el-radio-group>
            <el-input
              v-model="r.actions"
              placeholder="action1, action2, …"
              style="width:160px;margin:0 6px"
              size="small"
            />
            <el-input
              v-model="r.resource"
              placeholder="resource/*"
              style="width:140px;margin-right:6px"
              size="small"
            />
            <el-input-number v-model="r.priority" :min="0" size="small" style="width:90px" />
            <el-button type="danger" size="small" circle @click="form.rules.splice(i,1)">−</el-button>
          </div>
          <el-button size="small" @click="form.rules.push({effect:'allow',actions:'',resource:'',priority:100})">
            {{ $t('permission.addRule') }}
          </el-button>
        </template>

        <!-- Expression mode: monolithic JSON -->
        <div v-else class="expr-panel">
          <el-input
            v-model="ruleExpr"
            type="textarea"
            :rows="10"
            class="rule-expr-textarea"
            @input="onRuleExprInput"
          />
          <div class="expr-status" :class="ruleExprStatus">
            <span v-if="ruleExprStatus === 'valid'">✓ {{ $t('permission.expressionValid') }}</span>
            <span v-else-if="ruleExprStatus === 'invalid'">✗ {{ $t('permission.expressionInvalid') }}: {{ ruleExprError }}</span>
            <span v-else>&nbsp;</span>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialog.show=false">
          {{ $t('table.cancel') }}
        </el-button><el-button
          type="primary"
          :loading="saving"
          @click="handleSave"
        >
          {{ dialog.isEdit?$t('table.save'):$t('table.create') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'
import { useReferenceCache } from '../../composables/useReferenceCache'

const { t } = useI18n()
const refCache = useReferenceCache()

const loading = ref(false); const saving = ref(false)
const groups = ref<PermissionGroup[]>([]); const page = ref(1); const limit = ref(15); const total = ref(0)
const filter = reactive({ name: '' })
const allUg = ref<UserGroup[]>([]); const allUsers = ref<User[]>([])
const dialog = reactive({ show: false, isEdit: false, editId: '' })

type EditorMode = 'form' | 'expression'
const ruleMode = ref<EditorMode>('form')

interface RuleFormItem {
  effect: 'allow' | 'deny'
  actions: string
  resource: string
  priority: number
}

const form = reactive({
  name: '',
  userGroupIds: [] as string[],
  userIds: [] as string[],
  dependsOn: [] as string[],
  rules: [] as RuleFormItem[],
})
const ruleExpr = ref('')
const ruleExprStatus = ref<'idle' | 'valid' | 'invalid'>('idle')
const ruleExprError = ref('')

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

// ── Rules serialization ──
function rulesToExpr(rules: RuleFormItem[]): string {
  return JSON.stringify(rules.map(r => ({
    effect: r.effect,
    actions: r.actions.split(/[\n,]+/).map(s => s.trim()).filter(Boolean),
    ...(r.resource ? { resource: r.resource } : {}),
    priority: r.priority,
  })), null, 2)
}

function exprToRules(json: string): RuleFormItem[] | null {
  try {
    const arr = JSON.parse(json)
    if (!Array.isArray(arr)) throw new Error('Expected an array')
    return arr.map((item: any, i: number) => {
      if (typeof item !== 'object' || item === null) throw new Error(`Item ${i} is not an object`)
      return {
        effect: item.effect === 'deny' ? 'deny' as const : 'allow' as const,
        actions: (Array.isArray(item.actions) ? item.actions : []).join(', '),
        resource: item.resource ?? '',
        priority: typeof item.priority === 'number' ? item.priority : 100,
      }
    })
  } catch (e: any) {
    ruleExprError.value = e.message ?? String(e)
    return null
  }
}

watch(ruleMode, (mode, old) => {
  if (mode === old) return
  if (mode === 'expression') {
    ruleExpr.value = rulesToExpr(form.rules)
    ruleExprStatus.value = 'valid'
    ruleExprError.value = ''
  } else {
    const parsed = exprToRules(ruleExpr.value)
    if (parsed) {
      form.rules = parsed
      ruleExprStatus.value = 'valid'
    } else {
      ruleExprStatus.value = 'invalid'
    }
  }
})

function onRuleExprInput() {
  try {
    const arr = JSON.parse(ruleExpr.value)
    if (!Array.isArray(arr)) throw new Error('Expected an array')
    ruleExprStatus.value = 'valid'
    ruleExprError.value = ''
  } catch (e: any) {
    ruleExprStatus.value = 'invalid'
    ruleExprError.value = e.message ?? String(e)
  }
}

function openCreate() {
  ruleMode.value = 'form'
  dialog.isEdit=false; dialog.editId=''; form.name=''; form.userGroupIds=[]; form.userIds=[]; form.dependsOn=[]; form.rules=[]; dialog.show=true
}
function openEdit(row: PermissionGroup) {
  ruleMode.value = 'form'
  dialog.isEdit=true; dialog.editId=row.id; form.name=row.name; form.userGroupIds=[...(row.userGroupIds||[])]; form.userIds=[...(row.userIds||[])]; form.dependsOn=[...(row.dependsOn||[])]
  form.rules=(row.rules||[]).map(r=>({
    effect: r.effect,
    actions: r.actions.join(', '),
    resource: r.resource ?? '',
    priority: r.priority,
  }))
  dialog.show=true
}

async function fetchData() {
  loading.value = true
  try { const params: Record<string, any> = {page:page.value,limit:limit.value}; if (filter.name) params.name = filter.name; const r = await api.permissions.groups.list(params); groups.value = r.items; total.value = r.total }
  catch { ElMessage.error(t('permission.groupFetchFailed')) }
  finally { loading.value = false }
}
function resetFilter() { filter.name = ''; fetchData() }

async function handleSave() {
  if (!form.name) { ElMessage.warning(t('permission.groupNameRequired')); return }

  // Resolve rules from whichever mode is active
  let rules: { effect: 'allow'|'deny'; actions: string[]; resource?: string; priority: number }[]
  if (ruleMode.value === 'expression') {
    if (ruleExprStatus.value !== 'valid') {
      ElMessage.warning(t('permission.expressionInvalid'))
      return
    }
    const parsed = exprToRules(ruleExpr.value)
    if (!parsed) { ElMessage.warning(t('permission.expressionInvalid')); return }
    rules = parsed.map(r => ({
      effect: r.effect,
      actions: r.actions.split(/[\n,]+/).map(s => s.trim()).filter(Boolean),
      ...(r.resource ? { resource: r.resource } : {}),
      priority: r.priority,
    }))
  } else {
    rules = form.rules.map(r => ({
      effect: r.effect,
      actions: r.actions.split(/[\n,]+/).map((a:string) => a.trim()).filter(Boolean),
      ...(r.resource ? { resource: r.resource } : {}),
      priority: r.priority,
    }))
  }

  saving.value = true
  try {
    const body = { name: form.name, rules, userGroupIds: form.userGroupIds.length ? form.userGroupIds : undefined, userIds: form.userIds.length ? form.userIds : undefined, dependsOn: form.dependsOn.length ? form.dependsOn : undefined }
    if (dialog.isEdit) { await api.permissions.groups.update(dialog.editId, body as any); ElMessage.success(t('permission.updated')) }
    else { await api.permissions.groups.create(body as any); ElMessage.success(t('permission.created')) }
    dialog.show=false; await fetchData()
  } catch { ElMessage.error(t('permission.actionFailed')) }
  finally { saving.value = false }
}
async function handleDelete(id: string) { try { await ElMessageBox.confirm(t('permission.groupDeleteConfirm'), t('table.confirm')); await api.permissions.groups.delete(id); ElMessage.success(t('permission.deleteSuccess')); await fetchData() } catch {/* ignore */} }
onMounted(async () => {
  await fetchData()
  try { allUg.value = await api.permissions.userGroups.list({ limit: 100 }).then(r => r.items) } catch { /* ignore */ }
  await refCache.users.load()
  allUsers.value = refCache.users.data.value as User[]
})
</script>
<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { margin-bottom: 16px; }
.filters :deep(.el-form-item) { margin-bottom: 0; }

.rule-mode-bar { display: flex; justify-content: center; margin-bottom: 12px; }
.rule-row { display: flex; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 4px; }

.expr-panel { margin-bottom: 8px; }
.rule-expr-textarea :deep(textarea) {
  font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
}
.expr-status { font-size: 12px; margin-top: 4px; min-height: 18px; }
.expr-status.valid { color: var(--el-color-success); }
.expr-status.invalid { color: var(--el-color-danger); }
</style>

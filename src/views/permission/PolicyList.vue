<template>
  <div>
    <el-button text @click="$router.push('/permissions')" class="back">{{ $t('permission.back') }}</el-button>
    <div class="page-head">
      <h2>{{ $t('permission.policyList') }}</h2>
      <el-button type="primary" size="small" @click="openCreate">{{ $t('permission.createPolicy') }}</el-button>
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
    <el-table :data="policies || []" v-loading="loading" stripe :empty-text="$t('table.empty')" @sort-change="onSort">
      <el-table-column prop="name" :label="$t('permission.name')" min-width="150" sortable="custom" />
      <el-table-column prop="effect" :label="$t('permission.effect')" width="80">
        <template #default="{ row }">
          <el-tag :type="row.effect==='allow'?'success':'danger'" size="small">{{ row.effect }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('permission.actions')" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">{{ row.actions?.join(', ') }}</template>
      </el-table-column>
      <el-table-column prop="resource" :label="$t('permission.resource')" min-width="150" show-overflow-tooltip />
      <el-table-column prop="priority" :label="$t('permission.priority')" width="80" sortable="custom" />
      <el-table-column :label="$t('permission.enabled')" width="90">
        <template #default="{ row }">
          <el-tag :type="row.enabled?'success':'info'" size="small">{{ row.enabled?$t('common.yes'):$t('common.no') }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.actions')" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">{{ $t('table.edit') }}</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">{{ $t('table.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-if="total > limit"
      v-model:current-page="page"
      v-model:page-size="limit"
      :total="total"
      :page-sizes="[10, 15, 30, 50]"
      layout="total, sizes, prev, pager, next"
      @size-change="fetchData"
      @current-change="fetchData"
    />

    <el-dialog
      v-model="dialog.show"
      :title="dialog.isEdit ? $t('permission.editPolicy') : $t('permission.createPolicy')"
      width="620px"
      destroy-on-close
    >
      <!-- Mode switch -->
      <div class="mode-bar">
        <el-radio-group v-model="exprMode" size="small">
          <el-radio-button value="form">{{ $t('permission.formMode') }}</el-radio-button>
          <el-radio-button value="expression">{{ $t('permission.expressionMode') }}</el-radio-button>
        </el-radio-group>
      </div>

      <!-- Graphical form mode -->
      <el-form v-if="exprMode === 'form'" :model="form" label-width="80px">
        <el-form-item :label="$t('permission.name')">
          <el-input v-model="form.name" :placeholder="$t('permission.name')" />
        </el-form-item>
        <el-form-item :label="$t('permission.effect')">
          <el-radio-group v-model="form.effect">
            <el-radio value="allow">{{ $t('permission.allow') }}</el-radio>
            <el-radio value="deny">{{ $t('permission.deny') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('permission.actions')">
          <el-input
            v-model="form.actionsText"
            type="textarea"
            :rows="3"
            :placeholder="$t('permission.expressionActionsHint')"
          />
          <div class="hint">{{ $t('permission.expressionActionsHint') }}</div>
        </el-form-item>
        <el-form-item :label="$t('permission.resource')">
          <el-input v-model="form.resource" :placeholder="$t('permission.expressionResourceHint')" />
          <div class="hint">{{ $t('permission.expressionResourceHint') }}</div>
        </el-form-item>
        <el-form-item :label="$t('permission.priority')">
          <el-input-number v-model="form.priority" :min="0" :max="9999" />
        </el-form-item>
      </el-form>

      <!-- Expression mode -->
      <div v-else class="expr-panel">
        <el-input
          v-model="exprJson"
          type="textarea"
          :rows="12"
          class="expr-textarea"
          :placeholder="{formMode: 'Enter JSON policy expression'}"
          @input="onExprInput"
        />
        <div class="expr-status" :class="exprStatus">
          <span v-if="exprStatus === 'valid'">✓ {{ $t('permission.expressionValid') }}</span>
          <span v-else-if="exprStatus === 'invalid'">✗ {{ $t('permission.expressionInvalid') }}: {{ exprError }}</span>
          <span v-else>&nbsp;</span>
        </div>
      </div>

      <template #footer>
        <el-button @click="dialog.show = false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ dialog.isEdit ? $t('table.save') : $t('table.create') }}
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

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const policies = ref<StoredPolicy[]>([])
const filter = reactive({ name: '' })
const page = ref(1)
const limit = ref(15)
const total = ref(0)
const dialog = reactive({ show: false, isEdit: false, editId: '' })

type EditorMode = 'form' | 'expression'
const exprMode = ref<EditorMode>('form')

const form = reactive({
  name: '',
  effect: 'allow' as 'allow' | 'deny',
  actionsText: '',
  resource: '',
  priority: 100,
})
const exprJson = ref('')
const exprStatus = ref<'idle' | 'valid' | 'invalid'>('idle')
const exprError = ref('')

// ── Derive string[] from the textarea ──
function parseActions(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(Boolean)
}

function joinActions(arr: string[]): string {
  return arr.join('\n')
}

// ── Serialize form → JSON expression ──
function toPolicyObject() {
  const p: Record<string, unknown> = {
    name: form.name || undefined,
    effect: form.effect,
    actions: parseActions(form.actionsText),
    priority: form.priority,
  }
  if (form.resource) p.resource = form.resource
  return p
}

function syncFormToExpr() {
  exprJson.value = JSON.stringify(toPolicyObject(), null, 2)
  exprStatus.value = 'valid'
  exprError.value = ''
}

// ── Deserialize JSON expression → form ──
function syncExprToForm(): boolean {
  try {
    const obj = JSON.parse(exprJson.value)
    if (typeof obj !== 'object' || obj === null) throw new Error('Not an object')
    form.name = obj.name ?? ''
    form.effect = obj.effect === 'deny' ? 'deny' : 'allow'
    form.actionsText = Array.isArray(obj.actions) ? joinActions(obj.actions) : ''
    form.resource = obj.resource ?? ''
    form.priority = typeof obj.priority === 'number' ? obj.priority : 100
    exprStatus.value = 'valid'
    exprError.value = ''
    return true
  } catch (e: any) {
    exprStatus.value = 'invalid'
    exprError.value = e.message ?? String(e)
    return false
  }
}

// ── Watch mode switch: sync before rendering new mode ──
watch(exprMode, (mode, oldMode) => {
  if (mode === oldMode) return
  if (mode === 'expression') {
    // switching to expression: push current form into textarea
    syncFormToExpr()
    exprStatus.value = 'valid'
  } else {
    // switching to form: pull from textarea
    syncExprToForm()
  }
})

function onExprInput() {
  // live validation
  try {
    const obj = JSON.parse(exprJson.value)
    if (typeof obj !== 'object' || obj === null) throw new Error('Not an object')
    exprStatus.value = 'valid'
    exprError.value = ''
  } catch (e: any) {
    exprStatus.value = 'invalid'
    exprError.value = e.message ?? String(e)
  }
}

// ── Dialog open ──
function openCreate() {
  exprMode.value = 'form'
  form.name = ''
  form.effect = 'allow'
  form.actionsText = ''
  form.resource = ''
  form.priority = 100
  dialog.isEdit = false
  dialog.editId = ''
  dialog.show = true
}

function openEdit(row: StoredPolicy) {
  exprMode.value = 'form'
  form.name = row.name
  form.effect = row.effect
  form.actionsText = joinActions(row.actions)
  form.resource = row.resource || ''
  form.priority = row.priority ?? 100
  dialog.isEdit = true
  dialog.editId = row.id
  dialog.show = true
}

function onSort(_: any) { fetchData() }
function resetFilter() { filter.name = ''; fetchData() }

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, limit: limit.value }
    if (filter.name) params.name = filter.name
    const res = await api.permissions.policies.list(params)
    policies.value = res.items; total.value = res.total
  } catch { ElMessage.error(t('permission.fetchFailed')) }
  finally { loading.value = false }
}

async function handleSave() {
  // Gather final payload from whichever mode is active
  let payload: Record<string, unknown>
  if (exprMode.value === 'expression') {
    if (!syncExprToForm()) {
      ElMessage.warning(t('permission.expressionInvalid'))
      return
    }
    payload = toPolicyObject()
  } else {
    if (!form.name) { ElMessage.warning(t('permission.nameRequired')); return }
    payload = toPolicyObject()
  }

  if (!payload.name) { ElMessage.warning(t('permission.nameRequired')); return }

  saving.value = true
  try {
    if (dialog.isEdit) {
      await api.permissions.policies.update(dialog.editId, { name: payload.name, priority: payload.priority as number })
      ElMessage.success(t('permission.updated'))
    } else {
      await api.permissions.policies.create({
        name: payload.name as string,
        effect: payload.effect as 'allow' | 'deny',
        actions: payload.actions as string[],
        resource: payload.resource as string | undefined,
      })
      ElMessage.success(t('permission.created'))
    }
    dialog.show = false; await fetchData()
  } catch { ElMessage.error(t('permission.actionFailed')) }
  finally { saving.value = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('permission.deleteConfirm'), t('table.confirm'))
    await api.permissions.policies.delete(id)
    ElMessage.success(t('permission.deleteSuccess')); await fetchData()
  } catch { /* ignore */ }
}

onMounted(fetchData)
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { margin-bottom: 16px; }
.filters :deep(.el-form-item) { margin-bottom: 0; }

.mode-bar { display: flex; justify-content: center; margin-bottom: 16px; }

.hint { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; line-height: 1.3; }

.expr-panel { margin-bottom: 8px; }
.expr-textarea :deep(textarea) {
  font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
}
.expr-status { font-size: 12px; margin-top: 4px; min-height: 18px; }
.expr-status.valid { color: var(--el-color-success); }
.expr-status.invalid { color: var(--el-color-danger); }
</style>

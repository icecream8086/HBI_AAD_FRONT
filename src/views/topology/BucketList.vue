<template>
  <div>
    <el-button
      text
      class="back"
      @click="$router.push('/dashboard')"
    >
      ← {{ $t('common.home') }}
    </el-button>
    <div class="page-head">
      <h2>{{ $t('topology.bucketTitle') }}</h2>
      <el-button
        type="primary"
        size="small"
        @click="openCreate"
      >
        {{ $t('topology.createBucket') }}
      </el-button>
    </div>

    <el-card class="filters">
      <el-form inline>
        <el-form-item :label="$t('topology.platform')">
          <el-select
            v-model="filter.platform"
            clearable
            :placeholder="$t('table.selectPlaceholder')"
            style="width:120px"
            @change="fetchData"
          >
            <el-option
              label="aws"
              value="aws"
            /><el-option
              label="alibaba"
              value="alibaba"
            /><el-option
              label="cloudflare"
              value="cloudflare-r2"
            /><el-option
              label="minio"
              value="minio"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('topology.region')">
          <el-select
            v-model="filter.region"
            clearable
            :placeholder="$t('table.selectPlaceholder')"
            style="width:140px"
            @change="fetchData"
          >
            <el-option
              v-for="r in regionOptions"
              :key="r"
              :label="r"
              :value="r"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilter">
            {{ $t('table.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table
      v-loading="loading"
      :data="buckets"
      stripe
      :empty-text="$t('table.empty')"
    >
      <el-table-column
        prop="name"
        :label="$t('topology.bucketName')"
        min-width="140"
      />
      <el-table-column
        :label="$t('topology.instanceTitle')"
        min-width="160"
      >
        <template #default="{ row }">
          {{ fmtInstance(row.instanceId) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="bucketType"
        :label="$t('topology.bucketType')"
        width="120"
      >
        <template #default="{ row }">
          <el-tag size="small">
            {{ row.bucketType }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="credentialRef"
        :label="$t('topology.credentialRef')"
        width="130"
      />
      <el-table-column
        prop="status"
        :label="$t('topology.status')"
        width="80"
      >
        <template #default="{ row }">
          <el-tag
            :type="statusTagType(row.status, colByProp('status'))"
            size="small"
          >
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('table.createdAt')"
        width="160"
      >
        <template #default="{ row }">
          {{ fmtCell(row.createdAt, colByProp('createdAt')) }}
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('table.actions')"
        width="240"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button
            size="small"
            @click="openPolicies(row)"
          >
            {{ $t('topology.policies') }}
          </el-button>
          <el-button
            size="small"
            @click="openEdit(row)"
          >
            {{ $t('table.edit') }}
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(row.id)"
          >
            {{ $t('table.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialog.show"
      :title="dialog.isEdit ? $t('topology.editBucket') : $t('topology.createBucket')"
      width="500px"
      destroy-on-close
    >
      <el-form
        :model="form"
        label-width="100px"
      >
        <el-form-item :label="$t('topology.bucketName')">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item
          :label="$t('topology.instanceTitle')"
          required
        >
          <el-select
            v-model="form.instanceId"
            filterable
            style="width:100%"
          >
            <el-option
              v-for="inst in instances"
              :key="inst.id"
              :label="`${inst.name} (${inst.platform}/${inst.region})`"
              :value="inst.id"
            />
          </el-select>
          <div
            v-if="selectedInst"
            class="inherit-hint"
          >
            ← {{ selectedInst.platform }} · {{ selectedInst.region }} · {{ selectedInst.endpoint }}
          </div>
        </el-form-item>
        <el-form-item :label="$t('topology.bucketType')">
          <el-select
            v-model="form.bucketType"
            style="width:100%"
          >
            <el-option
              label="aws-s3"
              value="aws-s3"
            />
            <el-option
              label="alibaba-oss"
              value="alibaba-oss"
            />
            <el-option
              label="cloudflare-r2"
              value="cloudflare-r2"
            />
            <el-option
              label="minio"
              value="minio"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('topology.credentialRef')">
          <el-select
            v-model="form.credentialRef"
            filterable
            clearable
            placeholder="Optional — inherit from instance"
            style="width:100%"
          >
            <el-option
              v-for="c in creds"
              :key="c.name"
              :label="`${c.name} (${c.platform})`"
              :value="c.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('topology.autoGenerateKeys')">
          <el-switch v-model="form.autoGenerateKeys" />
          <span style="font-size:12px;color:var(--el-text-color-secondary);margin-left:8px">{{ $t('topology.autoGenerateKeysHint') }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.show=false">
          {{ $t('table.cancel') }}
        </el-button>
        <el-button
          type="primary"
          :loading="saving"
          @click="handleSave"
        >
          {{ dialog.isEdit ? $t('table.save') : $t('table.create') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- S3 Policies dialog -->
    <el-dialog
      v-model="policyDlg.show"
      :title="$t('topology.policies') + ': ' + policyDlg.bucketName"
      width="700px"
      destroy-on-close
    >
      <el-table
        v-loading="policyDlg.loading"
        :data="policyDlg.policies"
        stripe
        :empty-text="$t('table.empty')"
        size="small"
      >
        <el-table-column
          prop="name"
          :label="$t('table.name')"
          min-width="120"
        />
        <el-table-column
          prop="effect"
          :label="$t('permission.effect')"
          width="80"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.effect==='Allow'?'success':'danger'"
              size="small"
            >
              {{ row.effect }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('permission.actions')"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.actions?.join(', ') }}
          </template>
        </el-table-column>
        <el-table-column
          prop="pathPrefix"
          :label="$t('topology.pathPrefix')"
          width="140"
          show-overflow-tooltip
        />
        <el-table-column
          :label="$t('table.actions')"
          width="130"
        >
          <template #default="{ row }">
            <el-button
              size="small"
              @click="openPolicyEdit(row)"
            >
              {{ $t('table.edit') }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handlePolicyDelete(row.id)"
            >
              {{ $t('table.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:12px;text-align:right">
        <el-button
          type="primary"
          size="small"
          :loading="policyDlg.saving"
          @click="openPolicyCreate"
        >
          {{ $t('topology.createPolicy') }}
        </el-button>
      </div>

      <!-- Create/Edit sub-dialog -->
      <el-dialog
        v-model="policyFormDlg.show"
        :title="policyFormDlg.isEdit ? $t('table.edit') : $t('topology.createPolicy')"
        width="480px"
        append-to-body
      >
        <el-form
          :model="policyForm"
          label-width="100px"
        >
          <el-form-item :label="$t('table.name')">
            <el-input v-model="policyForm.name" />
          </el-form-item>
          <el-form-item :label="$t('permission.effect')">
            <el-radio-group v-model="policyForm.effect">
              <el-radio value="Allow">
                Allow
              </el-radio>
              <el-radio value="Deny">
                Deny
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item :label="$t('permission.actions')">
            <el-select
              v-model="policyForm.permLevel"
              style="width:100%"
              @change="onPermLevelChange"
            >
              <el-option
                label="只读 (GetObject + HeadObject + ListBucket)"
                value="readonly"
              />
              <el-option
                label="读写 (Get + Put + Delete + Head + List)"
                value="readwrite"
              />
              <el-option
                label="仅上传 (PutObject)"
                value="upload"
              />
              <el-option
                label="仅下载 (GetObject)"
                value="download"
              />
              <el-option
                label="自定义"
                value="custom"
              />
              <el-option
                label="手动 (逗号分隔)"
                value="manual"
              />
            </el-select>
            <div
              v-if="policyForm.permLevel === 'custom'"
              class="action-checkboxes"
            >
              <el-checkbox
                v-for="a in S3_ACTIONS"
                :key="a.value"
                v-model="policyForm.selectedActions"
                :value="a.value"
                :label="a.label"
                size="small"
              />
            </div>
            <el-input
              v-else-if="policyForm.permLevel === 'manual'"
              v-model="policyForm.actionsText"
              type="textarea"
              :rows="2"
              placeholder="s3:GetObject, s3:PutObject, …"
              style="margin-top:6px"
            />
            <div
              v-else-if="resolvedActions.length"
              class="action-preview"
            >
              <el-tag
                v-for="a in resolvedActions"
                :key="a"
                size="small"
                style="margin-right:4px;margin-top:4px"
              >
                {{ a }}
              </el-tag>
            </div>
          </el-form-item>
          <el-form-item :label="$t('topology.pathPrefix')">
            <el-input
              v-model="policyForm.pathPrefix"
              placeholder="static/"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="policyFormDlg.show=false">
            {{ $t('table.cancel') }}
          </el-button>
          <el-button
            type="primary"
            :loading="policyFormDlg.saving"
            @click="handlePolicySave"
          >
            {{ $t('table.save') }}
          </el-button>
        </template>
      </el-dialog>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'
import { useReferenceCache } from '../../composables/useReferenceCache'
import { bucketColumns } from '../../constants/field-descriptors'
import { useEntityColumns } from '../../composables/useEntityColumns'

const { t } = useI18n()
const refCache = useReferenceCache()
const { fmtCell, statusTagType, colByProp } = useEntityColumns(bucketColumns)

const loading = ref(false)
const saving = ref(false)
const buckets = ref<RegionBucket[]>([])
const instances = ref<ComputeInstance[]>([])
const dialog = reactive({ show: false, isEdit: false, editId: '' })
const creds = ref<MaskedCredential[]>([])

// Filters
const filter = reactive({ platform: '', region: '' })
const regionOptions = computed(() => {
  const all = instances.value.map(i => i.region)
  return [...new Set(all)].sort()
})
const form = reactive({
  name: '', bucketType: '' as RegionBucketType | '', instanceId: '', credentialRef: '', autoGenerateKeys: false,
})

const instMap = computed(() => {
  const m: Record<string, ComputeInstance> = {}
  for (const inst of instances.value) m[inst.id] = inst
  return m
})

const selectedInst = computed(() => form.instanceId ? instMap.value[form.instanceId] : null)

function fmtInstance(id: string) {
  const inst = instMap.value[id]
  return inst ? `${inst.name} (${inst.platform})` : id.slice(0, 12)
}

function openCreate() {
  dialog.isEdit = false; dialog.editId = ''
  form.name = ''; form.bucketType = ''; form.instanceId = ''; form.credentialRef = ''; form.autoGenerateKeys = false
  dialog.show = true
}

function openEdit(row: RegionBucket) {
  dialog.isEdit = true; dialog.editId = row.id
  form.name = row.name; form.bucketType = row.bucketType; form.instanceId = row.instanceId
  form.credentialRef = row.credentialRef || ''; form.autoGenerateKeys = row.autoGenerateKeys ?? false
  dialog.show = true
}

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filter.platform) params.platform = filter.platform
    if (filter.region) params.region = filter.region
    const listRes = await api.topology.buckets.list(params)
    buckets.value = (listRes as any).items ?? []
  } catch { ElMessage.error(t('topology.fetchFailed')) }
  finally { loading.value = false }
}

function resetFilter() {
  filter.platform = ''; filter.region = ''
  fetchData()
}

async function handleSave() {
  if (!form.name) { ElMessage.warning(t('topology.nameRequired')); return }
  if (!form.instanceId) { ElMessage.warning(t('topology.nameRequired')); return }
  saving.value = true
  try {
    if (dialog.isEdit) {
      const upd: Record<string, any> = { name: form.name, instanceId: form.instanceId, autoGenerateKeys: form.autoGenerateKeys }
      if (form.credentialRef) upd.credentialRef = form.credentialRef
      else upd.credentialRef = null
      await api.topology.buckets.update(dialog.editId, upd)
      ElMessage.success(t('topology.updateSuccess'))
    } else {
      const body: Record<string, any> = {
        name: form.name,
        bucketType: form.bucketType as RegionBucketType,
        instanceId: form.instanceId,
        autoGenerateKeys: form.autoGenerateKeys,
      }
      if (form.credentialRef) body.credentialRef = form.credentialRef
      await api.topology.buckets.create(body as CreateBucketInput)
      ElMessage.success(t('topology.createSuccess'))
    }
    dialog.show = false; await fetchData()
  } catch { ElMessage.error(t('topology.actionFailed')) }
  finally { saving.value = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('topology.bucketDeleteConfirm'), t('table.confirm'))
    await api.topology.buckets.delete(id)
    ElMessage.success(t('topology.deleteSuccess')); await fetchData()
  } catch { /* ignore */ }
}

// ─── S3 Policies ───
const S3_ACTIONS = [
  { value: 's3:GetObject', label: 'GetObject (下载)' },
  { value: 's3:PutObject', label: 'PutObject (上传)' },
  { value: 's3:DeleteObject', label: 'DeleteObject (删除)' },
  { value: 's3:HeadObject', label: 'HeadObject (元数据)' },
  { value: 's3:ListBucket', label: 'ListBucket (列出)' },
]

/** Action preset → action list */
const PERM_LEVEL_ACTIONS: Record<string, string[]> = {
  readonly: ['s3:GetObject', 's3:HeadObject', 's3:ListBucket'],
  readwrite: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:HeadObject', 's3:ListBucket'],
  upload: ['s3:PutObject'],
  download: ['s3:GetObject'],
}

const policyDlg = reactive({ show: false, loading: false, saving: false, bucketId: '', bucketName: '', policies: [] as S3Policy[] })
const policyFormDlg = reactive({ show: false, isEdit: false, editId: '', saving: false })
const policyForm = reactive({
  name: '', effect: 'Allow' as 'Allow' | 'Deny',
  permLevel: 'readonly' as string, actionsText: '', selectedActions: [] as string[], pathPrefix: '',
})

/** Derive actions array from the form's current mode */
const resolvedActions = computed(() => {
  if (policyForm.permLevel === 'custom') return policyForm.selectedActions
  if (policyForm.permLevel === 'manual') {
    return policyForm.actionsText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
  }
  return PERM_LEVEL_ACTIONS[policyForm.permLevel] || []
})

function onPermLevelChange(val: string) {
  if (val !== 'custom') {
    policyForm.selectedActions = []
  }
}

function openPolicies(row: RegionBucket) {
  policyDlg.bucketId = row.id
  policyDlg.bucketName = row.name
  policyDlg.show = true
  fetchPolicies()
}

async function fetchPolicies() {
  if (!policyDlg.bucketId) return
  policyDlg.loading = true
  try { policyDlg.policies = await api.topology.bucketPolicies.list(policyDlg.bucketId) }
  catch { ElMessage.error(t('topology.fetchFailed')) }
  finally { policyDlg.loading = false }
}

function resolveActionsFromForm(): string[] {
  if (policyForm.permLevel === 'custom') return policyForm.selectedActions
  if (policyForm.permLevel === 'manual') {
    return policyForm.actionsText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
  }
  return PERM_LEVEL_ACTIONS[policyForm.permLevel] || []
}

function openPolicyCreate() {
  policyFormDlg.isEdit = false; policyFormDlg.editId = ''
  policyForm.name = ''; policyForm.effect = 'Allow'
  policyForm.permLevel = 'readonly'; policyForm.selectedActions = []; policyForm.actionsText = ''; policyForm.pathPrefix = ''
  policyFormDlg.show = true
}

function openPolicyEdit(row: S3Policy) {
  policyFormDlg.isEdit = true; policyFormDlg.editId = row.id
  policyForm.name = row.name; policyForm.effect = row.effect
  policyForm.pathPrefix = row.pathPrefix || ''

  // Try to match existing actions to a preset level
  const actions = row.actions || []
  const sorted = [...actions].sort()
  let matched = false
  for (const [level, acts] of Object.entries(PERM_LEVEL_ACTIONS)) {
    if (JSON.stringify([...acts].sort()) === JSON.stringify(sorted)) {
      policyForm.permLevel = level; policyForm.selectedActions = []; policyForm.actionsText = ''; matched = true; break
    }
  }
  if (!matched) {
    // If all actions are in the standard list, use custom mode with checkboxes
    const allStandard = actions.every(a => S3_ACTIONS.some(s => s.value === a))
    if (allStandard && actions.length > 0) {
      policyForm.permLevel = 'custom'
      policyForm.selectedActions = [...actions]
      policyForm.actionsText = ''
    } else {
      // Non-standard actions (like "*") → manual mode
      policyForm.permLevel = 'manual'
      policyForm.selectedActions = []
      policyForm.actionsText = actions.join(', ')
    }
  }
  policyFormDlg.show = true
}

async function handlePolicySave() {
  if (!policyForm.name) { ElMessage.warning(t('topology.nameRequired')); return }
  const actions = resolveActionsFromForm()
  if (!actions.length) { ElMessage.warning(t('permission.actions') + ' required'); return }
  policyFormDlg.saving = true
  try {
    const body = { name: policyForm.name, effect: policyForm.effect, actions, pathPrefix: policyForm.pathPrefix || undefined }
    if (policyFormDlg.isEdit) {
      await api.topology.bucketPolicies.update(policyFormDlg.editId, body)
      ElMessage.success(t('topology.updateSuccess'))
    } else {
      await api.topology.bucketPolicies.create(policyDlg.bucketId, body as any)
      ElMessage.success(t('topology.createSuccess'))
    }
    policyFormDlg.show = false
    await fetchPolicies()
  } catch { ElMessage.error(t('topology.actionFailed')) }
  finally { policyFormDlg.saving = false }
}

async function handlePolicyDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('topology.bucketDeleteConfirm'), t('table.confirm'))
    await api.topology.bucketPolicies.delete(id)
    ElMessage.success(t('topology.deleteSuccess'))
    await fetchPolicies()
  } catch { /* ignore */ }
}

onMounted(async () => {
  await fetchData()
  await Promise.all([refCache.instances.load(), refCache.credentials.load()])
  instances.value = refCache.instances.data.value
  creds.value = refCache.credentials.data.value as MaskedCredential[]
})
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { margin-bottom: 16px; }
.filters :deep(.el-form-item) { margin-bottom: 0; }
.inherit-hint { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
.action-checkboxes { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.action-preview { display: flex; flex-wrap: wrap; margin-top: 4px; }
</style>

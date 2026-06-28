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
      <h2>{{ $t('securityGroup.title') }}</h2>
      <el-button
        type="primary"
        size="small"
        @click="openCreate"
      >
        {{ $t('securityGroup.create') }}
      </el-button>
    </div>

    <el-card class="filters">
      <el-form inline>
        <el-form-item :label="$t('table.name')">
          <el-input
            v-model="filter.name"
            :placeholder="$t('table.name')"
            clearable
            style="width:200px"
            @clear="fetchData"
            @keyup.enter="fetchData"
          />
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
      :data="items"
      stripe
      :empty-text="$t('table.empty')"
    >
      <el-table-column
        prop="name"
        :label="$t('securityGroup.name')"
        min-width="140"
      />
      <el-table-column
        prop="securityGroupId"
        :label="$t('topology.securityGroupId')"
        width="140"
      />
      <el-table-column
        :label="$t('topology.instanceTitle')"
        min-width="140"
      >
        <template #default="{ row }">
          {{ fmtInstance(row.instanceId) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="visibility"
        :label="$t('securityGroup.visibility')"
        width="80"
      >
        <template #default="{ row }">
          <el-tag
            :type="row.visibility==='public'?'success':'info'"
            size="small"
          >
            {{ row.visibility }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('table.createdAt')"
        width="150"
      >
        <template #default="{ row }">
          {{ fmt(row.createdAt) }}
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

    <el-pagination
     
      v-model:current-page="page"
      :page-size="limit"
      :total="total"
      layout="total, prev, pager, next"
      background
      small
      style="margin-top:16px;justify-content:center"
      @current-change="fetchData"
    />

    <el-dialog
      v-model="dialog.show"
      :title="dialog.isEdit ? $t('securityGroup.edit') : $t('securityGroup.create')"
      width="520px"
      destroy-on-close
    >
      <el-form
        :model="form"
        label-width="110px"
      >
        <el-form-item :label="$t('securityGroup.name')">
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
            ← {{ selectedInst.platform }} · {{ selectedInst.region }}
          </div>
        </el-form-item>
        <div class="cont-card">
          <div class="section-label">
            {{ $t('securityGroup.bandwidthControl') }}
          </div>
          <el-form-item
            :label="$t('securityGroup.egressBw')"
            label-width="130px"
          >
            <el-input-number
              v-model="form.egressBandwidth"
              :min="0"
              :max="100000"
              :step="10"
              style="width:160px"
            />
          </el-form-item>
          <el-form-item
            :label="$t('securityGroup.ingressBw')"
            label-width="130px"
          >
            <el-input-number
              v-model="form.ingressBandwidth"
              :min="0"
              :max="100000"
              :step="10"
              style="width:160px"
            />
          </el-form-item>
          <el-form-item
            :label="$t('securityGroup.burstBw')"
            label-width="130px"
          >
            <el-input-number
              v-model="form.burstBandwidth"
              :min="0"
              :max="100000"
              :step="10"
              style="width:160px"
            />
          </el-form-item>
          <el-form-item
            :label="$t('securityGroup.qosPriority')"
            label-width="130px"
          >
            <el-input-number
              v-model="form.qosPriority"
              :min="1"
              :max="10"
              :step="1"
              style="width:160px"
            />
          </el-form-item>
        </div>
        <el-form-item :label="$t('topology.securityGroupId')">
          <el-input
            v-model="form.securityGroupId"
            placeholder="sg-xxx"
          />
        </el-form-item>
        <el-form-item :label="$t('securityGroup.visibility')">
          <el-radio-group v-model="form.visibility">
            <el-radio value="public">
              public
            </el-radio>
            <el-radio value="private">
              private
            </el-radio>
          </el-radio-group>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api/typed'
import { useReferenceCache } from '../../composables/useReferenceCache'
import { toAppError } from '../../types/errors'

const { t } = useI18n()
const refCache = useReferenceCache()

const loading = ref(false)
const saving = ref(false)
const items = ref<SecurityGroup[]>([])
const instances = ref<ComputeInstance[]>([])
const dialog = reactive({ show: false, isEdit: false, editId: '' })
const page = ref(1)
const limit = 20
const total = ref(0)
const filter = reactive({ name: '' })
function resetForm() {
  form.name = ''; form.instanceId = ''; form.securityGroupId = ''; form.visibility = 'private'
  form.egressBandwidth = 100; form.ingressBandwidth = 50; form.burstBandwidth = 200; form.qosPriority = 5
}

const form = reactive({
  name: '', instanceId: '', securityGroupId: '', visibility: 'private' as 'public' | 'private',
  egressBandwidth: 100, ingressBandwidth: 50, burstBandwidth: 200, qosPriority: 5,
})

const instMap = computed(() => {
  const m: Record<string, ComputeInstance> = {}
  for (const inst of instances.value) m[inst.id] = inst
  return m
})

const selectedInst = computed(() => form.instanceId ? instMap.value[form.instanceId] : null)

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }
function fmtInstance(id: string) {
  const inst = instMap.value[id]
  return inst ? `${inst.name} (${inst.platform})` : id.slice(0, 12)
}

function openCreate() {
  dialog.isEdit = false; dialog.editId = ''
  resetForm()
  dialog.show = true
}

function openEdit(row: any) {
  dialog.isEdit = true; dialog.editId = row.id
  form.name = row.name; form.instanceId = row.instanceId; form.securityGroupId = row.securityGroupId || ''
  form.visibility = row.visibility
  const bw = row.bandwidth || {}
  form.egressBandwidth = bw.egress ?? 100
  form.ingressBandwidth = bw.ingress ?? 50
  form.burstBandwidth = bw.burst ?? 200
  form.qosPriority = bw.priority ?? 5
  dialog.show = true
}

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, limit }
    if (filter.name) params.name = filter.name
    const pageResult = await api.securityGroups.list(params)
    items.value = pageResult.items ?? []
    total.value = pageResult.total ?? items.value.length
  } catch { ElMessage.error(t('securityGroup.fetchFailed')) }
  finally { loading.value = false }
}

function resetFilter() {
  filter.name = ''; page.value = 1; fetchData()
}

async function handleSave() {
  if (!form.name) { ElMessage.warning(t('securityGroup.nameRequired')); return }
  if (!form.instanceId) { ElMessage.warning(t('topology.nameRequired')); return }
  saving.value = true
  try {
    const body: Record<string, any> = { name: form.name, instanceId: form.instanceId, visibility: form.visibility }
    if (form.securityGroupId) body.securityGroupId = form.securityGroupId
    const bw: Record<string, any> = {}
    if (form.egressBandwidth) bw.egress = form.egressBandwidth
    if (form.ingressBandwidth) bw.ingress = form.ingressBandwidth
    if (form.burstBandwidth) bw.burst = form.burstBandwidth
    if (form.qosPriority) bw.priority = form.qosPriority
    if (Object.keys(bw).length) body.bandwidth = bw
    if (dialog.isEdit) {
      const upd: Record<string, any> = { name: form.name, visibility: form.visibility }
      if (form.securityGroupId) upd.securityGroupId = form.securityGroupId
      if (Object.keys(bw).length) upd.bandwidth = bw
      await api.securityGroups.update(dialog.editId, upd)
      ElMessage.success(t('securityGroup.updateSuccess'))
    } else {
      await api.securityGroups.create(body)
      ElMessage.success(t('securityGroup.createSuccess'))
    }
    dialog.show = false; await fetchData()
  } catch (e) {
    ElMessage.error(toAppError(e).message)
  }
  finally { saving.value = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('securityGroup.deleteConfirm'), t('table.confirm'))
    await api.securityGroups.delete(id)
    ElMessage.success(t('securityGroup.deleteSuccess')); await fetchData()
  } catch { /* ignore */ }
}

onMounted(async () => {
  await fetchData()
  await refCache.instances.load()
  instances.value = refCache.instances.data.value
})
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { margin-bottom: 16px; }
.filters :deep(.el-form-item) { margin-bottom: 0; }
.inherit-hint { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
.cont-card { border: 1px solid var(--el-border-color); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
.section-label { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); margin-bottom: 8px; }
</style>

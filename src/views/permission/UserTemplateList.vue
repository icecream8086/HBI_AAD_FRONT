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
      <h2>{{ $t('userTemplate.title') }}</h2>
      <el-button
        type="primary"
        size="small"
        @click="openCreate"
      >
        {{ $t('userTemplate.create') }}
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="items"
      stripe
      :empty-text="$t('table.empty')"
    >
      <el-table-column
        prop="name"
        :label="$t('userTemplate.name')"
        min-width="140"
      />
      <el-table-column
        prop="description"
        :label="$t('userTemplate.description')"
        min-width="200"
        show-overflow-tooltip
      />
      <el-table-column
        :label="$t('userTemplate.defaultGroupIds')"
        width="120"
      >
        <template #default="{ row }">
          <span>{{ (row.defaultGroupIds?.length ?? 0) }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('userTemplate.defaultPermGroupIds')"
        width="160"
      >
        <template #default="{ row }">
          <span>{{ (row.defaultPermGroupIds?.length ?? 0) }}</span>
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
      :title="dialog.isEdit ? $t('userTemplate.edit') : $t('userTemplate.create')"
      width="600px"
      destroy-on-close
    >
      <el-form
        :model="form"
        label-width="150px"
      >
        <el-form-item
          :label="$t('userTemplate.name')"
          required
        >
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('userTemplate.description')">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
        <el-form-item :label="$t('userTemplate.defaultGroupIds')">
          <el-select
            v-model="form.defaultGroupIds"
            multiple
            filterable
            style="width:100%"
          >
            <el-option
              v-for="g in userGroups"
              :key="g.id"
              :label="g.name"
              :value="g.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('userTemplate.defaultPermGroupIds')">
          <el-select
            v-model="form.defaultPermGroupIds"
            multiple
            filterable
            style="width:100%"
          >
            <el-option
              v-for="g in permGroups"
              :key="g.id"
              :label="g.name"
              :value="g.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('userTemplate.dependsOn')">
          <el-select
            v-model="form.dependsOn"
            multiple
            filterable
            :placeholder="$t('userTemplate.dependsPlaceholder')"
            style="width:100%"
          >
            <el-option
              v-for="tmpl in filterTemplates"
              :key="tmpl.id"
              :label="tmpl.name"
              :value="tmpl.id"
            />
          </el-select>
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

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const items = ref<UserTemplate[]>([])
const userGroups = ref<UserGroup[]>([])
const permGroups = ref<PermissionGroup[]>([])
const allTemplates = ref<UserTemplate[]>([])
const dialog = reactive({ show: false, isEdit: false, editId: '' })
const page = ref(1)
const limit = 20
const total = ref(0)
const form = reactive({
  name: '',
  description: '',
  defaultGroupIds: [] as string[],
  defaultPermGroupIds: [] as string[],
  dependsOn: [] as string[],
})

const filterTemplates = computed(() => {
  if (!dialog.isEdit) return allTemplates.value
  return allTemplates.value.filter(t => t.id !== dialog.editId)
})

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

function openCreate() {
  dialog.isEdit = false; dialog.editId = ''
  form.name = ''; form.description = ''; form.defaultGroupIds = []; form.defaultPermGroupIds = []; form.dependsOn = []
  dialog.show = true
}

function openEdit(row: UserTemplate) {
  dialog.isEdit = true; dialog.editId = row.id
  form.name = row.name; form.description = row.description ?? ''
  form.defaultGroupIds = [...(row.defaultGroupIds ?? [])]
  form.defaultPermGroupIds = [...(row.defaultPermGroupIds ?? [])]
  form.dependsOn = [...(row.dependsOn ?? [])]
  dialog.show = true
}

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, limit }
    const pageResult = await api.permissions.userTemplates.list(params)
    items.value = pageResult.items ?? []
    total.value = pageResult.total ?? items.value.length
  } catch { ElMessage.error(t('userTemplate.fetchFailed')) }
  finally { loading.value = false }
}

async function handleSave() {
  if (!form.name) { ElMessage.warning(t('userTemplate.nameRequired')); return }
  saving.value = true
  try {
    const payload = {
      name: form.name,
      description: form.description || undefined,
      defaultGroupIds: form.defaultGroupIds.length ? form.defaultGroupIds : undefined,
      defaultPermGroupIds: form.defaultPermGroupIds.length ? form.defaultPermGroupIds : undefined,
      dependsOn: form.dependsOn.length ? form.dependsOn : undefined,
    }
    if (dialog.isEdit) {
      await api.permissions.userTemplates.update(dialog.editId, payload)
      ElMessage.success(t('userTemplate.updateSuccess'))
    } else {
      await api.permissions.userTemplates.create(payload)
      ElMessage.success(t('userTemplate.createSuccess'))
    }
    dialog.show = false; await fetchData()
  } catch { ElMessage.error(t('userTemplate.actionFailed')) }
  finally { saving.value = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('userTemplate.deleteConfirm'), t('table.confirm'))
    await api.permissions.userTemplates.delete(id)
    ElMessage.success(t('userTemplate.deleteSuccess')); await fetchData()
  } catch { /* ignore */ }
}

async function loadReferences() {
  try {
    const [ugRes, pgRes, tmplRes] = await Promise.all([
      api.permissions.userGroups.list({ limit: 100 }),
      api.permissions.groups.list({ limit: 100 }),
      api.permissions.userTemplates.list({ limit: 200 }),
    ])
    userGroups.value = ugRes.items ?? []
    permGroups.value = pgRes.items ?? []
    allTemplates.value = tmplRes.items ?? []
  } catch { /* ignore — select options will be empty */ }
}

onMounted(async () => {
  await fetchData()
  await loadReferences()
})
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>

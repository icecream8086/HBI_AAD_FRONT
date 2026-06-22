<template>
  <div>
    <div class="page-head">
      <h2>{{ $t('action.orgTitle') }}</h2>
      <el-button type="primary" @click="openCreateOrg">{{ $t('action.createOrg') }}</el-button>
    </div>

    <template v-if="orgs.length">
    <el-card v-for="org in orgs" :key="org.id" class="org-card">
      <template #header>
        <div class="org-header">
          <strong>{{ org.name }}</strong>
          <div class="org-actions">
            <el-button size="small" @click="openCreateProject(org.id)">{{ $t('action.createProject') }}</el-button>
            <el-button size="small" type="danger" @click="handleDeleteOrg(org.id)">{{ $t('table.delete') }}</el-button>
          </div>
        </div>
      </template>
      <div v-if="projects[org.id]?.length">
        <el-table :data="projects[org.id]" size="small">
          <el-table-column prop="name" :label="$t('action.projectName')" min-width="140" />
          <el-table-column prop="id" label="ID" width="200" show-overflow-tooltip />
          <el-table-column :label="$t('table.createdAt')" width="170">
            <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column :label="$t('table.actions')" width="100">
            <template #default="{ row }">
              <el-button size="small" type="danger" @click="handleDeleteProject(org.id, row.id)">{{ $t('table.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else class="dim">{{ $t('action.noProjects') }}</div>
    </el-card>
    </template>
    <div v-if="!loading && !orgs.length" class="empty-state">{{ $t('action.noOrgs') }}</div>

    <!-- Create Org Dialog -->
    <el-dialog v-model="orgDlg.show" :title="$t('action.createOrgTitle')" width="400px" destroy-on-close>
      <el-form :model="orgDlg.form" label-width="80px">
        <el-form-item :label="$t('action.orgName')" required>
          <el-input v-model="orgDlg.form.name" placeholder="My Organization" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="orgDlg.show = false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" :loading="orgDlg.saving" @click="handleCreateOrg">{{ $t('table.create') }}</el-button>
      </template>
    </el-dialog>

    <!-- Create Project Dialog -->
    <el-dialog v-model="projectDlg.show" :title="$t('action.createProjectTitle')" width="400px" destroy-on-close>
      <el-form :model="projectDlg.form" label-width="80px">
        <el-form-item :label="$t('action.projectName')" required>
          <el-input v-model="projectDlg.form.name" placeholder="My Project" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="projectDlg.show = false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" :loading="projectDlg.saving" @click="handleCreateProject">{{ $t('table.create') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'

const { t } = useI18n()

const loading = ref(false)
const orgs = ref<ActionOrg[]>([])
const projects = ref<Record<string, ActionProject[]>>({})

const orgDlg = reactive({ show: false, saving: false, form: { name: '' } })
const projectDlg = reactive({ show: false, saving: false, orgId: '', form: { name: '' } })

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

function openCreateOrg() {
  orgDlg.form.name = ''
  orgDlg.show = true
}

function openCreateProject(orgId: string) {
  projectDlg.orgId = orgId
  projectDlg.form.name = ''
  projectDlg.show = true
}

async function fetchData() {
  loading.value = true
  try {
    const orgsRes = await api.actions.orgs.list()
    orgs.value = orgsRes ?? []
    for (const org of orgs.value) {
      try {
        const projRes = await api.actions.projects.list({ orgId: org.id })
        projects.value[org.id] = projRes ?? []
      } catch { projects.value[org.id] = [] }
    }
  } catch { ElMessage.error(t('action.fetchOrgsFailed')) }
  finally { loading.value = false }
}

async function handleCreateOrg() {
  if (!orgDlg.form.name) { ElMessage.warning(t('action.orgNameRequired')); return }
  orgDlg.saving = true
  try {
    await api.actions.orgs.create({ name: orgDlg.form.name })
    ElMessage.success(t('action.createOrgSuccess'))
    orgDlg.show = false; await fetchData()
  } catch { ElMessage.error(t('common.actionFailed')) }
  finally { orgDlg.saving = false }
}

async function handleDeleteOrg(id: string) {
  try {
    await ElMessageBox.confirm(t('action.deleteOrgConfirm'), t('table.confirm'), { type: 'warning' })
    // No delete endpoint in spec — just reload
    await fetchData()
  } catch { /* ignore */ }
}

async function handleCreateProject() {
  if (!projectDlg.form.name) { ElMessage.warning(t('action.projectNameRequired')); return }
  projectDlg.saving = true
  try {
    await api.actions.projects.create({ orgId: projectDlg.orgId, name: projectDlg.form.name })
    ElMessage.success(t('action.createProjectSuccess'))
    projectDlg.show = false; await fetchData()
  } catch { ElMessage.error(t('common.actionFailed')) }
  finally { projectDlg.saving = false }
}

async function handleDeleteProject(orgId: string, projectId: string) {
  try {
    await ElMessageBox.confirm(t('action.deleteProjectConfirm'), t('table.confirm'), { type: 'warning' })
    await fetchData()
  } catch { /* ignore */ }
}

onMounted(fetchData)
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.org-card { margin-bottom: 16px; }
.org-header { display: flex; justify-content: space-between; align-items: center; }
.org-actions { display: flex; gap: 8px; }
.dim { color: var(--el-text-color-secondary); font-size: 13px; padding: 16px 0; }
.empty-state { text-align: center; color: var(--el-text-color-secondary); padding: 40px; }
</style>

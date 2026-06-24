<template>
  <div>
    <el-button text @click="$router.push('/dashboard')" class="back">← {{ $t('common.home') }}</el-button>
    <div class="page-head">
      <h2>{{ $t('elevation.title') }}</h2>
      <el-button type="primary" size="small" @click="openCreate">{{ $t('elevation.grant') }}</el-button>
    </div>

    <el-table :data="items" v-loading="loading" stripe :empty-text="$t('table.empty')">
      <el-table-column :label="$t('elevation.userId')" min-width="180">
        <template #default="{ row }">{{ row.userId }}</template>
      </el-table-column>
      <el-table-column prop="role" :label="$t('elevation.role')" width="100">
        <template #default="{ row }">
          <el-tag :type="row.role === 'wheel' ? 'danger' : 'warning'" size="small">{{ row.role }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('elevation.expiresAt')" width="170">
        <template #default="{ row }">{{ fmt(row.expiresAt) }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.createdAt')" width="170">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.actions')" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="handleRevoke(row.userId)">{{ $t('elevation.revoke') }}</el-button>
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

    <el-dialog v-model="dialog.show" :title="$t('elevation.grant')" width="480px" destroy-on-close>
      <el-form :model="form" label-width="110px">
        <el-form-item :label="$t('elevation.userId')" required>
          <el-select v-model="form.userId" filterable style="width:100%" :placeholder="$t('elevation.userId')">
            <el-option v-for="u in users" :key="u.id" :label="`${u.name} (${u.email})`" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('elevation.duration')" required>
          <el-select v-model="form.duration" style="width:100%">
            <el-option label="5 min" :value="5 * 60" />
            <el-option label="15 min" :value="15 * 60" />
            <el-option label="30 min" :value="30 * 60" />
            <el-option label="1 h" :value="60 * 60" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.show = false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleGrant">{{ $t('elevation.grant') }}</el-button>
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
const saving = ref(false)
const items = ref<any[]>([])
const users = ref<any[]>([])
const page = ref(1)
const limit = 20
const total = ref(0)
const dialog = reactive({ show: false })
const form = reactive({
  userId: '',
  duration: 15 * 60,
})

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

function openCreate() {
  form.userId = ''
  form.duration = 15 * 60
  dialog.show = true
}

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, limit }
    const res = await api.permissions.elevations.list(params)
    items.value = res.items ?? []
    total.value = res.total ?? items.value.length
  } catch { ElMessage.error(t('elevation.fetchFailed')) }
  finally { loading.value = false }
}

async function fetchUsers() {
  try {
    const res = await api.users.list({ limit: 200 })
    users.value = res.items ?? []
  } catch { /* ignore */ }
}

async function handleGrant() {
  if (!form.userId) { ElMessage.warning(t('elevation.userRequired')); return }
  saving.value = true
  try {
    await api.permissions.elevate.create({
      userId: form.userId,
      duration: form.duration,
    } as any)
    ElMessage.success(t('elevation.grantSuccess'))
    dialog.show = false
    await fetchData()
  } catch { ElMessage.error(t('elevation.actionFailed')) }
  finally { saving.value = false }
}

async function handleRevoke(userId: string) {
  try {
    await ElMessageBox.confirm(t('elevation.confirmRevoke'), t('table.confirm'))
    await api.permissions.elevate.delete(userId)
    ElMessage.success(t('elevation.revokeSuccess'))
    await fetchData()
  } catch { /* ignore */ }
}

onMounted(async () => {
  await fetchData()
  await fetchUsers()
})
</script>

<style scoped>
.back { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>

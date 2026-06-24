<template>
  <div v-loading="loading">
    <el-button text @click="$router.push('/users')" class="back">{{ $t('user.back') }}</el-button>

    <div v-if="user">
      <h2>{{ user.name }}</h2>

      <el-form label-width="120px" style="max-width:600px">
        <el-form-item label="ID">
          <el-input :model-value="user.id" disabled />
        </el-form-item>
        <el-form-item :label="$t('user.name')">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('user.email')">
          <el-input :model-value="user.email" disabled />
        </el-form-item>
        <el-form-item :label="$t('user.role')">
          <el-select v-model="form.role">
            <el-option label="Viewer" value="Viewer" />
            <el-option label="Operator" value="Operator" />
            <el-option label="Root" value="root" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('user.save') }}</el-button>
          <el-button @click="handleRefresh" :disabled="refreshing">{{ $t('user.refreshCache') }}{{ refreshing ? $t('user.refreshing') : '' }}</el-button>
        </el-form-item>
      </el-form>

      <!-- Login Policy -->
      <el-card class="section">
        <template #header>
          <span>{{ $t('user.loginPolicy') }}</span>
          <el-button size="small" style="float:right;margin-left:6px" @click="fetchPolicy">{{ $t('user.refresh') }}</el-button>
          <el-button size="small" style="float:right" @click="openPolicyEdit">{{ $t('user.editPolicy') }}</el-button>
        </template>
        <div v-if="policy">
          <el-descriptions :column="2" border>
            <el-descriptions-item :label="$t('user.enabled')">
              <el-tag :type="policy.enabled?'success':'danger'">{{ policy.enabled ? '是' : '否' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('user.timeLimit')">
              {{ policy.timeRanges?.length ? policy.timeRanges.map((t:any)=>`${t.start}-${t.end}`).join('; ') : $t('common.none') }}
            </el-descriptions-item>
            <el-descriptions-item :label="$t('user.ipLimit')">
              {{ policy.allowedCIDRs?.join(', ') || $t('common.none') }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <el-empty v-else :description="$t('user.noPolicy')" :image-size="60" />
      </el-card>

      <el-dialog v-model="showPolicyDialog" :title="$t('user.policyTitle')" width="550px">
        <el-form :model="policyForm" label-width="120px">
          <el-form-item :label="$t('user.enabled')">
            <el-switch v-model="policyForm.enabled" />
          </el-form-item>
          <el-form-item :label="$t('user.ipWhitelist')">
            <el-select v-model="policyForm.allowedCIDRs" multiple filterable allow-create default-first-option style="width:100%" :placeholder="$t('user.cidrPlaceholder')">
              <el-option v-for="c in policyForm.allowedCIDRs" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('user.timeLimit')">
            <div v-for="(r, i) in policyForm.timeRanges" :key="i" class="range-row">
              <el-input v-model="r.start" placeholder="09:00" style="width:100px" size="small" />
              <span style="margin:0 6px">至</span>
              <el-input v-model="r.end" placeholder="18:00" style="width:100px" size="small" />
              <span style="margin:0 6px;font-size:12px;color:var(--el-text-color-secondary)">周</span>
              <span style="font-size:12px;color:var(--el-text-color-secondary)">{{ Array.isArray(r.days) ? r.days.join(',') : (r.days || '') }}</span>
              <el-button type="danger" size="small" @click="policyForm.timeRanges.splice(i,1)" circle>−</el-button>
            </div>
            <el-button size="small" @click="policyForm.timeRanges.push({start:'09:00',end:'18:00',days:[1,2,3,4,5]})">{{ $t('user.addTimeRange') }}</el-button>
            <p class="hint">{{ $t('user.timeHint') }}</p>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showPolicyDialog=false">{{ $t('table.cancel') }}</el-button>
          <el-button type="primary" :loading="savingPolicy" @click="handleSavePolicy">{{ $t('user.save') }}</el-button>
        </template>
      </el-dialog>

      <!-- 用户组 -->
      <el-card class="section">
        <template #header>
          <span>{{ $t('user.userGroups') }} ({{ userGroups.length }})</span>
          <el-button size="small" style="float:right" @click="showGroupDialog = true">{{ $t('user.manageGroups') }}</el-button>
        </template>
        <div v-if="userGroups.length">
          <el-tag v-for="g in userGroups" :key="g.id" style="margin-right:6px;margin-bottom:6px">
            {{ g.name }}
          </el-tag>
        </div>
        <el-empty v-else :description="$t('user.noGroups')" :image-size="50" />
      </el-card>

      <el-dialog v-model="showGroupDialog" :title="$t('user.manageGroupsTitle')" width="500px">
        <p class="group-hint">{{ $t('user.groupHint') }}</p>
        <el-checkbox-group v-model="selectedGroupIds">
          <div v-for="g in allGroups" :key="g.id" class="group-item">
            <el-checkbox :value="g.id" :label="`${g.name} (${(g.memberIds?.length||0)} 人)`" />
          </div>
        </el-checkbox-group>
        <template #footer>
          <el-button @click="showGroupDialog=false">{{ $t('table.cancel') }}</el-button>
          <el-button type="primary" :loading="savingGroups" @click="handleSaveGroups">{{ $t('user.save') }}</el-button>
        </template>
      </el-dialog>

      <!-- Public Key -->
      <el-card class="section">
        <template #header>{{ $t('user.ed25519Key') }}</template>
        <div v-if="publicKey !== null">
          <code style="word-break:break-all">{{ publicKey }}</code>
        </div>
        <el-empty v-else :description="$t('user.noPublicKey')" :image-size="60" />
      </el-card>

      <!-- User Caps -->
      <el-card class="section">
        <template #header>
          <span>{{ $t('user.userCaps') }}</span>
          <el-button size="small" style="float:right" @click="openCapsEdit">{{ $t('table.edit') }}</el-button>
        </template>
        <div v-if="userCaps && Object.keys(userCaps).length">
          <el-tag v-for="(v, k) in userCaps" :key="k" :type="v ? 'success' : 'danger'" style="margin:0 6px 6px 0">
            {{ k }}: {{ v ? $t('common.yes') : $t('common.no') }}
          </el-tag>
        </div>
        <el-empty v-else :description="$t('user.noCaps')" :image-size="50" />
      </el-card>

      <el-dialog v-model="showCapsDialog" :title="$t('user.editCaps')" width="400px">
        <el-form label-width="100px">
          <el-form-item v-for="(v, k) in capsForm" :key="k" :label="k">
            <el-switch v-model="capsForm[k]" />
          </el-form-item>
          <el-empty v-if="!Object.keys(capsForm).length" :description="$t('user.noCaps')" :image-size="40" />
        </el-form>
        <template #footer>
          <el-button @click="showCapsDialog=false">{{ $t('table.cancel') }}</el-button>
          <el-button type="primary" :loading="savingCaps" @click="handleSaveCaps">{{ $t('user.save') }}</el-button>
        </template>
      </el-dialog>

      <!-- Supplementary Groups -->
      <el-card class="section">
        <template #header>
          <span>{{ $t('user.supplementaryGroups') }}</span>
          <el-button size="small" style="float:right" @click="showSuppGroupDialog = true">{{ $t('user.addSupplementaryGroup') }}</el-button>
        </template>
        <div v-if="suppGroups.length">
          <el-tag v-for="gid in suppGroups" :key="gid" closable style="margin:0 6px 6px 0" @close="handleRemoveSuppGroup(gid)">
            {{ gid }}
          </el-tag>
        </div>
        <el-empty v-else :description="$t('user.noSupplementaryGroups')" :image-size="50" />
      </el-card>

      <el-dialog v-model="showSuppGroupDialog" :title="$t('user.addSupplementaryGroup')" width="400px">
        <el-form label-width="80px">
          <el-form-item :label="$t('user.supplementaryGid')">
            <el-input v-model="newSuppGid" placeholder="GID" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showSuppGroupDialog=false">{{ $t('table.cancel') }}</el-button>
          <el-button type="primary" :loading="savingSuppGroup" @click="handleAddSuppGroup">{{ $t('table.create') }}</el-button>
        </template>
      </el-dialog>

      <!-- Active Sessions -->
      <el-card class="section">
        <template #header>
          <span>{{ $t('user.sessions') }} ({{ sessions.length }})</span>
        </template>
        <el-table v-if="sessions.length" :data="sessions" size="small">
          <el-table-column prop="id" label="Token" width="200">
            <template #default="{ row }">{{ (row.id || row.token || '').slice(0, 16) }}…</template>
          </el-table-column>
          <el-table-column label="Created" width="160">
            <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column :label="$t('table.actions')" width="100">
            <template #default="{ row }">
              <el-button size="small" type="danger" @click="handleRevokeSession(row)">{{ $t('user.sessionRevoke') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else :description="$t('user.noSessions')" :image-size="50" />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { api } from '../../api'

const route = useRoute()
const { t } = useI18n()
const loading = ref(false)
const saving = ref(false)
const refreshing = ref(false)
const user = ref<User | null>(null)
const policy = ref<LoginPolicy | null>(null)
const publicKey = ref<string | null>(null)
const form = reactive({ name: '', role: '' })
const showPolicyDialog = ref(false)
const savingPolicy = ref(false)
const policyForm = reactive({ enabled: true, timeRanges: [] as { start: string; end: string; days: number[] }[], allowedCIDRs: [] as string[] })

function openPolicyEdit() {
  if (policy.value) {
    policyForm.enabled = policy.value.enabled
    policyForm.timeRanges = policy.value.timeRanges?.map(r => ({ ...r })) || []
    policyForm.allowedCIDRs = [...(policy.value.allowedCIDRs || [])]
  } else {
    policyForm.enabled = true
    policyForm.timeRanges = []
    policyForm.allowedCIDRs = []
  }
  showPolicyDialog.value = true
}

async function handleSavePolicy() {
  savingPolicy.value = true
  try {
    await api.users.loginPolicy.update(route.params.id as string, {
      enabled: policyForm.enabled,
      timeRanges: policyForm.timeRanges,
      allowedCIDRs: policyForm.allowedCIDRs,
    })
    ElMessage.success(t('user.policyUpdated'))
    showPolicyDialog.value = false
    await fetchPolicy()
  } catch { ElMessage.error(t('user.saveFailed')) }
  finally { savingPolicy.value = false }
}
const userGroups = ref<UserGroup[]>([])
const allGroups = ref<UserGroup[]>([])
const selectedGroupIds = ref<string[]>([])
const showGroupDialog = ref(false)
const savingGroups = ref(false)

// ─── User Caps ───
const userCaps = ref<Record<string, boolean> | null>(null)
const showCapsDialog = ref(false)
const savingCaps = ref(false)
const capsForm = reactive<Record<string, boolean>>({})

async function fetchCaps() {
  try { userCaps.value = await api.permissions.caps.user.get(route.params.id as string) as any }
  catch { userCaps.value = null }
}

function openCapsEdit() {
  capsForm && Object.keys(capsForm).forEach(k => delete capsForm[k])
  if (userCaps.value) Object.assign(capsForm, { ...userCaps.value })
  showCapsDialog.value = true
}

async function handleSaveCaps() {
  savingCaps.value = true
  try {
    await api.permissions.caps.user.update(route.params.id as string, { ...capsForm })
    userCaps.value = { ...capsForm }
    ElMessage.success(t('user.capsUpdated'))
    showCapsDialog.value = false
  } catch { ElMessage.error(t('user.saveFailed')) }
  finally { savingCaps.value = false }
}

// ─── Supplementary Groups ───
const suppGroups = ref<string[]>([])
const showSuppGroupDialog = ref(false)
const savingSuppGroup = ref(false)
const newSuppGid = ref('')

async function fetchSuppGroups() {
  try { suppGroups.value = await api.users.supplementaryGroups.list(route.params.id as string) as any }
  catch { suppGroups.value = [] }
}

async function handleAddSuppGroup() {
  if (!newSuppGid.value.trim()) { ElMessage.warning(t('user.gidRequired')); return }
  savingSuppGroup.value = true
  try {
    await api.users.supplementaryGroups.add(route.params.id as string, newSuppGid.value.trim())
    ElMessage.success(t('user.suppGroupAdded'))
    showSuppGroupDialog.value = false
    newSuppGid.value = ''
    await fetchSuppGroups()
  } catch { ElMessage.error(t('user.saveFailed')) }
  finally { savingSuppGroup.value = false }
}

async function handleRemoveSuppGroup(gid: string) {
  try {
    await api.users.supplementaryGroups.remove(route.params.id as string, gid)
    ElMessage.success(t('user.suppGroupRemoved'))
    await fetchSuppGroups()
  } catch { ElMessage.error(t('user.saveFailed')) }
}

// ─── Sessions ───
const sessions = ref<any[]>([])

async function fetchSessions() {
  try {
    const res = await api.users.sessions.list({ userId: route.params.id as string })
    sessions.value = Array.isArray(res) ? res : (res as any)?.items ?? []
  } catch { sessions.value = [] }
}

async function handleRevokeSession(row: any) {
  try {
    const tid = row.token || row.id
    await api.users.sessions.delete(tid)
    ElMessage.success(t('user.sessionRevoked'))
    await fetchSessions()
  } catch { ElMessage.error(t('user.saveFailed')) }
}

async function load() {
  loading.value = true
  try {
    user.value = await api.users.get(route.params.id as string) as User
    form.name = user.value.name; form.role = user.value.role
  } catch { ElMessage.error(t('user.loadFailed')) }
  finally { loading.value = false }
}

async function fetchPolicy() {
  try { policy.value = await api.users.loginPolicy.get(route.params.id as string) as any }
  catch { policy.value = null }
}
async function fetchPublicKey() {
  try { publicKey.value = await api.users.publicKey.get(route.params.id as string) as any }
  catch { publicKey.value = null }
}

async function fetchGroups() {
  try {
    const groups = await api.permissions.userGroups.list({ limit: 100 }).then(r => r.items)
    allGroups.value = groups
    userGroups.value = groups.filter(g => g.memberIds?.includes(route.params.id as string))
  } catch { /* ignore */ }
}

async function handleSaveGroups() {
  savingGroups.value = true
  try {
    const changed = allGroups.value.reduce<Promise<void>[]>((acc, g) => {
      const isCurrentlyMember = g.memberIds?.includes(route.params.id as string) ?? false
      const shouldBeMember = selectedGroupIds.value.includes(g.id)
      if (isCurrentlyMember !== shouldBeMember) {
        const members = (g.memberIds || []).filter((id: string) => id !== route.params.id as string)
        if (shouldBeMember) members.push(route.params.id as string)
        acc.push(api.perm.updateUserGroup(g.id, { name: g.name, memberIds: members }))
      }
      return acc
    }, [])
    await Promise.all(changed)
    ElMessage.success(t('user.groupUpdated'))
    showGroupDialog.value = false
    await fetchGroups()
  } catch { ElMessage.error(t('user.saveFailed')) }
  finally { savingGroups.value = false }
}

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

onMounted(async () => {
  await load()
  await Promise.all([fetchPolicy(), fetchPublicKey(), fetchGroups(), fetchCaps(), fetchSuppGroups(), fetchSessions()])
})

watch(showGroupDialog, (v) => {
  if (v) selectedGroupIds.value = userGroups.value.map(g => g.id)
})

async function handleSave() {
  saving.value = true
  try {
    await api.users.update(route.params.id as string, { name: form.name, role: form.role, privateKeyEd25519: user.value?.privateKeyEd25519 || '' })
    ElMessage.success(t('user.saved'))
  } catch { ElMessage.error(t('user.saveFailed')) }
  finally { saving.value = false }
}

async function handleRefresh() {
  refreshing.value = true
  try {
    await api.users.refresh(route.params.id as string)
    ElMessage.success(t('user.cacheRefreshed'))
  } catch { ElMessage.error(t('user.refreshFailed')) }
  finally { refreshing.value = false }
}
</script>

<style scoped>
.back { margin-bottom: 8px; }
.section { margin-top: 16px; }
.group-hint { margin-bottom: 12px; color: var(--el-text-color-secondary); font-size: 13px; }
.group-item { padding: 6px 0; }
.range-row { display: flex; align-items: center; margin-bottom: 8px; }
.hint { font-size: 11px; color: var(--el-text-color-placeholder); margin-top: 4px; }
</style>

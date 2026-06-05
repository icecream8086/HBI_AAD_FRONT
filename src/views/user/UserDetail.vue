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
    await api.users.apiUsersIdLoginPolicyPut(route.params.id as string, {
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

async function load() {
  loading.value = true
  try {
    user.value = await api.extract<User>(api.users.apiUsersIdGet(route.params.id as string))
    form.name = user.value.name; form.role = user.value.role
  } catch { ElMessage.error(t('user.loadFailed')) }
  finally { loading.value = false }
}

async function fetchPolicy() {
  try { policy.value = await api.extract<LoginPolicy>(api.users.apiUsersIdLoginPolicyGet(route.params.id as string)) as any }
  catch { policy.value = null }
}
async function fetchPublicKey() {
  try { publicKey.value = await api.extract<string>(api.users.apiUsersIdPublicKeyGet(route.params.id as string)) as any }
  catch { publicKey.value = null }
}

async function fetchGroups() {
  try {
    const groups = await api.extractItems<UserGroup>(api.permissions.apiPermissionsUserGroupsGet())
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
        acc.push(api.permissions.apiPermissionsUserGroupsIdPut(g.id, { name: g.name, memberIds: members } as any))
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

onMounted(async () => {
  await load()
  await Promise.all([fetchPolicy(), fetchPublicKey(), fetchGroups()])
})

watch(showGroupDialog, (v) => {
  if (v) selectedGroupIds.value = userGroups.value.map(g => g.id)
})

async function handleSave() {
  saving.value = true
  try {
    await api.users.apiUsersIdPut(route.params.id as string, { name: form.name, role: form.role, privateKeyEd25519: user.value?.privateKeyEd25519 || '' })
    ElMessage.success(t('user.saved'))
  } catch { ElMessage.error(t('user.saveFailed')) }
  finally { saving.value = false }
}

async function handleRefresh() {
  refreshing.value = true
  try {
    await api.users.apiUsersIdRefreshPost(route.params.id as string)
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

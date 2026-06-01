<template>
  <div v-loading="loading">
    <el-button text @click="$router.push('/users')" class="back">← 返回用户列表</el-button>

    <div v-if="user">
      <h2>{{ user.name }}</h2>

      <el-form label-width="120px" style="max-width:600px">
        <el-form-item label="ID">
          <el-input :model-value="user.id" disabled />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input :model-value="user.email" disabled />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role">
            <el-option label="Viewer" value="Viewer" />
            <el-option label="Operator" value="Operator" />
            <el-option label="Root" value="root" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
          <el-button @click="handleRefresh" :disabled="refreshing">刷新缓存{{ refreshing ? '中' : '' }}</el-button>
        </el-form-item>
      </el-form>

      <!-- Login Policy -->
      <el-card class="section">
        <template #header>
          <span>登录策略</span>
          <el-button size="small" style="float:right;margin-left:6px" @click="fetchPolicy">刷新</el-button>
          <el-button size="small" style="float:right" @click="openPolicyEdit">编辑</el-button>
        </template>
        <div v-if="policy">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="启用">
              <el-tag :type="policy.enabled?'success':'danger'">{{ policy.enabled ? '是' : '否' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="时间限制">
              {{ policy.timeRanges?.length ? policy.timeRanges.map((t:any)=>`${t.start}-${t.end}`).join('; ') : '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="IP 限制">
              {{ policy.allowedCIDRs?.join(', ') || '无' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <el-empty v-else description="无登录策略" :image-size="60" />
      </el-card>

      <el-dialog v-model="showPolicyDialog" title="编辑登录策略" width="550px">
        <el-form :model="policyForm" label-width="120px">
          <el-form-item label="启用">
            <el-switch v-model="policyForm.enabled" />
          </el-form-item>
          <el-form-item label="IP 白名单">
            <el-select v-model="policyForm.allowedCIDRs" multiple filterable allow-create default-first-option style="width:100%" placeholder="输入 CIDR 后回车，如 10.0.0.0/8">
              <el-option v-for="c in policyForm.allowedCIDRs" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间限制">
            <div v-for="(r, i) in policyForm.timeRanges" :key="i" class="range-row">
              <el-input v-model="r.start" placeholder="09:00" style="width:100px" size="small" />
              <span style="margin:0 6px">至</span>
              <el-input v-model="r.end" placeholder="18:00" style="width:100px" size="small" />
              <span style="margin:0 6px;font-size:12px;color:var(--el-text-color-secondary)">周</span>
              <span style="font-size:12px;color:var(--el-text-color-secondary)">{{ Array.isArray(r.days) ? r.days.join(',') : (r.days || '') }}</span>
              <el-button type="danger" size="small" @click="policyForm.timeRanges.splice(i,1)" circle>−</el-button>
            </div>
            <el-button size="small" @click="policyForm.timeRanges.push({start:'09:00',end:'18:00',days:[1,2,3,4,5]})">+ 添加时段</el-button>
            <p class="hint">时间格式 HH:mm，days 为星期几 (1=周一)</p>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showPolicyDialog=false">取消</el-button>
          <el-button type="primary" :loading="savingPolicy" @click="handleSavePolicy">保存</el-button>
        </template>
      </el-dialog>

      <!-- 用户组 -->
      <el-card class="section">
        <template #header>
          <span>用户组 ({{ userGroups.length }})</span>
          <el-button size="small" style="float:right" @click="showGroupDialog = true">管理</el-button>
        </template>
        <div v-if="userGroups.length">
          <el-tag v-for="g in userGroups" :key="g.id" style="margin-right:6px;margin-bottom:6px">
            {{ g.name }}
          </el-tag>
        </div>
        <el-empty v-else description="未加入任何用户组" :image-size="50" />
      </el-card>

      <el-dialog v-model="showGroupDialog" title="管理用户组" width="500px">
        <p class="group-hint">选择此用户所属的用户组</p>
        <el-checkbox-group v-model="selectedGroupIds">
          <div v-for="g in allGroups" :key="g.id" class="group-item">
            <el-checkbox :value="g.id" :label="`${g.name} (${(g.memberIds?.length||0)} 人)`" />
          </div>
        </el-checkbox-group>
        <template #footer>
          <el-button @click="showGroupDialog=false">取消</el-button>
          <el-button type="primary" :loading="savingGroups" @click="handleSaveGroups">保存</el-button>
        </template>
      </el-dialog>

      <!-- Public Key -->
      <el-card class="section">
        <template #header>Ed25519 公钥</template>
        <div v-if="publicKey !== null">
          <code style="word-break:break-all">{{ publicKey }}</code>
        </div>
        <el-empty v-else description="未设置公钥" :image-size="60" />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '../../api'

const route = useRoute()
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
    ElMessage.success('登录策略已更新')
    showPolicyDialog.value = false
    await fetchPolicy()
  } catch { ElMessage.error('保存失败') }
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
  } catch { ElMessage.error('加载失败') }
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
    // For each group that changed membership, update it
    for (const g of allGroups.value) {
      const isCurrentlyMember = g.memberIds?.includes(route.params.id as string) ?? false
      const shouldBeMember = selectedGroupIds.value.includes(g.id)
      if (isCurrentlyMember !== shouldBeMember) {
        const members = (g.memberIds || []).filter((id: string) => id !== route.params.id as string)
        if (shouldBeMember) members.push(route.params.id as string)
        await api.permissions.apiPermissionsUserGroupsIdPut(g.id, { name: g.name, memberIds: members } as any)
      }
    }
    ElMessage.success('用户组已更新')
    showGroupDialog.value = false
    await fetchGroups()
  } catch { ElMessage.error('保存失败') }
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
    ElMessage.success('已保存')
  } catch { ElMessage.error('保存失败') }
  finally { saving.value = false }
}

async function handleRefresh() {
  refreshing.value = true
  try {
    await api.users.apiUsersIdRefreshPost(route.params.id as string)
    ElMessage.success('缓存已刷新')
  } catch { ElMessage.error('刷新失败') }
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

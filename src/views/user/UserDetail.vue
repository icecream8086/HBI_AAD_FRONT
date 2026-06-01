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
          <el-button size="small" style="float:right" @click="fetchPolicy">刷新</el-button>
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
import { ref, reactive, onMounted } from 'vue'
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

onMounted(async () => {
  await load()
  await Promise.all([fetchPolicy(), fetchPublicKey()])
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
</style>

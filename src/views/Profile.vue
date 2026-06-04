<template>
  <div>
    <h2>{{ $t('page.profile') }}</h2>
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card>
          <template #header>{{ $t('profile.avatar') }}</template>
          <div class="avatar-section">
            <el-avatar :size="120" :src="avatarBlob" class="profile-avatar">
              {{ (user?.name || user?.email || 'U')[0].toUpperCase() }}
            </el-avatar>
            <div class="avatar-actions">
              <el-upload
                :show-file-list="false"
                :http-request="handleUpload"
                accept="image/jpeg,image/png,image/webp,image/gif"
              >
                <el-button size="small" type="primary">{{ $t('profile.uploadAvatar') }}</el-button>
              </el-upload>
              <el-button v-if="hasAvatar" size="small" type="danger" @click="handleDelete" :loading="deleting">{{ $t('profile.deleteAvatar') }}</el-button>
            </div>
            <p class="hint">{{ $t('profile.avatarHint') }}</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card v-if="user">
          <template #header>
            <span>{{ $t('profile.userInfo') }}</span>
            <el-button size="small" style="float:right" @click="openEdit">{{ $t('profile.editProfile') }}</el-button>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item :label="$t('profile.name')">{{ user.name }}</el-descriptions-item>
            <el-descriptions-item :label="$t('profile.email')">{{ user.email }}</el-descriptions-item>
            <el-descriptions-item :label="$t('profile.role')">
              <el-tag :type="roleTag">{{ user.role }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('profile.ed25519Key')">
              <el-tag :type="user.privateKeyEd25519 ? 'success' : 'info'" size="small">
                {{ user.privateKeyEd25519 ? $t('profile.keySet') : $t('profile.keyNotSet') }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('table.createdAt')">{{ fmt(user.createdAt) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
        <el-empty v-else :description="$t('dashboard.notLoggedIn')" />
      </el-col>
    </el-row>

    <el-dialog v-model="editDlg.show" :title="$t('profile.editTitle')" width="500px">
      <el-form :model="editForm" :label-width="locale === 'en' ? '140px' : '100px'">
        <el-form-item :label="$t('profile.name')">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item :label="$t('profile.email')">
          <el-input :model-value="user?.email" disabled />
        </el-form-item>
        <el-form-item :label="$t('profile.ed25519Key')">
          <el-input v-model="editForm.privateKey" type="textarea" :rows="2" :placeholder="$t('profile.ed25519Placeholder')" />
          <p class="form-hint">{{ $t('profile.ed25519Hint') }}</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDlg.show = false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('table.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const API_BASE = 'http://localhost:3000'
const store = useStore<State>()
const user = computed(() => store.state.auth.currentUser)
const deleting = ref(false)
const saving = ref(false)
const avatarVer = ref(0)
const editDlg = reactive({ show: false })
const editForm = reactive({ name: '', privateKey: '' })

const roleTag = computed(() => {
  const m: Record<string, string> = { root: 'danger', Operator: 'warning', Viewer: 'info' }
  return m[user.value?.role || ''] || 'info'
})
const avatarBlob = ref('')
const hasAvatar = computed(() => avatarBlob.value || localStorage.getItem('_has_avatar'))

async function loadAvatar() {
  if (!user.value?.id) { avatarBlob.value = ''; return }
  if (avatarBlob.value) URL.revokeObjectURL(avatarBlob.value)
  try {
    const token = localStorage.getItem('access_token')
    const res = await fetch(`${API_BASE}/api/users/${user.value.id}/avatar`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!res.ok) { avatarBlob.value = ''; return }
    const blob = await res.blob()
    avatarBlob.value = URL.createObjectURL(blob)
  } catch { avatarBlob.value = '' }
}

watch([user, avatarVer], loadAvatar, { immediate: true })

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

function openEdit() {
  if (!user.value) return
  editForm.name = user.value.name
  editForm.privateKey = user.value.privateKeyEd25519 || ''
  editDlg.show = true
}

const AVATAR_MAX = 1048576

async function handleUpload(options: any) {
  try {
    const token = localStorage.getItem('access_token')
    const res = await fetch(`${API_BASE}/api/users/${user.value?.id}/avatar`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: options.file,
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err?.error?.message || t('profile.uploadFailed'))
    }
    avatarVer.value++
    localStorage.setItem('_has_avatar', '1')
    ElMessage.success(t('profile.uploadSuccess'))
  } catch (e: unknown) {
    ElMessage.error((e as Error)?.message || t('profile.uploadFailed'))
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    const token = localStorage.getItem('access_token')
    const res = await fetch(`${API_BASE}/api/users/${user.value?.id}/avatar`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!res.ok) throw new Error()
    avatarVer.value++
    localStorage.removeItem('_has_avatar')
    ElMessage.success(t('profile.deleteSuccess'))
  } catch { ElMessage.error(t('profile.deleteFailed')) }
  finally { deleting.value = false }
}

async function handleSave() {
  if (!editForm.name.trim()) { ElMessage.warning(t('profile.nameRequired')); return }
  saving.value = true
  try {
    const body = { name: editForm.name.trim(), role: user.value!.role, privateKeyEd25519: editForm.privateKey || '' }
    const token = localStorage.getItem('access_token')
    const res = await fetch(`${API_BASE}/api/users/${user.value?.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data?.error?.message || t('profile.saveFailed'))
    store.commit('auth/SET_USER', data.data)
    editDlg.show = false
    ElMessage.success(t('profile.saveSuccess'))
  } catch (e: unknown) {
    ElMessage.error((e as Error)?.message || t('profile.saveFailed'))
  }
  finally { saving.value = false }
}
</script>

<style scoped>
.avatar-section { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.avatar-actions { display: flex; gap: 8px; }
.hint { font-size: 11px; color: var(--el-text-color-placeholder); text-align: center; }
.form-hint { font-size: 11px; color: var(--el-text-color-placeholder); margin: 2px 0 0; }
</style>

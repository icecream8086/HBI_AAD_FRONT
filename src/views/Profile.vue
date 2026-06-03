<template>
  <div>
    <h2>个人设置</h2>
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card>
          <template #header>头像</template>
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
                <el-button size="small" type="primary">上传头像</el-button>
              </el-upload>
              <el-button v-if="hasAvatar" size="small" type="danger" @click="handleDelete" :loading="deleting">删除</el-button>
            </div>
            <p class="hint">JPEG/PNG/WebP/GIF，最大 1MB</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card v-if="user">
          <template #header>
            <span>用户信息</span>
            <el-button size="small" style="float:right" @click="openEdit">编辑</el-button>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="名称">{{ user.name }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ user.email }}</el-descriptions-item>
            <el-descriptions-item label="角色">
              <el-tag :type="roleTag">{{ user.role }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Ed25519 密钥">
              <el-tag :type="user.privateKeyEd25519 ? 'success' : 'info'" size="small">
                {{ user.privateKeyEd25519 ? '已设置' : '未设置' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ fmt(user.createdAt) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
        <el-empty v-else description="未登录" />
      </el-col>
    </el-row>

    <el-dialog v-model="editDlg.show" title="编辑个人信息" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input :model-value="user?.email" disabled />
        </el-form-item>
        <el-form-item label="Ed25519 私钥">
          <el-input v-model="editForm.privateKey" type="textarea" :rows="2" placeholder="留空保持不变" />
          <p class="form-hint">用于无密码登录，非必须</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDlg.show = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

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
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/** Quick magic-byte check for JPEG/PNG/WebP/GIF */
function checkImageMagic(buf: Uint8Array): boolean {
  if (buf.length < 4) return false
  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return true
  // GIF: 47 49 46 38 (37 61 or 39 61)
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true
  return false
}

async function handleUpload(options: any) {
  // const file: File = options.file
  // if (file.size > AVATAR_MAX) { ElMessage.warning(`头像不能超过 ${AVATAR_MAX / 1024} KB`); return }
  // if (!ALLOWED_MIME.includes(file.type)) { ElMessage.warning('仅支持 JPEG/PNG/WebP/GIF 格式'); return }
  // const head = new Uint8Array(await file.slice(0, 4).arrayBuffer())
  // if (!checkImageMagic(head)) { ElMessage.warning('文件内容不是有效的图片格式'); return }

  try {
    const token = localStorage.getItem('access_token')
    const res = await fetch(`${API_BASE}/api/users/${user.value?.id}/avatar`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: options.file,
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err?.error?.message || '上传失败')
    }
    avatarVer.value++
    localStorage.setItem('_has_avatar', '1')
    ElMessage.success('头像已更新')
  } catch (e: unknown) {
    ElMessage.error((e as Error)?.message || '上传失败')
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
    ElMessage.success('头像已删除')
  } catch { ElMessage.error('删除失败') }
  finally { deleting.value = false }
}

async function handleSave() {
  if (!editForm.name.trim()) { ElMessage.warning('名称不能为空'); return }
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
    if (!data.success) throw new Error(data?.error?.message || '保存失败')
    store.commit('auth/SET_USER', data.data)
    editDlg.show = false
    ElMessage.success('已保存')
  } catch (e: unknown) {
    ElMessage.error((e as Error)?.message || '保存失败')
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

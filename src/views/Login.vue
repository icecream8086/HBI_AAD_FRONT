<template>
  <div class="login-container">
    <el-card class="login-card" shadow="always">
      <template #header>
        <div class="login-header">
          <h2>HBI AAD</h2>
          <p class="subtitle">容器编排管理平台 v4.0</p>
        </div>
      </template>

      <el-tabs v-model="activeTab" stretch>
        <el-tab-pane label="登录" name="login">
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            @keyup.enter="handleLogin"
            label-position="top"
          >
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="loginForm.email" placeholder="your@email.com" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="loginForm.password" type="password" placeholder="••••••••" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loading" @click="handleLogin" class="full-btn">
                {{ loading ? '登录中...' : '登录' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="注册" name="register">
          <el-form
            ref="regFormRef"
            :model="regForm"
            :rules="regRules"
            @keyup.enter="handleRegister"
            label-position="top"
          >
            <el-form-item label="用户名" prop="name">
              <el-input v-model="regForm.name" placeholder="你的名称" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="regForm.email" placeholder="your@email.com" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="regForm.password" type="password" placeholder="至少8位" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loading" @click="handleRegister" class="full-btn">
                {{ loading ? '注册中...' : '注册' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="login-footer">
        <p class="hint">开发环境默认账号: dev@hbi.local / devpassword123</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { api } from '../api'
import { useStore } from 'vuex'

const router = useRouter()
const store = useStore<State>()
const loading = ref(false)
const activeTab = ref('login')
const loginFormRef = ref<FormInstance>()
const regFormRef = ref<FormInstance>()

const loginForm = reactive({ email: 'dev@hbi.local', password: 'devpassword123' })
const loginRules = {
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const regForm = reactive({ name: '', email: '', password: '' })
const regRules = {
  name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码至少 8 位', trigger: 'blur' },
  ],
}

async function handleLogin() {
  const valid = await loginFormRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const authRes = await api.auth.login(loginForm)
    store.commit('auth/SET_TOKEN', authRes.token)
    store.commit('auth/SET_USER', authRes.user)
    // Dev: auto-elevate to wheel for full API access
    try { await api.dev.becomeWheel(authRes.user.id) } catch { /* ignore */ }
    ElMessage.success(`欢迎回来, ${authRes.user.name || authRes.user.email}!`)
    router.push('/dashboard')
  } catch (e: unknown) {
    ElMessage.error((e as Error)?.message || '登录失败，请检查邮箱和密码')
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  const valid = await regFormRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const authRes = await api.auth.register(regForm)
    store.commit('auth/SET_TOKEN', authRes.token)
    store.commit('auth/SET_USER', authRes.user)
    // Dev: auto-elevate to wheel for full API access
    try { await api.dev.becomeWheel(authRes.user.id) } catch { /* ignore */ }
    ElMessage.success(`注册成功, 欢迎 ${authRes.user.name}!`)
    router.push('/dashboard')
  } catch (e: unknown) {
    ElMessage.error((e as Error)?.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}
.login-card {
  width: 420px;
  border-radius: 12px;
}
.login-header { text-align: center; }
.login-header h2 { margin: 0; font-size: 24px; }
.subtitle { color: var(--el-text-color-secondary); font-size: 12px; margin-top: 4px; }
.full-btn { width: 100%; }
.login-footer { margin-top: 16px; text-align: center; }
.hint { font-size: 11px; color: var(--el-text-color-placeholder); }
</style>

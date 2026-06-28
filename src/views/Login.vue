<template>
  <div class="login-container">
    <el-card
      class="login-card"
      shadow="always"
    >
      <template #header>
        <div class="login-header">
          <div>
            <h2>HBI AAD</h2>
            <p class="subtitle">
              {{ $t('login.subtitle') }}
            </p>
          </div>
          <div class="header-actions">
            <el-dropdown
              trigger="click"
              @command="(cmd: string) => setLang(cmd)"
            >
              <span class="lang-btn">
                <el-icon :size="14"><ChatDotSquare /></el-icon>
                <span style="margin-left:2px">{{ locale === 'zh-CN' ? '简体中文' : 'English' }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="opt in LANG_OPTIONS"
                    :key="opt.id"
                    :command="opt.id"
                  >
                    {{ opt.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-dropdown
              trigger="click"
              @command="(cmd: string) => setTheme(cmd)"
            >
              <span class="theme-btn">
                <el-icon :size="16"><MagicStick /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="theme in themes"
                    :key="theme.id"
                    :command="theme.id"
                  >
                    <el-icon><component :is="theme.icon as any" /></el-icon>{{ $t('theme.' + theme.id) }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>

      <el-tabs
        v-model="activeTab"
        stretch
      >
        <el-tab-pane
          :label="$t('login.login')"
          name="login"
        >
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            label-position="top"
            @keyup.enter="handleLogin"
          >
            <el-form-item
              :label="$t('login.email')"
              prop="email"
            >
              <el-input v-model="loginForm.email" />
            </el-form-item>
            <el-form-item
              :label="$t('login.password')"
              prop="password"
            >
              <el-input
                v-model="loginForm.password"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                class="full-btn"
                @click="handleLogin"
              >
                {{ loading ? $t('login.loggingIn') : $t('login.login') }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane
          :label="$t('login.register')"
          name="register"
        >
          <el-form
            ref="regFormRef"
            :model="regForm"
            :rules="regRules"
            label-position="top"
            @keyup.enter="handleRegister"
          >
            <el-form-item
              :label="$t('login.username')"
              prop="name"
            >
              <el-input v-model="regForm.name" />
            </el-form-item>
            <el-form-item
              :label="$t('login.email')"
              prop="email"
            >
              <el-input v-model="regForm.email" />
            </el-form-item>
            <el-form-item
              :label="$t('login.password')"
              prop="password"
            >
              <el-input
                v-model="regForm.password"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item
              :label="$t('login.confirmPassword')"
              prop="confirm"
            >
              <el-input
                v-model="regForm.confirm"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                class="full-btn"
                @click="handleRegister"
              >
                {{ loading ? $t('login.registering') : $t('login.register') }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="login-footer">
        <p class="hint">
          {{ $t('login.hint', { file: 'auth.http', credentials: 'user@example.com / secret123' }) }}
        </p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useTheme } from '../composables/useTheme'
import { useLocale, LANG_OPTIONS } from '../composables/useLocale'
import { api } from '../api/typed'
import { useStore } from 'vuex'
import { loginSchema, registerSchema } from './Login.schema'
import type { LoginFormValues, RegisterFormValues } from './Login.schema'

const router = useRouter()
const store = useStore<State>()
const { t } = useI18n()
const { locale, setLang } = useLocale()
const { themes, setTheme } = useTheme()
const loading = ref(false)
const activeTab = ref('login')
const loginFormRef = ref<FormInstance>()
const regFormRef = ref<FormInstance>()

const loginForm = reactive<LoginFormValues>({ email: 'user@example.com', password: 'secret123' })
const loginRules = {
  email: [{ required: true, message: t('login.emailRequired'), trigger: 'blur' }],
  password: [{ required: true, message: t('login.passwordRequired'), trigger: 'blur' }],
}

const regForm = reactive<RegisterFormValues>({ name: 'Alice', email: 'user@example.com', password: 'secret123', confirm: 'secret123' })
const validateConfirm = (_rule: unknown, value: string, callback: (e?: Error) => void) => {
  if (value !== regForm.password) callback(new Error(t('login.passwordMismatch')))
  else callback()
}
const regRules = {
  name: [{ required: true, message: t('login.usernameRequired'), trigger: 'blur' }],
  email: [{ required: true, message: t('login.emailRequired'), trigger: 'blur' }],
  password: [
    { required: true, message: t('login.passwordRequired'), trigger: 'blur' },
    { min: 8, message: t('login.passwordMin'), trigger: 'blur' },
  ],
  confirm: [
    { required: true, message: t('login.confirmRequired'), trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
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
    ElMessage.success(t('login.loginSuccess', { name: authRes.user.name || authRes.user.email }))
    router.push('/dashboard')
  } catch (e: unknown) {
    ElMessage.error((e as Error)?.message || t('login.loginFailed'))
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  const valid = await regFormRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const authRes = await api.auth.register({ name: regForm.name, email: regForm.email, password: regForm.password })
    store.commit('auth/SET_TOKEN', authRes.token)
    store.commit('auth/SET_USER', authRes.user)
    ElMessage.success(t('login.registerSuccess', { name: authRes.user.name }))
    router.push('/dashboard')
  } catch (e: unknown) {
    ElMessage.error((e as Error)?.message || t('login.registerFailed'))
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
  background: var(--app-bg, var(--el-bg-color-page));
}
.login-card { width: 420px; border-radius: 12px; }
.login-header { display: flex; justify-content: space-between; align-items: flex-start; }
.header-actions { display: flex; align-items: center; gap: 8px; }
.login-header h2 { margin: 0; font-size: 24px; }
.subtitle { color: var(--el-text-color-secondary); font-size: 12px; margin-top: 4px; }
.theme-btn, .lang-btn { cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; }
.theme-btn:hover, .lang-btn:hover { background: var(--el-fill-color-light); }
.full-btn { width: 100%; }
.login-footer { margin-top: 16px; text-align: center; }
.hint { font-size: 11px; color: var(--el-text-color-placeholder); }
code { font-size: 11px; background: var(--el-bg-color-page); padding: 1px 4px; border-radius: 2px; }
</style>

<template>
  <div>
    <el-button text @click="$router.push(`/actions/workflows/${workflowId}`)" class="back-btn">{{ $t('action.backToList') }}</el-button>

    <div class="page-head">
      <h2>{{ $t('action.editorTitle') }}</h2>
      <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('action.editorSave') }}</el-button>
    </div>

    <el-card>
      <p class="editor-hint">{{ $t('action.editorHint') }}</p>
    </el-card>

    <div class="editor-layout">
      <div class="editor-main">
        <Codemirror
          v-model="yaml"
          :extensions="extensions"
          :style="{ height: 'calc(100vh - 220px)', minHeight: '400px' }"
        />
      </div>
      <div class="editor-sidebar">
        <el-card>
          <template #header><strong>{{ $t('action.name') }}</strong></template>
          <el-input v-model="name" size="small" @keyup.enter="handleSave" />
        </el-card>
        <el-card style="margin-top:12px">
          <template #header><strong>{{ $t('action.triggerType') }}</strong></template>
          <el-select v-model="triggerType" size="small" style="width:100%">
            <el-option :label="$t('action.triggerManual')" value="manual" />
            <el-option :label="$t('action.triggerCron')" value="cron" />
            <el-option :label="$t('action.triggerHttp')" value="http" />
            <el-option :label="$t('action.triggerPush')" value="push" />
          </el-select>
          <div v-if="triggerType === 'cron'" style="margin-top:8px">
            <el-input v-model="cronExpr" size="small" placeholder="0 */6 * * *" />
          </div>
          <div v-if="triggerType === 'http'" style="margin-top:8px">
            <el-input v-model="httpSecret" size="small" placeholder="HMAC signature secret" />
          </div>
        </el-card>
        <el-card style="margin-top:12px">
          <template #header><strong>Quick Templates</strong></template>
          <el-button size="small" text @click="insertTemplate('basic')">Basic Job</el-button>
          <el-button size="small" text @click="insertTemplate('container')">Container Job</el-button>
          <el-button size="small" text @click="insertTemplate('deploy')">Deploy Pattern</el-button>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Codemirror } from 'vue-codemirror'
import { yaml as yamlLang } from '@codemirror/lang-yaml'
import { linter } from '@codemirror/lint'
import { api } from '../../api'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const workflowId = route.params.id as string
const name = ref('')
const yaml = ref('')
const triggerType = ref('manual')
const cronExpr = ref('')
const httpSecret = ref('')
const saving = ref(false)

// CodeMirror YAML with basic lint
const extensions = [
  yamlLang(),
  linter((view) => {
    const diagnostics: any[] = []
    const text = view.state.doc.toString()
    if (!text.trim()) return diagnostics
    // Check basic YAML structure: indentation consistency
    const lines = text.split('\n')
    let prevIndent = 0
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.trim() === '' || line.trim().startsWith('#')) continue
      const indent = line.match(/^(\s*)/)?.[1].length || 0
      if (indent > 0 && indent % 2 !== 0) {
        diagnostics.push({
          from: view.state.doc.line(i + 1).from,
          to: view.state.doc.line(i + 1).to,
          severity: 'warning',
          message: 'Indentation should use even spaces (2-space recommended)',
        })
      }
      prevIndent = indent
    }
    return diagnostics
  }),
]

function workflowToYaml(w: WorkflowDef): string {
  let y = `name: "${w.name}"\n`
  y += 'on:\n'
  if (w.on?.manual) y += '  manual: true\n'
  if (w.on?.cron) y += `  cron: "${w.on.cron}"\n`
  if (w.on?.http) {
    y += '  http:\n'
    if (w.on.http.signatureSecret) y += `    signatureSecret: "${w.on.http.signatureSecret}"\n`
  }
  if (w.on?.push) y += '  push:\n'
  y += 'jobs:\n'
  for (const [jobName, job] of Object.entries(w.jobs || {})) {
    y += `  ${jobName}:\n`
    if (job.needs?.length) y += `    needs: [${job.needs.join(', ')}]\n`
    if (job.container?.image) {
      y += '    container:\n'
      y += `      image: ${job.container.image}\n`
      if (job.container.resources) {
        y += '      resources:\n'
        if (job.container.resources.cpu) y += `        cpu: ${job.container.resources.cpu}\n`
        if (job.container.resources.memory) y += `        memory: ${job.container.resources.memory}\n`
      }
    }
    if (job.containers?.length) {
      y += '    containers:\n'
      for (const c of job.containers) {
        y += `      - name: ${c.name}\n`
        y += `        image: ${c.image}\n`
      }
    }
    if (job.steps?.length) {
      y += '    steps:\n'
      for (const s of job.steps) {
        if (s.run) y += `      - run: "${s.run}"\n`
        if (s.uses) y += `      - uses: ${s.uses}\n`
      }
    }
    if (job.timeout) y += `    timeout: ${job.timeout}\n`
    if (job.runsOn) y += `    runs-on: ${job.runsOn}\n`
  }
  return y
}

function simpleYamlParse(y: string): Record<string, any> | null {
  try {
    const jobs: Record<string, any> = {}
    const lines = y.split('\n')
    let currentJob = ''
    let inContainer = false
    let inContainers = false
    let inSteps = false
    let containersArr: any[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('name:') || trimmed.startsWith('on:')) continue

      if (/^[a-zA-Z_][\w-]*:/.test(line) && !line.startsWith(' ')) {
        if (containersArr.length && currentJob) {
          jobs[currentJob].containers = containersArr
          containersArr = []
        }
        currentJob = trimmed.replace(/:$/, '')
        jobs[currentJob] = { steps: [] }
        inContainer = false; inContainers = false; inSteps = false
      }
      else if (currentJob) {
        if (trimmed.startsWith('needs:')) {
          // eslint-disable-next-line no-useless-escape
          const n = trimmed.replace('needs:', '').replace(/[\[\]'"]/g, '').trim()
          jobs[currentJob].needs = n ? n.split(/,\s*/) : []
        }
        else if (trimmed.startsWith('container:')) {
          inContainer = true; inContainers = false; inSteps = false
          jobs[currentJob].container = {}
        }
        else if (trimmed.startsWith('containers:')) {
          inContainers = true; inContainer = false; inSteps = false
          containersArr = []
        }
        else if (trimmed.startsWith('steps:')) {
          inSteps = true; inContainer = false; inContainers = false
        }
        else if (trimmed.startsWith('runs-on:')) {
          jobs[currentJob].runsOn = trimmed.replace('runs-on:', '').trim()
        }
        else if (trimmed.startsWith('timeout:')) {
          jobs[currentJob].timeout = parseInt(trimmed.replace('timeout:', '').trim()) || undefined
        }
        else if (inContainer && trimmed.startsWith('image:')) {
          jobs[currentJob].container = { ...jobs[currentJob].container, image: trimmed.replace('image:', '').trim() }
        }
        else if (inContainers && trimmed.startsWith('- name:')) {
          containersArr.push({ name: trimmed.replace('- name:', '').trim() })
        }
        else if (inContainers && trimmed.startsWith('image:') && containersArr.length) {
          containersArr[containersArr.length - 1].image = trimmed.replace('image:', '').trim()
        }
        else if (inSteps && trimmed.startsWith('- run:')) {
          const run = trimmed.replace('- run:', '').replace(/^["']/, '').replace(/["']$/, '').trim()
          jobs[currentJob].steps.push({ run })
        }
        else if (inSteps && trimmed.startsWith('- uses:')) {
          const uses = trimmed.replace('- uses:', '').trim()
          jobs[currentJob].steps.push({ uses })
        }
      }
    }

    if (containersArr.length && currentJob) {
      jobs[currentJob].containers = containersArr
    }

    return Object.keys(jobs).length > 0 ? jobs : null
  } catch {
    return null
  }
}

async function handleSave() {
  if (!name.value.trim()) { ElMessage.warning(t('action.nameRequired')); return }
  saving.value = true
  try {
    const jobs = simpleYamlParse(yaml.value)
    const on: Record<string, any> = {}
    if (triggerType.value === 'manual') on.manual = true
    else if (triggerType.value === 'cron') on.cron = cronExpr.value || '0 0 * * *'
    else if (triggerType.value === 'http') on.http = { signatureSecret: httpSecret.value || undefined }
    else if (triggerType.value === 'push') on.push = {}

    await api.actions.workflows.update(workflowId, {
      name: name.value,
      on,
      jobs: jobs || {},
    })
    if (triggerType.value === 'cron') {
      await api.actions.workflows.schedule(workflowId, { cron: cronExpr.value || '0 0 * * *' })
    } else if (triggerType.value === 'http') {
      await api.actions.workflows.http(workflowId, { signatureSecret: httpSecret.value || undefined })
    }
    ElMessage.success(t('action.editorSaved'))
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error?.message || t('action.saveFailed'))
  }
  finally { saving.value = false }
}

const templates: Record<string, string> = {
  basic: `build:
  runs-on: ubuntu-latest
  steps:
    - run: "echo Hello World"
    - run: "npm test"`,
  container: `build:
  container:
    image: node:20
    resources:
      cpu: 2
      memory: 4096
  steps:
    - run: "npm install"
    - run: "npm test"
    - run: "npm run build"`,
  deploy: `build:
  container:
    image: node:20
  steps:
    - run: "npm install && npm test"

deploy:
  needs: [build]
  instanceId: inst_xxx
  region: cn-hangzhou
  containers:
    - name: main
      image: my-registry/myapp:latest
  steps:
    - run: "./start.sh"`,
}

function insertTemplate(name: string) {
  const tmpl = templates[name]
  if (!yaml.value) {
    yaml.value = tmpl
  } else {
    yaml.value += '\n' + tmpl
  }
}

onMounted(async () => {
  if (!workflowId) return
  try {
    const w = await api.actions.workflows.get(workflowId)
    name.value = w.name
    yaml.value = workflowToYaml(w)
    triggerType.value = w.on?.cron ? 'cron' : w.on?.http ? 'http' : w.on?.push ? 'push' : 'manual'
    cronExpr.value = w.on?.cron || ''
    httpSecret.value = w.on?.http?.signatureSecret || ''
  } catch {
    ElMessage.error(t('action.fetchFailed'))
    router.push('/actions/workflows')
  }
})
</script>

<style scoped>
.back-btn { margin-bottom: 8px; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.editor-hint { font-size: 13px; color: var(--el-text-color-secondary); margin: 0; }
.editor-layout { display: flex; gap: 16px; margin-top: 16px; }
.editor-main { flex: 1; min-width: 0; }
.editor-sidebar { width: 260px; flex-shrink: 0; }
:deep(.cm-editor) { border: 1px solid var(--el-border-color); border-radius: 4px; }
:deep(.cm-editor.cm-focused) { border-color: var(--el-color-primary); outline: none; }
:deep(.cm-editor .cm-scroller) { font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace; font-size: 13px; line-height: 1.6; }
</style>

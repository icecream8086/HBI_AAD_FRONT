<template>
  <div class="efe-page">
    <h2>扩展字段编辑器</h2>

    <!-- ── View 1: Vendor cards ── -->
    <div
      v-if="!activeVendor"
      class="efe-cards"
    >
      <div
        v-for="v in FIELD_LIBRARY"
        :key="v.label"
        class="efe-card"
        @click="enterVendor(v)"
      >
        <div class="efe-card-icon">
          <el-icon :size="24">
            <Cloudy />
          </el-icon>
        </div>
        <div class="efe-card-body">
          <div class="efe-card-name">
            {{ v.label }}
          </div>
          <div class="efe-card-desc">
            {{ v.description }}
          </div>
          <div class="efe-card-count">
            {{ v.fields.length }} 个扩展字段
          </div>
        </div>
        <el-icon class="efe-card-arrow">
          <ArrowRight />
        </el-icon>
      </div>
      <el-empty
        v-if="!FIELD_LIBRARY.length"
        description="暂无可用云厂商"
        :image-size="60"
      />
    </div>

    <!-- ── View 2: Editor + Code split ── -->
    <template v-else>
      <div class="efe-toolbar">
        <el-button
          text
          @click="activeVendor = null"
        >
          <el-icon><ArrowLeft /></el-icon>
          返回厂商列表
        </el-button>
        <div class="efe-toolbar-right">
          <span class="efe-field-count">{{ visibleFields.length }} / {{ activeVendor.fields.length }} fields</span>
          <el-button
            size="small"
            :type="uiLocked ? 'info' : 'primary'"
            @click="uiLocked = !uiLocked"
          >
            <el-icon :size="14">
              <Lock v-if="uiLocked" /><Unlock v-else />
            </el-icon>
            {{ uiLocked ? 'UI 锁定' : 'UI 解锁' }}
          </el-button>
          <el-button
            size="small"
            :type="codeLocked ? 'info' : 'warning'"
            @click="codeLocked = !codeLocked"
          >
            <el-icon :size="14">
              <Lock v-if="codeLocked" /><Unlock v-else />
            </el-icon>
            {{ codeLocked ? 'Code 锁定' : 'Code 解锁' }}
          </el-button>
          <el-button-group size="small">
            <el-button
              :type="layout === 'horizontal' ? 'primary' : ''"
              @click="layout = 'horizontal'"
            >
              <el-icon><Rank /></el-icon>
            </el-button>
            <el-button
              :type="layout === 'vertical' ? 'primary' : ''"
              @click="layout = 'vertical'"
            >
              <el-icon><Switch /></el-icon>
            </el-button>
          </el-button-group>
        </div>
      </div>

      <div :class="['efe-split', layout === 'horizontal' ? 'efe-split-h' : 'efe-split-v']">
        <!-- Form panel -->
        <div
          class="efe-panel efe-panel-form"
          :style="layout === 'horizontal' ? { flex: '1', minWidth: 0 } : {}"
        >
          <el-card shadow="never">
            <template #header>
              {{ activeVendor.label }}
            </template>
            <div class="efe-body">
              <template
                v-for="[grp, fields] in groupedFields"
                :key="grp"
              >
                <div class="efe-grp-header">
                  {{ groupLabel(grp) }}
                </div>
                <div
                  v-for="field in fields"
                  :key="field.key"
                  :class="['efe-field', { 'efe-field-error': hasFieldError(field.key) && !isWarning(field.key), 'efe-field-warning': isWarning(field.key) }]"
                >
                  <div
                    class="efe-field-label"
                    :class="{ 'efe-label-error': hasFieldError(field.key) && !isWarning(field.key), 'efe-label-warning': isWarning(field.key) }"
                  >
                    <span>{{ field.label }}</span>
                    <el-tooltip
                      :content="field.description"
                      placement="top"
                    >
                      <el-icon
                        :size="13"
                        class="efe-help"
                      >
                        <QuestionFilled />
                      </el-icon>
                    </el-tooltip>
                    <span
                      v-if="field.required"
                      class="efe-required"
                    >*</span>
                    <span
                      v-if="field.locked"
                      class="efe-locked"
                    >🔒</span>
                    <span
                      v-if="hasFieldError(field.key)"
                      class="efe-err-msg"
                    >{{ fieldError(field.key) }}</span>
                  </div>
                  <div class="efe-field-input">
                    <el-switch
                      v-if="field.type === 'boolean'"
                      :model-value="values[field.key] ?? field.defaultValue ?? false"
                      :disabled="uiLocked || field.locked"
                      @update:model-value="set(field.key, $event)"
                    />
                    <template v-if="field.validation?.kind === 'enum'">
                      <div
                        v-if="field.key === 'instanceType'"
                        class="efe-inst-tags"
                      >
                        <el-tag
                          v-for="cat in INSTANCE_CATEGORIES"
                          :key="cat.tag"
                          size="small"
                          :type="instanceFilter === cat.tag ? 'primary' : 'info'"
                          :effect="instanceFilter === cat.tag ? 'dark' : 'plain'"
                          style="cursor:pointer"
                          @click="instanceFilter = instanceFilter === cat.tag ? null : cat.tag"
                        >
                          {{ cat.tag }}
                        </el-tag>
                      </div>
                      <el-select
                        :model-value="values[field.key] ?? field.defaultValue ?? ''"
                        :disabled="uiLocked || field.locked"
                        clearable
                        filterable
                        style="width:100%"
                        @update:model-value="set(field.key, $event)"
                      >
                        <el-option
                          v-for="opt in (field.key === 'instanceType' ? filterInstanceTypes(instanceFilter) : field.validation.values)"
                          :key="opt"
                          :label="opt"
                          :value="opt"
                        />
                      </el-select>
                      <el-button
                        v-if="field.key === 'instanceType' && values[field.key]"
                        size="small"
                        circle
                        style="margin-left:4px;flex-shrink:0"
                        @click="openInstanceDetail(values[field.key] as string)"
                      >
                        <el-icon :size="13">
                          <InfoFilled />
                        </el-icon>
                      </el-button>
                    </template>
                    <el-input-number
                      v-else-if="field.type === 'number'"
                      :model-value="values[field.key] ?? field.defaultValue"
                      :disabled="uiLocked || field.locked"
                      :min="field.validation?.min"
                      :max="field.validation?.max"
                      controls-position="right"
                      style="width:100%"
                      @update:model-value="set(field.key, $event)"
                    />
                    <div
                      v-else-if="field.type === 'string[]'"
                      class="efe-tags"
                    >
                      <el-tag
                        v-for="(t, ti) in (values[field.key] as string[] || [])"
                        :key="ti"
                        closable
                        size="small"
                        @close="removeTag(field.key, ti)"
                      >
                        {{ t }}
                      </el-tag>
                      <el-input
                        v-if="tagInputs[field.key] !== undefined"
                        v-model="tagInputs[field.key]"
                        size="small"
                        style="width:80px"
                        @blur="addTag(field.key)"
                        @keyup.enter="addTag(field.key)"
                      />
                      <el-button
                        v-else
                        size="small"
                        @click="startTag(field.key)"
                      >
                        + Tag
                      </el-button>
                    </div>
                    <template v-else-if="field.type === 'object'">
                      <el-input
                        :model-value="objPreview(field.key)"
                        size="small"
                        readonly
                        :placeholder="`{ ... }`"
                        style="cursor:pointer"
                        @click="editJson(field)"
                      />
                      <el-button
                        size="small"
                        style="margin-left:4px"
                        @click="editJson(field)"
                      >
                        Edit
                      </el-button>
                    </template>
                    <el-input
                      v-else
                      :model-value="values[field.key] ?? field.defaultValue ?? ''"
                      :disabled="uiLocked || field.locked"
                      clearable
                      @update:model-value="set(field.key, $event)"
                    />
                  </div>
                </div>
              </template>
            </div>
          </el-card>
        </div>

        <!-- Draggable divider (horizontal only) -->
        <div
          v-if="layout === 'horizontal'"
          :class="['efe-divider', { 'efe-divider-dragging': dragging }]"
          @mousedown="onDragStart"
        />

        <!-- Code panel -->
        <div
          class="efe-panel efe-panel-code"
          :style="layout === 'horizontal' ? { width: codePanelWidth + 'px', flexShrink: 0 } : {}"
        >
          <div class="efe-code-header">
            <span>providerOverrides.alibaba</span>
            <div>
              <el-tag
                v-if="codeLocked"
                type="info"
                size="small"
                effect="plain"
                style="margin-right:6px"
              >
                🔒 只读
              </el-tag>
              <el-tag
                v-else
                type="warning"
                size="small"
                effect="plain"
                style="margin-right:6px"
              >
                ✎ 可编辑
              </el-tag>
              <el-button
                size="small"
                text
                @click="copyCode"
              >
                Copy
              </el-button>
            </div>
          </div>
          <Codemirror
            v-model="codeText"
            :extensions="cmExtensions"
            :style="{ height: '100%' }"
            :disabled="codeLocked"
          />
        </div>
      </div>

      <div class="efe-footer">
        <el-button @click="resetAll">
          Reset
        </el-button>
        <el-button
          type="primary"
          @click="handleSave"
        >
          Save
        </el-button>
      </div>

      <!-- Instance detail dialog -->
      <el-dialog
        v-model="instDlg.show"
        :title="instDlg.title"
        width="480px"
        append-to-body
      >
        <div
          v-if="instDlg.spec"
          class="inst-card"
        >
          <div class="inst-row">
            <div class="inst-item">
              <span class="inst-label">CPU</span>
              <span class="inst-val">{{ instDlg.spec.cpu }} vCPU</span>
            </div>
            <div class="inst-item">
              <span class="inst-label">Memory</span>
              <span class="inst-val">{{ instDlg.spec.mem }} GiB</span>
            </div>
          </div>
          <div class="inst-row">
            <div class="inst-item">
              <span class="inst-label">GPU</span>
              <span class="inst-val">{{ instDlg.spec.gpu }}<template v-if="instDlg.spec.gpuCount>1"> ×{{ instDlg.spec.gpuCount }}</template></span>
            </div>
            <div class="inst-item">
              <span class="inst-label">显存</span>
              <span class="inst-val">{{ instDlg.spec.gpuMem }}<template v-if="instDlg.spec.gpuCount>1"> / 卡</template></span>
            </div>
          </div>
          <div class="inst-row">
            <div class="inst-item">
              <span class="inst-label">GPU 模式</span>
              <span class="inst-val">
                <el-tag
                  v-if="instDlg.spec.gpuMode==='dedicated'"
                  type="success"
                  size="small"
                  effect="plain"
                >独享整卡</el-tag>
                <el-tag
                  v-else-if="instDlg.spec.gpuMode==='vGPU'"
                  type="warning"
                  size="small"
                  effect="plain"
                >vGPU 分片 {{ instDlg.spec.gpuFraction }}</el-tag>
                <el-tag
                  v-else
                  type="info"
                  size="small"
                  effect="plain"
                >共享CPU · {{ instDlg.spec.gpuFraction }}</el-tag>
              </span>
            </div>
            <div class="inst-item">
              <span class="inst-label">架构</span>
              <span class="inst-val">{{ instDlg.spec.architecture }}</span>
            </div>
          </div>
          <div class="inst-row">
            <div class="inst-item">
              <span class="inst-label">带宽</span>
              <span class="inst-val">{{ instDlg.spec.bandwidth }} Gbps</span>
            </div>
            <div class="inst-item">
              <span class="inst-label">PPS</span>
              <span class="inst-val">{{ instDlg.spec.pps }}</span>
            </div>
          </div>
          <div class="inst-features">
            <el-tag
              v-if="instDlg.spec.nvlink"
              type="success"
              size="small"
              effect="dark"
              style="margin-right:6px"
            >
              NVLink {{ instDlg.spec.nvlinkMax }}路
            </el-tag>
            <el-tag
              v-if="instDlg.spec.mig"
              type="primary"
              size="small"
              effect="dark"
              style="margin-right:6px"
            >
              MIG 多实例
            </el-tag>
            <el-tag
              v-if="!instDlg.spec.nvlink && !instDlg.spec.mig"
              size="small"
              effect="plain"
            >
              无 GPU 互联
            </el-tag>
          </div>
        </div>
        <div
          v-else
          style="color:var(--el-text-color-secondary)"
        >
          暂无详细规格信息
        </div>
      </el-dialog>

      <!-- JSON editor dialog -->
      <el-dialog
        v-model="jsonDlg.show"
        :title="jsonDlg.field?.label"
        width="500px"
        append-to-body
      >
        <el-input
          v-model="jsonDlg.text"
          type="textarea"
          :rows="8"
          placeholder="{ &quot;username&quot;: &quot;...&quot;, &quot;password&quot;: &quot;...&quot; }"
        />
        <template #footer>
          <el-button @click="jsonDlg.show = false">
            Cancel
          </el-button>
          <el-button
            type="primary"
            @click="saveJson"
          >
            OK
          </el-button>
        </template>
      </el-dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Codemirror } from 'vue-codemirror'
import { json as jsonLang } from '@codemirror/lang-json'
import {
  FIELD_LIBRARY,
  resolveFields,
  groupResolved,
  validateFields,
  buildProviderOverrides,
  parseInput,
  INSTANCE_CATEGORIES,
  filterInstanceTypes,
  INSTANCE_SPEC,
  type InstanceSpec,
} from '../constants/field-ast'
import type { FieldNode, ResolvedField, VendorGroup } from '../constants/field-ast'

const emit = defineEmits<{
  apply: [values: Record<string, unknown>]
}>()

// ── Layout ──
const layout = ref<'horizontal' | 'vertical'>('horizontal')
const codePanelWidth = ref(420)
const dragging = ref(false)

function onDragStart(e: MouseEvent) {
  e.preventDefault()
  dragging.value = true
  const startX = e.clientX
  const startWidth = codePanelWidth.value
  const onMove = (ev: MouseEvent) => {
    const delta = startX - ev.clientX
    codePanelWidth.value = Math.max(240, Math.min(800, startWidth + delta))
  }
  const onUp = () => {
    dragging.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

// ── CodeMirror ──
const cmExtensions = [jsonLang()]

// ── Independent locks ──
const uiLocked = ref(true)   // 表单只读（防误操作）
const codeLocked = ref(true) // 代码编辑器只读

// ── View state ──
const activeVendor = ref<VendorGroup | null>(null)
function enterVendor(v: VendorGroup) {
  activeVendor.value = v
  values.value = {}
  uiLocked.value = true
  codeLocked.value = true
}

function handleSave() {
  if (!activeVendor.value) return
  const out = buildProviderOverrides(activeVendor.value.fields, values.value)
  emit('apply', (out.providerOverrides as Record<string, unknown>)['alibaba'] || {})
  ElMessage.success('已保存')
}

// ── AST resolution ──
const resolvedFields = computed<ResolvedField[]>(() => {
  if (!activeVendor.value) return []
  return resolveFields(activeVendor.value.fields, values.value)
})

const groupedFields = computed(() => groupResolved(resolvedFields.value))

const visibleFields = computed(() => resolvedFields.value.filter(f => f.visible))

const GROUP_LABELS: Record<string, string> = {
  gpu: 'GPU & 实例规格',
  spot: '竞价实例',
  network: '网络',
  storage: '存储 & 镜像',
  schedule: '调度',
  system: '系统',
}
function groupLabel(grp: string) { return GROUP_LABELS[grp] || grp }

// ── Validation ──
const fieldErrors = computed<{ errors: Record<string, string[]>; warnings: Record<string, string[]> }>(() => {
  const errors: Record<string, string[]> = {}
  const warnings: Record<string, string[]> = {}
  if (!activeVendor.value) return { errors, warnings }
  const ve = validateFields(activeVendor.value.fields, values.value)
  for (const e of ve) {
    const target = e.severity === 'warning' ? warnings : errors
    if (!target[e.key]) target[e.key] = []
    target[e.key].push(e.message)
  }
  return { errors, warnings }
})

function fieldError(key: string): string {
  const e = fieldErrors.value.errors[key]?.join('; ')
  const w = fieldErrors.value.warnings[key]?.join('; ')
  return [e, w].filter(Boolean).join(' | ') || ''
}
function hasFieldError(key: string): boolean {
  return !!(fieldErrors.value.errors[key]?.length || fieldErrors.value.warnings[key]?.length)
}
function isWarning(key: string): boolean {
  return !!fieldErrors.value.warnings[key]?.length && !fieldErrors.value.errors[key]?.length
}

// ── Values & code ──
const values = ref<Record<string, unknown>>({})
const tagInputs = ref<Record<string, string>>({})
const codeText = ref('')
const instanceFilter = ref<string | null>(null)
let syncing = false

const codeOutput = computed(() => {
  if (!activeVendor.value) return '{}'
  return JSON.stringify(buildProviderOverrides(activeVendor.value.fields, values.value), null, 2)
})

// values → code (双向：form 编辑总是反映到 code)
watch(codeOutput, (val) => {
  if (syncing) return
  syncing = true
  codeText.value = val
  syncing = false
})

// code → values: code 解锁时，用户编辑/粘贴 code 后回填表单
watch(codeText, (raw) => {
  if (syncing) return
  if (codeLocked.value) return
  if (!activeVendor.value) return
  try {
    const parsed = parseInput(raw, activeVendor.value.fields)
    if (Object.keys(parsed).length) {
      syncing = true
      values.value = { ...values.value, ...parsed }
      syncing = false
    }
  } catch { /* user is still typing */ }
})

function set(key: string, val: unknown) {
  values.value = { ...values.value, [key]: val }
}
function startTag(key: string) {
  tagInputs.value = { ...tagInputs.value, [key]: '' }
}
function addTag(key: string) {
  const raw = (tagInputs.value[key] || '').trim()
  if (!raw) { delete tagInputs.value[key]; return }
  const arr = (values.value[key] as string[]) || []
  set(key, [...arr, raw])
  delete tagInputs.value[key]
}
function removeTag(key: string, idx: number) {
  const arr = (values.value[key] as string[]) || []
  set(key, arr.filter((_, i) => i !== idx))
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(codeOutput.value)
    ElMessage.success('Copied')
  } catch { ElMessage.error('Copy failed') }
}

function resetAll() {
  values.value = {}
  codeText.value = ''
}

// ── Instance detail dialog ──
const instDlg = reactive<{ show: boolean; title: string; spec: InstanceSpec | null }>({ show: false, title: '', spec: null })
function openInstanceDetail(val: string) {
  instDlg.title = val
  instDlg.spec = INSTANCE_SPEC[val] || null
  instDlg.show = true
}

// ── JSON object editor ──
const jsonDlg = reactive({ show: false, field: null as FieldNode | null, text: '' })
function objPreview(key: string): string {
  const v = values.value[key]
  return v ? JSON.stringify(v) : ''
}
function editJson(field: FieldNode) {
  jsonDlg.field = field
  jsonDlg.text = values.value[field.key] ? JSON.stringify(values.value[field.key], null, 2) : ''
  jsonDlg.show = true
}
function saveJson() {
  if (!jsonDlg.field) return
  try {
    const parsed = jsonDlg.text.trim() ? JSON.parse(jsonDlg.text) : undefined
    set(jsonDlg.field.key, parsed)
    jsonDlg.show = false
  } catch {
    ElMessage.error('Invalid JSON')
  }
}
</script>

<style scoped>
.efe-page { max-width: 100%; margin: 0 auto; padding: 16px; }

/* ── Vendor cards ── */
.efe-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  margin-top: 16px;
}
.efe-card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.efe-card:hover {
  border-color: var(--el-color-primary-light-3);
  box-shadow: 0 2px 12px var(--el-color-primary-light-6);
}
.efe-card-icon {
  width: 44px; height: 44px;
  border-radius: 10px;
  background: var(--el-color-primary-light-9);
  display: flex; align-items: center; justify-content: center;
  color: var(--el-color-primary); flex-shrink: 0;
}
.efe-card-body { flex: 1; min-width: 0; }
.efe-card-name { font-size: 14px; font-weight: 600; }
.efe-card-desc {
  font-size: 12px; color: var(--el-text-color-secondary);
  margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.efe-card-count { font-size: 11px; color: var(--el-text-color-placeholder); margin-top: 2px; }
.efe-card-arrow { color: var(--el-text-color-placeholder); flex-shrink: 0; }

/* ── Toolbar ── */
.efe-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
.efe-toolbar-right { display: flex; align-items: center; gap: 12px; }
.efe-field-count { font-size: 12px; color: var(--el-text-color-secondary); }

/* ── Split layout ── */
.efe-split {
  display: flex;
  height: calc(100vh - 180px);
  min-height: 500px;
  gap: 12px;
}
.efe-split-h { flex-direction: row; }
.efe-split-v { flex-direction: column; }

.efe-panel { overflow: auto; }
.efe-split-h .efe-panel-form { flex: 1; min-width: 0; }
.efe-split-v .efe-panel-form { flex: 1; min-height: 0; }
.efe-split-v .efe-panel-code { height: 280px; flex-shrink: 0; }

/* Draggable divider */
.efe-divider {
  width: 4px;
  cursor: col-resize;
  background: #409eff;
  border-radius: 2px;
  flex-shrink: 0;
  transition: background 0.15s;
  margin: 0 6px;
}
.efe-divider:hover { background: #79bbff; }
.efe-divider-dragging { background: #e6a23c !important; }

.efe-panel-form :deep(.el-card__body) { padding: 12px 16px; }
.efe-panel-code {
  display: flex; flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-bg-color);
}
.efe-code-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 12px;
  font-size: 12px; font-family: monospace;
  color: var(--el-text-color-secondary);
  border-bottom: 3px double var(--el-color-warning);
}
.efe-panel-code :deep(.cm-editor) { font-size: 12px; background: var(--el-bg-color-page); color: var(--el-text-color-primary); }
.efe-panel-code :deep(.cm-editor .cm-scroller) { overflow: auto; font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace; }
.efe-panel-code :deep(.cm-editor.cm-focused) { outline: none; }
/* Gutters */
.efe-panel-code :deep(.cm-gutters) {
  background: var(--el-bg-color);
  color: var(--el-text-color-placeholder);
  border-right: 1px solid var(--el-border-color-lighter);
}
.efe-panel-code :deep(.cm-lineNumbers .cm-gutterElement) { color: var(--el-text-color-placeholder); }
.efe-panel-code :deep(.cm-foldGutter .cm-gutterElement) { color: var(--el-text-color-secondary); }
.efe-panel-code :deep(.cm-activeLineGutter) { background: var(--el-fill-color-light); color: var(--el-text-color-primary); }
/* Code lines */
.efe-panel-code :deep(.cm-line) { color: var(--el-text-color-primary); }
.efe-panel-code :deep(.cm-activeLine) { background: var(--el-fill-color-light); }
/* Selection */
.efe-panel-code :deep(.cm-selectionBackground), .efe-panel-code :deep(.cm-editor ::selection) { background: var(--el-color-primary-light-5) !important; }
/* Cursor */
.efe-panel-code :deep(.cm-cursor) { border-left-color: var(--el-color-primary); }
/* JSON syntax tokens */
.efe-panel-code :deep(.ͼ2 .cm-meta) { color: var(--el-text-color-secondary); }          /* { } [ ] , : */
.efe-panel-code :deep(.ͼ2 .cm-string) { color: var(--el-color-success); }               /* "string" */
.efe-panel-code :deep(.ͼ2 .cm-number) { color: var(--el-color-warning); }               /* 123 */
.efe-panel-code :deep(.ͼ2 .cm-keyword) { color: var(--el-color-danger); }               /* true false null */
.efe-panel-code :deep(.ͼ2 .cm-propertyName) { color: var(--el-color-primary); }         /* "key": */

/* ── Field form ── */
.efe-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 24px;
}
.efe-grp-header {
  grid-column: 1 / -1;
  font-size: 12px; font-weight: 600;
  color: var(--el-color-primary);
  text-transform: uppercase;
  padding: 14px 0 6px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 2px;
}
.efe-grp-header:first-child { padding-top: 0; }

.efe-field { display: flex; flex-direction: column; gap: 2px; padding: 4px 0; }
.efe-field-label {
  font-size: 12px; color: var(--el-text-color-regular);
  display: flex; align-items: center; gap: 4px;
}
.efe-help { color: var(--el-text-color-placeholder); cursor: help; }
.efe-required { color: var(--el-color-danger); font-weight: bold; }
.efe-locked { font-size: 11px; }
/* Validation errors */
.efe-field-error { border-left: 3px solid var(--el-color-danger); padding-left: 8px; border-radius: 3px; }
.efe-label-error { color: var(--el-color-danger); }
/* Validation warnings */
.efe-field-warning { border-left: 3px solid var(--el-color-warning); padding-left: 8px; border-radius: 3px; }
.efe-label-warning { color: var(--el-color-warning); }
.efe-err-msg {
  font-size: 11px; color: var(--el-color-danger);
  margin-left: 4px; font-weight: 400;
}
.efe-field-input { min-height: 28px; display: flex; align-items: center; }

.efe-tags { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }

.efe-inst-tags { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 4px; }

.efe-footer { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }

/* ── Instance detail card ── */
.inst-card {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 16px;
}
.inst-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 10px;
}
.inst-row:last-of-type { margin-bottom: 8px; }
.inst-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.inst-label {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.inst-val {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.inst-features {
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>

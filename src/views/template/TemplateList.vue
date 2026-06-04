<template>
  <div>
    <div class="page-head">
      <h2>{{ $t('template.title') }}</h2>
      <el-button type="primary" @click="openCreate">{{ $t('template.create') }}</el-button>
    </div>

    <el-table :data="templates || []" v-loading="loading" stripe :empty-text="$t('table.empty')">
      <el-table-column prop="name" :label="$t('template.name')" min-width="150" />
      <el-table-column :label="$t('template.containerLabel')" width="70">
        <template #default="{ row }">{{ row.container?.containers?.length || 0 }}</template>
      </el-table-column>
      <el-table-column label="Region" width="100">
        <template #default="{ row }">{{ row.container?.region || '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.restartPolicy')" width="100">
        <template #default="{ row }">{{ row.container?.restartPolicy || '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.limit')" width="80">
        <template #default="{ row }">
          <template v-if="row.instanceLimit">
            <el-tag size="small">{{ fmtLimitType(row.instanceLimit.type) }}</el-tag> :{{ row.instanceLimit.max }}
          </template>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.dagDep')" width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ row.dependsOn?.map(id => templateName(id)).join(', ') || '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.createdAt')" width="170">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.actions')" width="260" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/templates/${row.id}`)">{{ $t('table.detail') }}</el-button>
          <el-button size="small" @click="handleApply(row)">{{ $t('template.apply') }}</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">{{ $t('template.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dlg.show" :title="$t('template.createTitle')" width="860px" :close-on-click-modal="false">
      <el-form :model="f" label-width="100px" v-loading="dlg.saving">
        <el-form-item :label="$t('template.name')"><el-input v-model="f.name" :placeholder="$t('template.name')" /></el-form-item>
        <el-form-item :label="$t('template.description')"><el-input v-model="f.description" type="textarea" :rows="2" :placeholder="$t('template.description')" /></el-form-item>

        <el-divider>{{ $t('template.deployTarget') }}</el-divider>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item :label="$t('template.platform')">
            <el-select v-model="f.account" filterable allow-create default-first-option :placeholder="$t('template.platform')" style="width:100%">
              <el-option v-for="p in providers" :key="p" :label="p" :value="p" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="8"><el-form-item label="Region"><el-input v-model="f.region" placeholder="local" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('template.restartPolicy')">
            <el-select v-model="f.restartPolicy" clearable placeholder="Default">
              <el-option label="Always" value="Always" /><el-option label="OnFailure" value="OnFailure" /><el-option label="Never" value="Never" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item :label="$t('topology.instanceTitle')">
            <el-select v-model="f.instanceId" filterable clearable placeholder="Optional" style="width:100%">
              <el-option v-for="inst in instances" :key="inst.id" :label="`${inst.name} (${inst.platform}/${inst.region})`" :value="inst.id" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('topology.zone')"><el-input v-model="f.zone" placeholder="e.g. cn-hangzhou-a" /></el-form-item></el-col>
        </el-row>

        <el-divider>{{ $t('template.dagInherit') }}</el-divider>
        <el-form-item :label="$t('template.dependsOn')">
          <el-select v-model="f.dependsOn" multiple filterable :placeholder="$t('template.dependsPlaceholder')" style="width:100%" @change="onDependsChange">
            <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>

        <div v-if="inherited.length" class="inherited-box">
          <p class="inherited-title">{{ $t('table.inheritedReadonly') }}</p>
          <el-tag v-for="(c, i) in inherited" :key="i" class="inherited-tag" type="info">{{ c.name || '?' }}:{{ c.image }}</el-tag>
        </div>

        <el-divider>{{ $t('template.containers') }}</el-divider>
        <div v-for="(c, ci) in f.containers" :key="ci" class="cont-card">
          <el-form-item :label="`${$t('template.containerLabel')} ${ci+1}`">
            <el-input v-model="c.name" :placeholder="$t('template.name')" style="width:160px;margin-right:6px" size="small" />
            <el-input v-model="c.image" :placeholder="$t('table.image')" style="width:320px;margin-right:6px" size="small" />
            <el-button type="danger" size="small" @click="f.containers.splice(ci,1)" circle>−</el-button>
          </el-form-item>
          <el-form-item :label="$t('table.command')">
            <el-input v-model="c.command" placeholder='["sleep","3600"]' style="width:500px" size="small" />
          </el-form-item>
          <el-form-item :label="$t('template.port')">
            <div v-for="(p, pi) in c.ports" :key="pi" style="display:flex;gap:4px;margin-bottom:4px">
              <el-input v-model="p.containerPort" placeholder="Container Port" style="width:110px" size="small" type="number" />
              <el-select v-model="p.protocol" :placeholder="$t('table.protocol')" style="width:90px" size="small">
                <el-option label="TCP" value="TCP" /><el-option label="UDP" value="UDP" />
              </el-select>
              <el-button type="danger" size="small" @click="c.ports.splice(pi,1)" circle>−</el-button>
            </div>
            <el-button size="small" @click="c.ports.push({containerPort:80,protocol:'TCP'})">{{ $t('template.addPort') }}</el-button>
          </el-form-item>
          <el-form-item :label="$t('template.resources')">
            <span style="margin-right:6px">CPU</span>
            <el-input-number v-model="c.cpu" :min="0" :step="0.25" :precision="2" size="small" style="width:100px;margin-right:12px" />
            <span style="margin-right:6px">{{ $t('template.memory') }}</span>
            <el-input-number v-model="c.memory" :min="0" :step="64" size="small" style="width:100px" />
          </el-form-item>
          <el-form-item :label="$t('template.env')">
            <div v-for="(e, ei) in c.env" :key="ei" style="display:flex;gap:4px;margin-bottom:4px">
              <el-input v-model="e.key" placeholder="KEY" style="width:150px" size="small" />
              <el-input v-model="e.value" placeholder="value" style="width:250px" size="small" />
              <el-button type="danger" size="small" @click="c.env.splice(ei,1)" circle>−</el-button>
            </div>
            <el-button size="small" @click="c.env.push({key:'',value:''})">{{ $t('template.addEnvVar') }}</el-button>
          </el-form-item>
        </div>
        <el-form-item><el-button size="small" @click="addContainer">{{ $t('template.addContainer') }}</el-button></el-form-item>
        <el-divider>{{ $t('template.extraParams') }}</el-divider>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item :label="$t('template.publicIp')"><el-switch v-model="f.allocatePublicIp" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('template.healthRetry')">
            <el-input-number v-model="f.healthMaxRetries" :min="-1" :step="1" style="width:100%" />
          </el-form-item></el-col>
        </el-row>
        <el-form-item :label="$t('template.vendorPassthrough')">
          <el-input v-model="f.providerOverridesStr" type="textarea" :rows="2" placeholder='{"eipBandwidth":100}' />
        </el-form-item>

        <el-divider>{{ $t('template.healthChecks') }}</el-divider>
        <div v-for="(hc, hi) in f.healthChecks" :key="hi" class="cont-card">
          <el-row :gutter="8">
            <el-col :span="6"><el-form-item :label="$t('template.name')" label-width="50px"><el-input v-model="hc.name" size="small" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item :label="$t('table.target')" label-width="50px">
              <el-select v-model="hc.target" filterable allow-create size="small" style="width:100%">
                <el-option v-for="ct in f.containers" :key="ct.name" :label="'container:'+ct.name" :value="'container:'+ct.name" />
              </el-select>
            </el-form-item></el-col>
            <el-col :span="5"><el-form-item label="Type" label-width="50px">
              <el-select v-model="hc.type" size="small">
                <el-option label="liveness" value="liveness" /><el-option label="readiness" value="readiness" /><el-option label="startup" value="startup" />
              </el-select>
            </el-form-item></el-col>
            <el-col :span="5"><el-form-item :label="$t('table.probe')" label-width="50px">
              <el-select v-model="hc.probeType" size="small">
                <el-option label="exec" value="exec" /><el-option label="httpGet" value="httpGet" /><el-option label="tcpSocket" value="tcpSocket" />
              </el-select>
            </el-form-item></el-col>
            <el-col :span="2"><el-button type="danger" size="small" @click="f.healthChecks.splice(hi,1)" circle>−</el-button></el-col>
          </el-row>
          <el-row :gutter="8">
            <el-col :span="12" v-if="hc.probeType==='exec'">
              <el-form-item :label="$t('table.command')" label-width="50px">
                <el-input v-model="hc.execCommand" placeholder='["/bin/sh","-c","..."]' size="small" />
              </el-form-item>
            </el-col>
            <el-col :span="6" v-if="hc.probeType==='httpGet'">
              <el-form-item label="Path" label-width="50px"><el-input v-model="hc.httpPath" placeholder="/health" size="small" /></el-form-item>
            </el-col>
            <el-col :span="6" v-if="hc.probeType==='httpGet'">
              <el-form-item label="Port" label-width="50px"><el-input-number v-model="hc.httpPort" :min="1" :max="65535" size="small" style="width:100%" /></el-form-item>
            </el-col>
            <el-col :span="6" v-if="hc.probeType==='tcpSocket'">
              <el-form-item label="Port" label-width="50px"><el-input-number v-model="hc.tcpPort" :min="1" :max="65535" size="small" style="width:100%" /></el-form-item>
            </el-col>
            <el-col :span="4"><el-form-item :label="$t('table.delay')" label-width="50px"><el-input-number v-model="hc.initialDelaySeconds" :min="0" size="small" style="width:100%" /></el-form-item></el-col>
            <el-col :span="4"><el-form-item :label="$t('table.interval')" label-width="50px"><el-input-number v-model="hc.periodSeconds" :min="0" size="small" style="width:100%" /></el-form-item></el-col>
            <el-col :span="4"><el-form-item :label="$t('table.timeout')" label-width="50px"><el-input-number v-model="hc.timeoutSeconds" :min="0" size="small" style="width:100%" /></el-form-item></el-col>
          </el-row>
        </div>
        <el-button size="small" style="margin-top:8px" @click="f.healthChecks.push(emptyHc())">{{ $t('template.addHealthCheck') }}</el-button>
      </el-form>
      <template #footer>
        <el-button @click="dlg.show = false">{{ $t('template.cancel') }}</el-button>
        <el-button type="primary" :loading="dlg.saving" @click="handleSave">{{ $t('template.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useResolver } from '../../composables/useResolver'
import { api } from '../../api'

const { t } = useI18n()

const loading = ref(false)
const templates = ref<SandboxTemplate[]>([])
const instances = ref<ComputeInstance[]>([])
const providers = ref<string[]>([])
const { load: loadRefs, templateName } = useResolver()
const inherited = ref<{ name: string; image: string }[]>([])

const dlg = reactive({ show: false, saving: false })
const f = reactive({
  name: '', description: '', account: '', region: '', restartPolicy: '', allocatePublicIp: false,
  instanceId: '', zone: '',
  dependsOn: [] as string[],
  healthMaxRetries: 0, providerOverridesStr: '',
  containers: [] as ContainerForm[],
  healthChecks: [] as HealthCheckForm[],
})

interface EnvPair { key: string; value: string }
interface PortForm { containerPort: number; protocol: string }
interface ContainerForm {
  name: string; image: string; command: string
  ports: PortForm[]
  cpu: number; memory: number
  env: EnvPair[]
}
interface HealthCheckForm {
  name: string; target: string; type: 'liveness' | 'readiness' | 'startup'
  probeType: 'exec' | 'httpGet' | 'tcpSocket'
  execCommand: string; httpPath: string; httpPort: number; tcpPort: number
  initialDelaySeconds: number; periodSeconds: number; timeoutSeconds: number
}

function emptyContainer(): ContainerForm {
  return { name: '', image: '', command: '', ports: [], cpu: 0, memory: 0, env: [] }
}
function emptyHc(): HealthCheckForm {
  return { name: '', target: '', type: 'readiness', probeType: 'tcpSocket', execCommand: '', httpPath: '', httpPort: 80, tcpPort: 80, initialDelaySeconds: 0, periodSeconds: 10, timeoutSeconds: 5 }
}
function buildHcSpec(hc: HealthCheckForm): Record<string, any> {
  const probe: Record<string, any> = {}
  if (hc.probeType === 'exec' && hc.execCommand) { try { probe.exec = { command: JSON.parse(hc.execCommand) } } catch { probe.exec = { command: [hc.execCommand] } } }
  if (hc.probeType === 'httpGet') { probe.httpGet = { path: hc.httpPath || '/', port: hc.httpPort || 80 } }
  if (hc.probeType === 'tcpSocket') { probe.tcpSocket = { port: hc.tcpPort || 80 } }
  return { name: hc.name, target: hc.target, type: hc.type, probe, initialDelaySeconds: hc.initialDelaySeconds, periodSeconds: hc.periodSeconds, timeoutSeconds: hc.timeoutSeconds }
}
function addContainer() { f.containers.push(emptyContainer()) }

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }
function fmtLimitType(type: string): string {
  const key = `template.limit${type.charAt(0).toUpperCase()}${type.slice(1)}`
  return t(key)
}

function specFromForm() {
  const container: Record<string, any> = {}
  if (f.region) container.region = f.region
  if (f.zone) container.zone = f.zone
  if (f.instanceId) container.instanceId = f.instanceId
  if (f.account) container.account = f.account
  if (f.restartPolicy) container.restartPolicy = f.restartPolicy

  const imgs = f.containers.filter(c => c.image)
  if (imgs.length) {
    container.containers = imgs.map(c => {
      const ct: Record<string, any> = { name: c.name, image: c.image }
      if (c.command) { try { ct.command = JSON.parse(c.command) } catch { ct.command = [c.command] } }
      if (c.ports.length) ct.ports = c.ports.filter(p => p.containerPort).map(p => ({ containerPort: p.containerPort, ...(p.protocol ? { protocol: p.protocol } : {}) }))
      if (c.cpu || c.memory) ct.resources = { limits: {} }
      if (c.cpu) ct.resources.limits.cpu = c.cpu
      if (c.memory) ct.resources.limits.memory = c.memory
      if (c.env.length) ct.env = c.env.filter(e => e.key).map(e => ({ name: e.key, value: e.value }))
      return ct
    })
  }

  const extensions: Record<string, any> = {}
  if (f.healthMaxRetries) extensions.healthMaxRetries = f.healthMaxRetries
  if (f.providerOverridesStr) { try { extensions.providerOverrides = JSON.parse(f.providerOverridesStr) } catch { /* ignore */ } }

  const body: Record<string, any> = {}
  if (container.containers?.length) body.container = container
  if (f.allocatePublicIp) body.network = { publicIp: { allocate: true } }
  if (Object.keys(extensions).length) body.extensions = extensions
  const hcs = f.healthChecks.filter(hc => hc.name && hc.target).map(buildHcSpec)
  if (hcs.length) body.healthChecks = hcs
  return Object.keys(body).length ? body : undefined
}

async function onDependsChange(ids: string[]) {
  inherited.value = []
  if (!ids.length) return
  const parentId = ids[ids.length - 1]
  try {
    const resolved = await api.extract<SandboxTemplate>(api.templates.apiTemplatesIdResolvedGet(parentId))
    if (resolved?.container?.containers?.length) inherited.value = resolved.container.containers.map(c => ({ name: c.name || '', image: c.image || '' }))
  } catch { /* no resolved */ }
}

function openCreate() {
  f.name = ''; f.description = ''; f.account = ''; f.region = ''; f.restartPolicy = ''; f.allocatePublicIp = false
  f.zone = ''
  f.dependsOn = []; f.containers = []; f.healthChecks = []
  f.healthMaxRetries = 0; f.providerOverridesStr = ''
  inherited.value = []; dlg.show = true
}

async function fetchData() {
  loading.value = true
  try { templates.value = await api.extractArray<SandboxTemplate>(api.templates.apiTemplatesGet()) }
  catch { ElMessage.error(t('template.fetchFailed')) }
  finally { loading.value = false }
}

async function handleSave() {
  if (!f.name) { ElMessage.warning(t('template.nameRequired')); return }
  dlg.saving = true
  try {
    const body: Record<string, any> = { name: f.name, ...(specFromForm() || {}) }
    if (f.description) body.description = f.description
    if (f.dependsOn.length) body.dependsOn = f.dependsOn

    await api.templates.apiTemplatesPost(body as any)
    ElMessage.success(t('template.createSuccess'))
    dlg.show = false; await fetchData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.error?.message || t('common.actionFailed')) }
  finally { dlg.saving = false }
}

async function handleApply(row: SandboxTemplate) {
  try {
    await api.templates.apiTemplatesIdApplyPost(row.id, { name: row.name } as any)
    ElMessage.success(t('template.applySandboxSuccess'))
  } catch { ElMessage.error(t('template.applyFailed')) }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('template.deleteConfirm'), t('table.confirm'), { type: 'warning' })
    await api.templates.apiTemplatesIdDelete(id)
    ElMessage.success(t('template.deleteSuccess')); await fetchData()
  } catch { /* ignore */ }
}

onMounted(async () => {
  await loadRefs(); await fetchData()
  try {
    const insts = await api.topology.instances.list()
    instances.value = insts
    providers.value = [...new Set(insts.map(i => i.platform))]
  } catch { /* ignore */ }
})
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.cont-card { border: 1px solid var(--el-border-color); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
.inherited-box { margin: -8px 0 8px 100px; padding: 8px 12px; background: var(--el-bg-color-page); border-radius: 4px; }
.inherited-title { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 6px; }
.inherited-tag { margin-right: 4px; margin-bottom: 4px; }
.hint { font-size: 12px; color: var(--el-color-warning); margin: -12px 0 8px 100px; }
</style>

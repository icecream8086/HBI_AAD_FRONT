<template>
  <div v-loading="loading">
    <el-button text @click="$router.push('/templates')" class="back">← 返回模板列表</el-button>

    <div v-if="template">
      <div class="page-head">
        <div>
          <h2>{{ template.name }}</h2>
          <p v-if="template.description" class="desc">{{ template.description }}</p>
        </div>
        <div class="actions">
          <el-button @click="openEdit">编辑</el-button>
          <el-button type="primary" @click="handleApply">应用此模板</el-button>
        </div>
      </div>

      <el-descriptions :column="3" border>
        <el-descriptions-item label="ID" :span="3"><code>{{ template.id }}</code></el-descriptions-item>
        <el-descriptions-item label="可见性">
          <el-tag :type="visTag" size="small">{{ visibility }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建者">{{ userName(template.creatorId) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ fmt(template.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="Provider"><el-tag>{{ template.container?.account || '-' }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="Region">{{ template.container?.region || '-' }}</el-descriptions-item>
        <el-descriptions-item label="重启策略">{{ template.container?.restartPolicy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="实例限制">
          <el-tag v-if="template.singleton" type="warning" size="small">单例</el-tag>
          <span v-else-if="template.instanceLimit">{{ template.instanceLimit.type }}:{{ template.instanceLimit.max }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- DAG -->
      <el-card class="section">
        <template #header>DAG 继承链</template>
        <div v-if="template.dependsOn?.length" class="dag-chain">
          <el-tag v-for="(depId, i) in template.dependsOn" :key="depId" class="dag-node">
            <span class="dag-arrow" v-if="i > 0">→</span>
            {{ templateName(depId) }}
          </el-tag>
          <p class="muted">未定义字段从父模板继承合并</p>
        </div>
        <el-empty v-else description="根节点，无依赖" :image-size="50" />
      </el-card>

      <!-- 容器 -->
      <el-card class="section">
        <template #header>容器 ({{ resolvedContainers.length }})</template>
        <div v-for="(c, ci) in resolvedContainers" :key="ci" class="cont-detail">
          <h4 class="cont-title">{{ c.name || `容器 ${ci+1}` }}</h4>
          <el-descriptions :column="4" border size="small">
            <el-descriptions-item label="镜像" :span="4"><code>{{ c.image }}</code></el-descriptions-item>
            <el-descriptions-item label="命令" :span="4">{{ c.command?.join(' ') || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-row :gutter="8" style="margin-top:8px">
            <el-col :span="12">
              <div v-if="c.ports?.length" class="sub-section">
                <h5>端口映射</h5>
                <el-tag v-for="(p, pi) in c.ports" :key="pi" size="small" style="margin-right:4px">{{ p.containerPort }}{{ p.protocol ? '/'+p.protocol : '' }}</el-tag>
              </div>
              <div v-if="c.resources?.limits" class="sub-section">
                <h5>资源限制</h5>
                <span v-if="c.resources.limits.cpu">{{ c.resources.limits.cpu }}核 </span>
                <span v-if="c.resources.limits.memory">{{ c.resources.limits.memory }}Mi</span>
                <span v-else>-</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div v-if="c.env?.length" class="sub-section">
                <h5>环境变量</h5>
                <el-tag v-for="(e, ei) in c.env" :key="ei" size="small" style="margin-right:4px">{{ e.name }}={{ e.value || '-' }}</el-tag>
              </div>
            </el-col>
          </el-row>
        </div>
        <el-empty v-if="!resolvedContainers.length" description="无容器" :image-size="50" />
      </el-card>

      <!-- 网络 -->
      <el-card class="section" v-if="template.network">
        <template #header>网络</template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="模式">{{ template.network.mode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="公网 IP">{{ template.network.publicIp?.allocate ? '分配' : '不分配' }}</el-descriptions-item>
          <el-descriptions-item label="VPC ID">{{ template.network.vpc?.id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="安全组">{{ template.network.vpc?.securityGroupId || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Extensions -->
      <el-card class="section" v-if="template.extensions">
        <template #header>扩展设定</template>
        <pre class="json-block">{{ JSON.stringify(template.extensions, null, 2) }}</pre>
      </el-card>
      <!-- Health Checks -->
      <el-card class="section" v-if="template.healthChecks?.length">
        <template #header>健康检查 ({{ template.healthChecks.length }})</template>
        <div v-for="(hc, hi) in template.healthChecks" :key="hi" class="cont-box" style="margin-bottom:8px">
          <p><strong>{{ hc.name }}</strong> ({{ hc.type }}) → {{ hc.target }}</p>
          <code>{{ JSON.stringify(hc.probe) }}</code>
        </div>
      </el-card>
    </div>
    <el-empty v-else-if="!loading" description="模板不存在" />

    <!-- Edit Dialog -->
    <el-dialog v-model="edit.show" title="编辑模板" width="860px">
      <el-form :model="edit.form" label-width="100px" v-loading="edit.saving">
        <el-form-item label="名称"><el-input v-model="edit.form.name" style="width:300px" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="edit.form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="单例">
          <el-switch v-model="edit.form.singleton" />
          <span class="muted" style="margin-left:8px">启用后全局仅允许一个实例</span>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item label="平台">
            <el-select v-model="edit.form.account" filterable allow-create default-first-option placeholder="选择平台" style="width:100%">
              <el-option v-for="p in providers" :key="p" :label="p" :value="p" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="8"><el-form-item label="Region"><el-input v-model="edit.form.region" placeholder="cn-hangzhou" /></el-form-item></el-col>
          <el-col :span="8">
            <el-form-item label="重启策略">
              <el-select v-model="edit.form.restartPolicy" clearable>
                <el-option label="Always" value="Always" /><el-option label="OnFailure" value="OnFailure" /><el-option label="Never" value="Never" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="依赖">
          <el-select v-model="edit.form.dependsOn" multiple filterable style="width:100%">
            <el-option v-for="t in allTemplates" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>

        <el-divider>容器</el-divider>
        <div v-for="(c, ci) in edit.form.containers" :key="ci" class="cont-card">
          <el-form-item :label="`#${ci+1}`">
            <el-input v-model="c.name" placeholder="名称" style="width:140px;margin-right:6px" size="small" />
            <el-input v-model="c.image" placeholder="镜像" style="width:300px;margin-right:6px" size="small" />
            <el-button type="danger" size="small" @click="edit.form.containers.splice(ci,1)" circle>−</el-button>
          </el-form-item>
          <el-form-item label="命令">
            <el-input v-model="c.command" placeholder='["sleep","3600"]' style="width:500px" size="small" />
          </el-form-item>
          <el-form-item label="端口">
            <div v-for="(p, pi) in c.ports" :key="pi" style="display:flex;gap:4px;margin-bottom:4px">
              <el-input v-model="p.containerPort" style="width:100px" size="small" type="number" placeholder="容器端口" />
              <el-select v-model="p.protocol" style="width:80px" size="small">
                <el-option label="TCP" value="TCP" /><el-option label="UDP" value="UDP" />
              </el-select>
              <el-button type="danger" size="small" @click="c.ports.splice(pi,1)" circle>−</el-button>
            </div>
            <el-button size="small" @click="c.ports.push({containerPort:80,protocol:'TCP'})">+ 端口</el-button>
          </el-form-item>
          <el-form-item label="资源限制">
            <span style="margin-right:4px">CPU</span>
            <el-input-number v-model="c.cpu" :min="0" :step="0.25" size="small" style="width:90px;margin-right:10px" />
            <span style="margin-right:4px">内存 (Mi)</span>
            <el-input-number v-model="c.memory" :min="0" :step="64" size="small" style="width:90px" />
          </el-form-item>
          <el-form-item label="环境变量">
            <div v-for="(e, ei) in c.env" :key="ei" style="display:flex;gap:4px;margin-bottom:4px">
              <el-input v-model="e.key" placeholder="KEY" style="width:150px" size="small" />
              <el-input v-model="e.value" placeholder="value" style="width:250px" size="small" />
              <el-button type="danger" size="small" @click="c.env.splice(ei,1)" circle>−</el-button>
            </div>
            <el-button size="small" @click="c.env.push({key:'',value:''})">+ 环境变量</el-button>
          </el-form-item>
        </div>
        <el-divider>扩展参数</el-divider>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item label="公网 IP"><el-switch v-model="edit.form.allocatePublicIp" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="健康重试">
            <el-input-number v-model="edit.form.healthMaxRetries" :min="-1" :step="1" style="width:100%" />
          </el-form-item></el-col>
        </el-row>
        <el-form-item label="厂商透传">
          <el-input v-model="edit.form.providerOverridesStr" type="textarea" :rows="2" placeholder='{"eipBandwidth":100}' />
        </el-form-item>

        <el-divider>健康检查</el-divider>
        <div v-for="(hc, hi) in edit.form.healthChecks" :key="hi" class="cont-card">
          <el-row :gutter="8">
            <el-col :span="6"><el-form-item label="名称" label-width="50px"><el-input v-model="hc.name" size="small" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="目标" label-width="50px">
              <el-select v-model="hc.target" filterable allow-create size="small" style="width:100%">
                <el-option v-for="ct in edit.form.containers" :key="ct.name" :label="'container:'+ct.name" :value="'container:'+ct.name" />
              </el-select>
            </el-form-item></el-col>
            <el-col :span="5"><el-form-item label="类型" label-width="50px">
              <el-select v-model="hc.type" size="small">
                <el-option label="liveness" value="liveness" /><el-option label="readiness" value="readiness" /><el-option label="startup" value="startup" />
              </el-select>
            </el-form-item></el-col>
            <el-col :span="5"><el-form-item label="探测" label-width="50px">
              <el-select v-model="hc.probeType" size="small">
                <el-option label="exec" value="exec" /><el-option label="httpGet" value="httpGet" /><el-option label="tcpSocket" value="tcpSocket" />
              </el-select>
            </el-form-item></el-col>
            <el-col :span="2"><el-button type="danger" size="small" @click="edit.form.healthChecks.splice(hi,1)" circle>−</el-button></el-col>
          </el-row>
          <el-row :gutter="8">
            <el-col :span="12" v-if="hc.probeType==='exec'">
              <el-form-item label="命令" label-width="50px">
                <el-input v-model="hc.execCommand" placeholder='["/bin/sh","-c","..."]' size="small" />
              </el-form-item>
            </el-col>
            <el-col :span="6" v-if="hc.probeType==='httpGet'">
              <el-form-item label="路径" label-width="50px"><el-input v-model="hc.httpPath" placeholder="/health" size="small" /></el-form-item>
            </el-col>
            <el-col :span="6" v-if="hc.probeType==='httpGet'">
              <el-form-item label="端口" label-width="50px"><el-input-number v-model="hc.httpPort" :min="1" :max="65535" size="small" style="width:100%" /></el-form-item>
            </el-col>
            <el-col :span="6" v-if="hc.probeType==='tcpSocket'">
              <el-form-item label="端口" label-width="50px"><el-input-number v-model="hc.tcpPort" :min="1" :max="65535" size="small" style="width:100%" /></el-form-item>
            </el-col>
            <el-col :span="4"><el-form-item label="延迟" label-width="50px"><el-input-number v-model="hc.initialDelaySeconds" :min="0" size="small" style="width:100%" /></el-form-item></el-col>
            <el-col :span="4"><el-form-item label="间隔" label-width="50px"><el-input-number v-model="hc.periodSeconds" :min="0" size="small" style="width:100%" /></el-form-item></el-col>
            <el-col :span="4"><el-form-item label="超时" label-width="50px"><el-input-number v-model="hc.timeoutSeconds" :min="0" size="small" style="width:100%" /></el-form-item></el-col>
          </el-row>
        </div>
        <el-button size="small" style="margin-top:8px" @click="edit.form.healthChecks.push(emptyHc())">+ 健康检查</el-button>
      </el-form>
      <template #footer>
        <el-button @click="edit.show=false">取消</el-button>
        <el-button type="primary" :loading="edit.saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '../../api'
import { useResolver } from '../../composables/useResolver'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const template = ref<SandboxTemplate | null>(null)
const resolved = ref<SandboxTemplate | null>(null)
const allTemplates = ref<SandboxTemplate[]>([])

const { load: loadRefs, userName, templateName } = useResolver()
const providers = ref<string[]>([])

const resolvedContainers = computed(() => resolved.value?.container?.containers || template.value?.container?.containers || [])
const visibility = computed(() => template.value?.visibility || 'public')
const visTag = computed(() => visibility.value === 'public' ? 'success' : 'info')

interface PortForm { containerPort: number; protocol: string }
interface ContForm { name: string; image: string; command: string; ports: PortForm[]; cpu: number; memory: number; env: { key: string; value: string }[] }
interface HealthCheckForm {
  name: string; target: string; type: 'liveness' | 'readiness' | 'startup'
  probeType: 'exec' | 'httpGet' | 'tcpSocket'
  execCommand: string; httpPath: string; httpPort: number; tcpPort: number
  initialDelaySeconds: number; periodSeconds: number; timeoutSeconds: number
}

function emptyCont(): ContForm {
  return { name: '', image: '', command: '', ports: [], cpu: 0, memory: 0, env: [] }
}
function emptyHc(): HealthCheckForm {
  return { name: '', target: '', type: 'readiness', probeType: 'tcpSocket', execCommand: '', httpPath: '', httpPort: 80, tcpPort: 80, initialDelaySeconds: 0, periodSeconds: 10, timeoutSeconds: 5 }
}
function hcToForm(raw: any): HealthCheckForm {
  const probe = raw.probe || {}
  const probeType = probe.exec ? 'exec' : probe.httpGet ? 'httpGet' : probe.tcpSocket ? 'tcpSocket' : 'tcpSocket'
  return {
    name: raw.name || '', target: raw.target || '', type: raw.type || 'readiness', probeType,
    execCommand: probe.exec?.command ? JSON.stringify(probe.exec.command) : '',
    httpPath: probe.httpGet?.path || '/', httpPort: probe.httpGet?.port ?? 80,
    tcpPort: probe.tcpSocket?.port ?? 80,
    initialDelaySeconds: raw.initialDelaySeconds ?? 0, periodSeconds: raw.periodSeconds ?? 10, timeoutSeconds: raw.timeoutSeconds ?? 5,
  }
}
function hcsFromSpec(hcs?: any[]): HealthCheckForm[] { return (hcs || []).map(hcToForm) }
function buildHcSpec(hc: HealthCheckForm): Record<string, any> {
  const probe: Record<string, any> = {}
  if (hc.probeType === 'exec' && hc.execCommand) { try { probe.exec = { command: JSON.parse(hc.execCommand) } } catch { probe.exec = { command: [hc.execCommand] } } }
  if (hc.probeType === 'httpGet') { probe.httpGet = { path: hc.httpPath || '/', port: hc.httpPort || 80 } }
  if (hc.probeType === 'tcpSocket') { probe.tcpSocket = { port: hc.tcpPort || 80 } }
  return { name: hc.name, target: hc.target, type: hc.type, probe, initialDelaySeconds: hc.initialDelaySeconds, periodSeconds: hc.periodSeconds, timeoutSeconds: hc.timeoutSeconds }
}
function contToForm(raw: any): ContForm {
  return {
    name: raw?.name || '', image: raw?.image || '', command: raw?.command ? JSON.stringify(raw.command) : '',
    ports: (raw?.ports || []).map((p: any) => ({ containerPort: p.containerPort ?? 80, protocol: p.protocol || 'TCP' })),
    cpu: raw?.resources?.limits?.cpu || 0, memory: raw?.resources?.limits?.memory || 0,
    env: (raw?.env || []).map((e: any) => ({ key: e.name || '', value: e.value || '' })),
  }
}
function contsFromSpec(containers?: any[]): ContForm[] { return (containers || []).map(c => contToForm(c)) }
function buildContSpec(c: ContForm): Record<string, any> {
  const ct: Record<string, any> = {}
  if (c.name) ct.name = c.name
  if (c.image) ct.image = c.image
  if (c.command) { try { ct.command = JSON.parse(c.command) } catch { ct.command = [c.command] } }
  if (c.ports.length) ct.ports = c.ports.filter(p => p.containerPort).map(p => ({ containerPort: p.containerPort, ...(p.protocol ? { protocol: p.protocol } : {}) }))
  if (c.cpu || c.memory) ct.resources = { limits: {} }
  if (c.cpu) ct.resources.limits.cpu = c.cpu
  if (c.memory) ct.resources.limits.memory = c.memory
  if (c.env.length) ct.env = c.env.filter(e => e.key).map(e => ({ name: e.key, value: e.value }))
  return ct
}

const edit = reactive({
  show: false, saving: false,
  form: { name: '', description: '', singleton: false, region: '', restartPolicy: '', allocatePublicIp: false, account: '', dependsOn: [] as string[], healthMaxRetries: 0, providerOverridesStr: '', containers: [] as ContForm[], healthChecks: [] as HealthCheckForm[] },
})

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }

function openEdit() {
  if (!template.value) return
  const t = template.value
  edit.form.name = t.name; edit.form.description = t.description || ''
  edit.form.singleton = t.singleton ?? false
  edit.form.account = t.container?.account || ''; edit.form.region = t.container?.region || ''
  edit.form.restartPolicy = t.container?.restartPolicy || ''; edit.form.allocatePublicIp = t.network?.publicIp?.allocate ?? false
  edit.form.dependsOn = t.dependsOn ? [...t.dependsOn] : []
  const ext = t.extensions || {}
  edit.form.healthMaxRetries = ext.healthMaxRetries ?? 0
  edit.form.providerOverridesStr = JSON.stringify(ext.providerOverrides || {}, null, 2)
  edit.form.healthChecks = hcsFromSpec(t.healthChecks)
  edit.form.containers = contsFromSpec(t.container?.containers)
  if (!edit.form.containers.length) edit.form.containers.push(emptyCont())
  edit.show = true
}
async function load() {
  loading.value = true
  try {
    const [raw, res] = await Promise.all([
      api.extract<SandboxTemplate>(api.templates.apiTemplatesIdGet(route.params.id as string)),
      api.extract<SandboxTemplate>(api.templates.apiTemplatesIdResolvedGet(route.params.id as string)),
    ])
    template.value = raw; resolved.value = res
  } catch { ElMessage.error('加载模板失败') }
  finally { loading.value = false }
}

async function handleSave() {
  if (!edit.form.name) { ElMessage.warning('请输入名称'); return }
  edit.saving = true
  try {
    const body: Record<string, any> = { name: edit.form.name }
    if (edit.form.description) body.description = edit.form.description
    if (edit.form.singleton) body.singleton = true
    const containers = edit.form.containers.filter(c => c.image).map(buildContSpec)
    if (containers.length || edit.form.region || edit.form.restartPolicy) {
      const container: Record<string, any> = { containers }
      if (edit.form.region) container.region = edit.form.region
      if (edit.form.account) container.account = edit.form.account
      if (edit.form.restartPolicy) container.restartPolicy = edit.form.restartPolicy
      body.container = container
    }
    if (edit.form.allocatePublicIp) body.network = { publicIp: { allocate: true } }
    const extensions: Record<string, any> = {}
    if (edit.form.healthMaxRetries) extensions.healthMaxRetries = edit.form.healthMaxRetries
    if (edit.form.providerOverridesStr) { try { extensions.providerOverrides = JSON.parse(edit.form.providerOverridesStr) } catch { /* ignore */ } }
    if (Object.keys(extensions).length) body.extensions = extensions
    const hcs = edit.form.healthChecks.filter(hc => hc.name && hc.target).map(buildHcSpec)
    if (hcs.length) body.healthChecks = hcs
    if (edit.form.dependsOn.length) body.dependsOn = edit.form.dependsOn
    await api.templates.apiTemplatesIdPut(route.params.id as string, body as any)
    ElMessage.success('已保存'); edit.show = false; await load()
  } catch { ElMessage.error('保存失败') }
  finally { edit.saving = false }
}

async function handleApply() {
  try {
    await api.templates.apiTemplatesIdApplyPost(route.params.id as string, { name: template.value?.name || 'applied' } as any)
    ElMessage.success('模板已应用，容器实例创建中')
    router.push('/sandboxes')
  } catch { ElMessage.error('应用失败') }
}

onMounted(async () => {
  await loadRefs()
  await load()
  try { allTemplates.value = await api.extractArray<SandboxTemplate>(api.templates.apiTemplatesGet()) } catch { /* ignore */ }
  try {
    const plats = await api.extractArray<{ name: string }>(api.platforms.apiPlatformsGet())
    providers.value = plats.map((p: any) => p.name || p)
  } catch { /* ignore */ }
})
</script>

<style scoped>
.back { margin-bottom: 8px; padding: 0; }
.page-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.desc { color: var(--el-text-color-secondary); font-size: 13px; margin-top: 4px; }
.actions { display: flex; gap: 8px; flex-shrink: 0; }
.section { margin-top: 16px; }
code { font-size: 12px; background: var(--el-bg-color-page); padding: 2px 6px; border-radius: 3px; }
.dag-chain { display: flex; flex-wrap: wrap; gap: 8px; }
.dag-node { display: flex; align-items: center; gap: 4px; }
.dag-arrow { color: var(--el-color-warning); font-weight: bold; }
.muted { color: var(--el-text-color-secondary); font-size: 12px; margin-top: 4px; }
.cont-detail { border: 1px solid var(--el-border-color); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
.cont-title { margin: 0 0 8px 0; font-size: 15px; }
.sub-section { margin-bottom: 8px; }
.sub-section h5 { margin: 0 0 4px 0; font-size: 12px; color: var(--el-text-color-secondary); }
.cont-card { border: 1px solid var(--el-border-color); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
.json-block { font-size: 12px; background: var(--el-bg-color-page); padding: 12px; border-radius: 4px; overflow-x: auto; margin: 0; }
</style>

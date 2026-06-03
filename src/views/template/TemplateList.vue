<template>
  <div>
    <div class="page-head">
      <h2>模板</h2>
      <el-button type="primary" @click="openCreate">新建模板</el-button>
    </div>

    <el-table :data="templates || []" v-loading="loading" stripe empty-text="暂无模板">
      <el-table-column prop="name" label="名称" min-width="150" />
      <el-table-column label="容器" width="70">
        <template #default="{ row }">{{ row.container?.containers?.length || 0 }}</template>
      </el-table-column>
      <el-table-column label="Region" width="100">
        <template #default="{ row }">{{ row.container?.region || '-' }}</template>
      </el-table-column>
      <el-table-column label="重启策略" width="100">
        <template #default="{ row }">{{ row.container?.restartPolicy || '-' }}</template>
      </el-table-column>
      <el-table-column label="限制" width="80">
        <template #default="{ row }"><el-tag v-if="row.singleton" type="warning" size="small">单例</el-tag><span v-else-if="row.instanceLimit">{{ row.instanceLimit.type }}</span><span v-else>-</span></template>
      </el-table-column>
      <el-table-column label="DAG 依赖" width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ row.dependsOn?.map(id => templateName(id)).join(', ') || '-' }}</template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/templates/${row.id}`)">详情</el-button>
          <el-button size="small" @click="handleApply(row)">应用</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dlg.show" title="新建模板" width="860px" :close-on-click-modal="false">
      <el-form :model="f" label-width="100px" v-loading="dlg.saving">
        <el-form-item label="名称"><el-input v-model="f.name" placeholder="模板名称" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="f.description" type="textarea" :rows="2" placeholder="可选" /></el-form-item>

        <el-divider>部署目标</el-divider>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item label="平台">
            <el-select v-model="f.account" filterable allow-create default-first-option placeholder="选择平台" style="width:100%">
              <el-option v-for="p in providers" :key="p" :label="p" :value="p" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="8"><el-form-item label="Region"><el-input v-model="f.region" placeholder="local" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="重启策略">
            <el-select v-model="f.restartPolicy" clearable placeholder="默认">
              <el-option label="Always" value="Always" /><el-option label="OnFailure" value="OnFailure" /><el-option label="Never" value="Never" />
            </el-select>
          </el-form-item></el-col>
        </el-row>

        <el-divider>DAG 继承</el-divider>
        <el-form-item label="模板依赖">
          <el-select v-model="f.dependsOn" multiple filterable placeholder="选择父模板继承" style="width:100%" @change="onDependsChange">
            <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>

        <div v-if="inherited.length" class="inherited-box">
          <p class="inherited-title">从父模板继承的容器 (只读)</p>
          <el-tag v-for="(c, i) in inherited" :key="i" class="inherited-tag" type="info">{{ c.name || '?' }}:{{ c.image }}</el-tag>
        </div>

        <el-divider>容器</el-divider>
        <div v-for="(c, ci) in f.containers" :key="ci" class="cont-card">
          <el-form-item :label="`容器 ${ci+1}`">
            <el-input v-model="c.name" placeholder="名称" style="width:160px;margin-right:6px" size="small" />
            <el-input v-model="c.image" placeholder="镜像" style="width:320px;margin-right:6px" size="small" />
            <el-button type="danger" size="small" @click="f.containers.splice(ci,1)" circle>−</el-button>
          </el-form-item>
          <el-form-item label="命令">
            <el-input v-model="c.command" placeholder='["sleep","3600"]' style="width:500px" size="small" />
          </el-form-item>
          <el-form-item label="端口">
            <div v-for="(p, pi) in c.ports" :key="pi" style="display:flex;gap:4px;margin-bottom:4px">
              <el-input v-model="p.containerPort" placeholder="容器端口" style="width:110px" size="small" type="number" />
              <el-select v-model="p.protocol" placeholder="协议" style="width:90px" size="small">
                <el-option label="TCP" value="TCP" /><el-option label="UDP" value="UDP" />
              </el-select>
              <el-button type="danger" size="small" @click="c.ports.splice(pi,1)" circle>−</el-button>
            </div>
            <el-button size="small" @click="c.ports.push({containerPort:80,protocol:'TCP'})">+ 端口</el-button>
          </el-form-item>
          <el-form-item label="资源限制">
            <span style="margin-right:6px">CPU</span>
            <el-input-number v-model="c.cpu" :min="0" :step="0.25" :precision="2" size="small" style="width:100px;margin-right:12px" />
            <span style="margin-right:6px">内存 (Mi)</span>
            <el-input-number v-model="c.memory" :min="0" :step="64" size="small" style="width:100px" />
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
        <el-form-item><el-button size="small" @click="addContainer">+ 添加容器</el-button></el-form-item>
        <el-divider>扩展参数</el-divider>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item label="公网 IP"><el-switch v-model="f.allocatePublicIp" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="健康重试">
            <el-input-number v-model="f.healthMaxRetries" :min="-1" :step="1" style="width:100%" />
          </el-form-item></el-col>
        </el-row>
        <el-form-item label="厂商透传">
          <el-input v-model="f.providerOverridesStr" type="textarea" :rows="2" placeholder='{"eipBandwidth":100}' />
        </el-form-item>

        <el-divider>健康检查</el-divider>
        <div v-for="(hc, hi) in f.healthChecks" :key="hi" class="cont-card">
          <el-row :gutter="8">
            <el-col :span="6"><el-form-item label="名称" label-width="50px"><el-input v-model="hc.name" size="small" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="目标" label-width="50px">
              <el-select v-model="hc.target" filterable allow-create size="small" style="width:100%">
                <el-option v-for="ct in f.containers" :key="ct.name" :label="'container:'+ct.name" :value="'container:'+ct.name" />
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
            <el-col :span="2"><el-button type="danger" size="small" @click="f.healthChecks.splice(hi,1)" circle>−</el-button></el-col>
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
        <el-button size="small" style="margin-top:8px" @click="f.healthChecks.push(emptyHc())">+ 健康检查</el-button>
      </el-form>
      <template #footer>
        <el-button @click="dlg.show = false">取消</el-button>
        <el-button type="primary" :loading="dlg.saving" @click="handleSave">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useResolver } from '../../composables/useResolver'
import { api } from '../../api'

const loading = ref(false)
const templates = ref<SandboxTemplate[]>([])
const providers = ref<string[]>([])
const { load: loadRefs, templateName } = useResolver()
const inherited = ref<{ name: string; image: string }[]>([])

const dlg = reactive({ show: false, saving: false })
const f = reactive({
  name: '', description: '', account: '', region: '', restartPolicy: '', allocatePublicIp: false,
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

function specFromForm() {
  const container: Record<string, any> = {}
  if (f.region) container.region = f.region
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
  f.dependsOn = []; f.containers = []; f.healthChecks = []
  f.healthMaxRetries = 0; f.providerOverridesStr = ''
  inherited.value = []; dlg.show = true
}

async function fetchData() {
  loading.value = true
  try { templates.value = await api.extractArray<SandboxTemplate>(api.templates.apiTemplatesGet()) }
  catch { ElMessage.error('获取模板失败') }
  finally { loading.value = false }
}

async function handleSave() {
  if (!f.name) { ElMessage.warning('请输入名称'); return }
  dlg.saving = true
  try {
    const body: Record<string, any> = { name: f.name, ...(specFromForm() || {}) }
    if (f.description) body.description = f.description
    if (f.dependsOn.length) body.dependsOn = f.dependsOn

    await api.templates.apiTemplatesPost(body as any)
    ElMessage.success('已创建')
    dlg.show = false; await fetchData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.error?.message || '操作失败') }
  finally { dlg.saving = false }
}

async function handleApply(row: SandboxTemplate) {
  try {
    await api.templates.apiTemplatesIdApplyPost(row.id, { name: row.name } as any)
    ElMessage.success('模板已应用，沙箱创建中')
  } catch { ElMessage.error('应用失败') }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除此模板？', '确认删除', { type: 'warning' })
    await api.templates.apiTemplatesIdDelete(id)
    ElMessage.success('已删除'); await fetchData()
  } catch { /* ignore */ }
}

onMounted(async () => {
  await loadRefs(); await fetchData()
  try {
    const plats = await api.extractArray<{ name: string }>(api.platforms.apiPlatformsGet())
    providers.value = plats.map((p: any) => p.name || p)
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

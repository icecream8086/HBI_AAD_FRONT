<template>
  <div>
    <div class="page-head">
      <h2>{{ $t('template.title') }}</h2>
      <el-button type="primary" @click="openCreate">{{ $t('template.create') }}</el-button>
    </div>

    <el-card class="filters">
      <el-form inline>
        <el-form-item :label="$t('table.name')">
          <el-input v-model="filter.name" :placeholder="$t('table.name')" clearable style="width:200px" @clear="fetchData" @keyup.enter="fetchData" />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilter">{{ $t('table.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="templates || []" v-loading="loading" stripe :empty-text="$t('table.empty')">
      <el-table-column prop="name" :label="$t('template.name')" min-width="150" />
      <el-table-column :label="$t('template.kind')" width="150">
        <template #default="{ row }">
          <el-tag :type="(row.kind || 'Container') === 'ContainerGroup' ? 'warning' : ''" size="small">
            {{ row.apiVersion || 'hbi-aad/v1' }} / {{ row.kind || 'Container' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('template.containerLabel')" width="100">
        <template #default="{ row }">
          <template v-if="row.kind === 'ContainerGroup'">{{ Object.keys(row.podSpec?.services || {}).length || 0 }}</template>
          <template v-else>{{ row.container?.containers?.length || 0 }}</template>
        </template>
      </el-table-column>
      <el-table-column label="Region" width="100">
        <template #default="{ row }">{{ row.podSpec?.region || row.container?.region || '-' }}</template>
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

    <!-- Apply dialog -->
    <el-dialog v-model="applyDlg.show" :title="$t('template.apply')" width="420px" destroy-on-close>
      <el-form :model="applyDlg.form" label-width="100px">
        <el-form-item :label="$t('template.name')">
          <el-input v-model="applyDlg.form.name" />
        </el-form-item>
        <el-form-item :label="$t('topology.instanceTitle')" required>
          <el-select v-model="applyDlg.form.instanceId" filterable :placeholder="$t('topology.instanceTitle')" style="width:100%">
            <el-option v-for="inst in instances" :key="inst.id" :label="`${inst.name} (${inst.platform}/${inst.region})`" :value="inst.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyDlg.show = false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" :loading="applyDlg.saving" @click="handleApplyConfirm">{{ $t('template.apply') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dlg.show" :title="$t('template.createTitle')" width="860px" :close-on-click-modal="false">
      <el-form :model="f" label-width="100px" v-loading="dlg.saving">
        <el-form-item :label="$t('template.name')"><el-input v-model="f.name" :placeholder="$t('template.name')" /></el-form-item>
        <el-form-item :label="$t('template.description')"><el-input v-model="f.description" type="textarea" :rows="2" :placeholder="$t('template.description')" /></el-form-item>

        <el-form-item :label="$t('template.templateType')">
          <el-radio-group v-model="f.templateType">
            <el-radio value="Container">{{ $t('template.kindContainer') }}</el-radio>
            <el-radio value="ContainerGroup">{{ $t('template.kindContainerGroup') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="f.templateType === 'ContainerGroup'">
          <el-button size="small" type="info" @click="fillDemoPod">{{ $t('template.demoPod') }}</el-button>
          <span class="hint" style="margin-left:6px;margin-top:0">{{ $t('template.demoPodDesc') }}</span>
        </el-form-item>

        <template v-if="f.templateType === 'Container'">
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
        </template>

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

        <template v-if="f.templateType === 'ContainerGroup'">
          <el-divider>{{ $t('template.podSpec') }}</el-divider>
          <el-row :gutter="12">
            <el-col :span="8"><el-form-item :label="$t('template.podName')"><el-input v-model="f.podName" :placeholder="$t('template.name')" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item :label="$t('template.podRegion')"><el-input v-model="f.podRegion" placeholder="cn-hangzhou" /></el-form-item></el-col>
          </el-row>
          <el-row :gutter="12">
            <el-col :span="8"><el-form-item :label="$t('template.podCpu')"><el-input v-model="f.podCpu" placeholder="e.g. 1" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item :label="$t('template.podMemory')"><el-input v-model="f.podMemory" placeholder="e.g. 2Gi" /></el-form-item></el-col>
          </el-row>
          <el-divider>{{ $t('template.services') }}</el-divider>
          <div v-for="(s, si) in f.services" :key="si" class="cont-card">
            <el-form-item :label="`${$t('template.serviceName')} ${si+1}`">
              <el-input v-model="s.name" :placeholder="$t('template.name')" style="width:140px;margin-right:6px" size="small" />
              <el-input v-model="s.image" :placeholder="$t('template.imagePlaceholder')" style="width:300px;margin-right:6px" size="small" />
              <el-button type="danger" size="small" @click="f.services.splice(si,1)" circle>−</el-button>
            </el-form-item>
            <el-form-item :label="$t('table.command')">
              <el-input v-model="s.command" placeholder='["sleep","3600"]' style="width:500px" size="small" />
            </el-form-item>
            <el-form-item :label="$t('template.port')">
              <div v-for="(p, pi) in s.ports" :key="pi" style="display:flex;gap:4px;margin-bottom:4px">
                <el-input v-model="p.containerPort" placeholder="Container Port" style="width:110px" size="small" type="number" />
                <el-select v-model="p.protocol" :placeholder="$t('table.protocol')" style="width:90px" size="small">
                  <el-option label="TCP" value="TCP" /><el-option label="UDP" value="UDP" />
                </el-select>
                <el-button type="danger" size="small" @click="s.ports.splice(pi,1)" circle>−</el-button>
              </div>
              <el-button size="small" @click="s.ports.push({containerPort:80,protocol:'TCP'})">{{ $t('template.addPort') }}</el-button>
            </el-form-item>
            <el-form-item :label="$t('template.serviceResources')">
              <span style="margin-right:6px">{{ $t('template.podCpu') }}</span>
              <el-input v-model="s.cpu" placeholder="e.g. 0.5" style="width:100px;margin-right:12px" size="small" />
              <span style="margin-right:6px">{{ $t('template.podMemory') }}</span>
              <el-input v-model="s.memory" placeholder="e.g. 1Gi" style="width:100px" size="small" />
            </el-form-item>
            <el-form-item :label="$t('template.serviceDepends')">
              <el-select v-model="s.dependsOn" multiple filterable :placeholder="$t('template.dependsPlaceholder')" style="width:100%" size="small">
                <el-option v-for="other in f.services.filter((_, oi) => oi !== si)" :key="other.name" :label="other.name" :value="other.name" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('template.env')">
              <div v-for="(e, ei) in s.env" :key="ei" style="display:flex;gap:4px;margin-bottom:4px">
                <el-input v-model="e.key" placeholder="KEY" style="width:150px" size="small" />
                <el-input v-model="e.value" placeholder="value" style="width:250px" size="small" />
                <el-button type="danger" size="small" @click="s.env.splice(ei,1)" circle>−</el-button>
              </div>
              <el-button size="small" @click="s.env.push({key:'',value:''})">{{ $t('template.addEnvVar') }}</el-button>
            </el-form-item>
          </div>
          <el-form-item><el-button size="small" @click="addService">{{ $t('template.addService') }}</el-button></el-form-item>
        </template>

        <template v-if="f.templateType === 'Container'">
        <el-divider>{{ $t('template.containers') }}</el-divider>
        <div v-for="(c, ci) in f.containers" :key="ci" class="cont-card">
          <el-form-item :label="`${$t('template.containerLabel')} ${ci+1}`">
            <el-input v-model="c.name" :placeholder="$t('template.name')" style="width:160px;margin-right:6px" size="small" />
            <el-input v-model="c.image" :placeholder="$t('template.imagePlaceholder')" style="width:320px;margin-right:6px" size="small" />
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
            <el-input-number v-model="c.memory" :min="0" :step="64" size="small" style="width:100px;margin-right:12px" />
            <span style="margin-right:6px">GPU</span>
            <el-input-number v-model="c.gpu" :min="0" :step="1" size="small" style="width:80px;margin-right:6px" />
            <el-input v-model="c.gpuType" placeholder="型号 (A100/V100/T4)" size="small" style="width:150px" />
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
        </template>
        <el-divider>{{ $t('template.extraParams') }}</el-divider>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item :label="$t('template.publicIp')"><el-switch v-model="f.allocatePublicIp" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('template.healthRetry')">
            <el-input-number v-model="f.healthMaxRetries" :min="-1" :step="1" style="width:100%" />
          </el-form-item></el-col>
        </el-row>
        <el-form-item label="IP 地址">
          <el-input v-model="f.ipAddress" placeholder="不设=自动分配" />
        </el-form-item>
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

    <el-pagination
      v-model:current-page="page"
      :page-size="limit"
      :total="total"
      layout="total, prev, pager, next"
      background
      small
      style="margin-top:16px;justify-content:center"
      @current-change="fetchData"
    />
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
const page = ref(1)
const total = ref(0)
const limit = 20
const instances = ref<ComputeInstance[]>([])
const providers = ref<string[]>([])
const filter = reactive({ name: '' })
const { load: loadRefs, templateName } = useResolver()
const inherited = ref<{ name: string; image: string }[]>([])

const dlg = reactive({ show: false, saving: false })
const applyDlg = reactive({ show: false, saving: false, templateId: '', form: { name: '', instanceId: '' } })
const f = reactive({
  name: '', description: '', account: '', region: '', restartPolicy: '', allocatePublicIp: false,
  instanceId: '', zone: '',
  dependsOn: [] as string[],
  healthMaxRetries: 0, providerOverridesStr: '', ipAddress: '',
  templateType: 'Container' as TemplateKind,
  podName: '', podRegion: '', podCpu: '', podMemory: '',
  services: [] as ServiceForm[],
  containers: [] as ContainerForm[],
  healthChecks: [] as HealthCheckForm[],
})

interface EnvPair { key: string; value: string }
interface PortForm { containerPort: number; protocol: string }
interface ContainerForm {
  name: string; image: string; command: string
  ports: PortForm[]
  cpu: number; memory: number; gpu: number; gpuType: string
  env: EnvPair[]
}
interface HealthCheckForm {
  name: string; target: string; type: 'liveness' | 'readiness' | 'startup'
  probeType: 'exec' | 'httpGet' | 'tcpSocket'
  execCommand: string; httpPath: string; httpPort: number; tcpPort: number
  initialDelaySeconds: number; periodSeconds: number; timeoutSeconds: number
}
interface ServiceForm {
  name: string; image: string; command: string
  ports: PortForm[]
  cpu: string; memory: string
  dependsOn: string[]
  env: EnvPair[]
}

function emptyContainer(): ContainerForm {
  return { name: '', image: '', command: '', ports: [], cpu: 0, memory: 0, gpu: 0, gpuType: '', env: [] }
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

function emptyService(): ServiceForm {
  return { name: '', image: '', command: '', ports: [], cpu: '', memory: '', dependsOn: [], env: [] }
}
function addService() { f.services.push(emptyService()) }

function fillDemoPod() {
  f.templateType = 'ContainerGroup'
  f.name = 'demo-pod'
  f.description = 'Demo container group with nginx web server and alpine sidecar / 演示容器组，包含 nginx 和 alpine sidecar'
  f.podName = 'demo-pod'; f.podRegion = 'cn-hangzhou'; f.podCpu = '1'; f.podMemory = '2Gi'
  f.services = [
    { name: 'nginx', image: 'nginx:latest', command: '', ports: [{ containerPort: 80, protocol: 'TCP' }], cpu: '0.5', memory: '1Gi', dependsOn: [], env: [] },
    { name: 'alpine', image: 'alpine:latest', command: JSON.stringify(['sleep', '3600']), ports: [], cpu: '0.5', memory: '1Gi', dependsOn: ['nginx'], env: [] },
  ]
}

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }
function fmtLimitType(type: string): string {
  const key = `template.limit${type.charAt(0).toUpperCase()}${type.slice(1)}`
  return t(key)
}

function specFromForm() {
  const body: Record<string, any> = {}

  if (f.templateType === 'ContainerGroup') {
    const podSpec: Record<string, any> = { name: f.podName || f.name }
    if (f.podRegion) podSpec.region = f.podRegion
    if (f.podCpu || f.podMemory) {
      podSpec.resources = {}
      if (f.podCpu) podSpec.resources.cpu = f.podCpu
      if (f.podMemory) podSpec.resources.memory = f.podMemory
    }
    const svcs = f.services.filter(s => s.image)
    if (svcs.length) {
      podSpec.services = {}
      svcs.forEach(s => {
        const def: Record<string, any> = { image: s.image }
        if (s.command) { try { def.command = JSON.parse(s.command) } catch { def.command = [s.command] } }
        if (s.ports.length) def.ports = s.ports.filter(p => p.containerPort).map(p => ({ containerPort: p.containerPort, protocol: p.protocol || 'TCP' }))
        def.resources = {}
        if (s.cpu) def.resources.cpu = s.cpu
        if (s.memory) def.resources.memory = s.memory
        if (s.dependsOn.length) def.dependsOn = s.dependsOn
        if (s.env.length) def.env = s.env.filter(e => e.key).map(e => ({ name: e.key, value: e.value }))
        podSpec.services[s.name] = def
      })
    }
    if (Object.keys(podSpec).length > 1 || podSpec.services) body.podSpec = podSpec
  } else {
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
        if (c.cpu || c.memory || c.gpu) ct.resources = { limits: {} }
        if (c.cpu) ct.resources.limits.cpu = c.cpu
        if (c.memory) ct.resources.limits.memory = c.memory
        if (c.gpu) ct.resources.limits.gpu = c.gpu
        if (c.gpuType) ct.resources.limits.gpuType = c.gpuType
        if (c.env.length) ct.env = c.env.filter(e => e.key).map(e => ({ name: e.key, value: e.value }))
        return ct
      })
    }

    if (container.containers?.length) body.container = container
  }

  const extensions: Record<string, any> = {}
  if (f.healthMaxRetries) extensions.healthMaxRetries = f.healthMaxRetries
  if (f.providerOverridesStr) { try { extensions.providerOverrides = JSON.parse(f.providerOverridesStr) } catch { /* ignore */ } }

  const net: Record<string, any> = {}
  if (f.allocatePublicIp) net.publicIp = { allocate: true }
  if (f.ipAddress) net.ipAddress = f.ipAddress
  if (Object.keys(net).length) body.network = net
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
    const resolved = await api.templates.resolved(parentId) as SandboxTemplate
    if (resolved?.container?.containers?.length) inherited.value = resolved.container.containers.map(c => ({ name: c.name || '', image: c.image || '' }))
  } catch { /* no resolved */ }
}

function openCreate() {
  f.name = ''; f.description = ''; f.account = ''; f.region = ''; f.restartPolicy = ''; f.allocatePublicIp = false
  f.zone = ''
  f.dependsOn = []; f.containers = []; f.healthChecks = []
  f.healthMaxRetries = 0; f.providerOverridesStr = ''; f.ipAddress = ''
  f.templateType = 'Container'; f.podName = ''; f.podRegion = ''; f.podCpu = ''; f.podMemory = ''
  f.services = []
  inherited.value = []; dlg.show = true
}

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, limit }
    if (filter.name) params.name = filter.name
    const { items, total: totalItems } = await api.templates.list(params)
    templates.value = items
    total.value = totalItems
  } catch { ElMessage.error(t('template.fetchFailed')) }
  finally { loading.value = false }
}

function resetFilter() {
  filter.name = ''; page.value = 1; fetchData()
}

async function handleSave() {
  if (!f.name) { ElMessage.warning(t('template.nameRequired')); return }
  dlg.saving = true
  try {
    const body: Record<string, any> = { name: f.name, ...(specFromForm() || {}) }
    if (f.description) body.description = f.description
    if (f.dependsOn.length) body.dependsOn = f.dependsOn
    if (f.templateType === 'ContainerGroup') {
      body.apiVersion = 'hbi-aad/v2'
      body.kind = 'ContainerGroup'
    }

    await api.templates.create(body as any)
    ElMessage.success(t('template.createSuccess'))
    dlg.show = false; await fetchData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.error?.message || t('common.actionFailed')) }
  finally { dlg.saving = false }
}

function handleApply(row: SandboxTemplate) {
  applyDlg.templateId = row.id
  applyDlg.form.name = 'sandbox-' + Date.now()
  applyDlg.form.instanceId = ''
  applyDlg.show = true
}

async function handleApplyConfirm() {
  if (!applyDlg.form.instanceId) { ElMessage.warning(t('topology.nameRequired')); return }
  applyDlg.saving = true
  try {
    const body: Record<string, any> = { name: applyDlg.form.name, instanceId: applyDlg.form.instanceId }
    await api.templates.apply(applyDlg.templateId, body as any)
    ElMessage.success(t('template.applyInstanceSuccess'))
    applyDlg.show = false
  } catch { ElMessage.error(t('template.applyFailed')) }
  finally { applyDlg.saving = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('template.deleteConfirm'), t('table.confirm'), { type: 'warning' })
    await api.templates.delete(id)
    ElMessage.success(t('template.deleteSuccess')); await fetchData()
  } catch { /* ignore */ }
}

onMounted(async () => {
  await loadRefs(); await fetchData()
  try {
    const instsRes = await api.topology.instances.list()
    const insts = (instsRes as any).items ?? instsRes ?? []
    instances.value = insts
    providers.value = [...new Set(insts.map(i => i.platform))]
  } catch { /* ignore */ }
})
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { margin-bottom: 16px; }
.filters :deep(.el-form-item) { margin-bottom: 0; }
.cont-card { border: 1px solid var(--el-border-color); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
.inherited-box { margin: -8px 0 8px 100px; padding: 8px 12px; background: var(--el-bg-color-page); border-radius: 4px; }
.inherited-title { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 6px; }
.inherited-tag { margin-right: 4px; margin-bottom: 4px; }
.hint { font-size: 12px; color: var(--el-color-warning); margin: -12px 0 8px 100px; }
</style>

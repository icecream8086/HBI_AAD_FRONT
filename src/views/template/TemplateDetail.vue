<template>
  <div v-loading="loading">
    <el-button text @click="$router.push('/templates')" class="back">{{ $t('template.back') }}</el-button>

    <div v-if="template">
      <div class="page-head">
        <div>
          <h2>{{ template.name }}</h2>
          <p v-if="template.description" class="desc">{{ template.description }}</p>
        </div>
        <div class="actions">
          <el-button @click="openEdit">{{ $t('table.edit') }}</el-button>
          <el-button type="primary" @click="openApply">{{ $t('template.apply') }}</el-button>
        </div>
      </div>

      <el-descriptions :column="3" border>
        <el-descriptions-item label="ID" :span="3"><code>{{ template.id }}</code></el-descriptions-item>
        <el-descriptions-item label="Visibility">
          <el-tag :type="visTag" size="small">{{ visibility }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Creator">{{ userName(template.creatorId) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('template.apiVersion')">
          <el-tag size="small">{{ template.apiVersion || 'hbi-aad/v1' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('template.kind')">
          <el-tag :type="(template.kind || 'Container') === 'ContainerGroup' ? 'warning' : ''" size="small">
            {{ template.kind || 'Container' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('table.createdAt')">{{ fmt(template.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="Platform">
          <el-tag>{{ template.container?.account || '-' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Region">{{ template.podSpec?.region || template.container?.region || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('topology.instanceTitle')">{{ template.container?.instanceId || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('topology.zone')">{{ template.container?.zone || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('table.restartPolicy')">{{ template.container?.restartPolicy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Instance Limit" :span="2">
          <template v-if="template.instanceLimit">
            <el-tag size="small">{{ fmtLimitType(template.instanceLimit.type) }}</el-tag>
            : {{ template.instanceLimit.max }}
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- DAG -->
      <el-card class="section">
        <template #header>{{ $t('template.dagInherit') }} Chain</template>
        <div v-if="template.dependsOn?.length" class="dag-chain">
          <el-tag v-for="(depId, i) in template.dependsOn" :key="depId" class="dag-node">
            <span class="dag-arrow" v-if="i > 0">→</span>
            {{ templateName(depId) }}
          </el-tag>
          <p class="muted">{{ $t('template.inheritDescription') }}</p>
        </div>
        <el-empty v-else :description="$t('template.rootNode')" :image-size="50" />
      </el-card>

      <!-- 容器 -->
      <el-card class="section">
        <template #header>{{ $t('template.containers') }} ({{ resolvedContainers.length }})</template>
        <div v-for="(c, ci) in resolvedContainers" :key="ci" class="cont-detail">
          <h4 class="cont-title">{{ c.name || `${$t('template.containerLabel')} ${ci+1}` }}</h4>
          <el-descriptions :column="4" border size="small">
            <el-descriptions-item :label="$t('table.image')" :span="4"><code>{{ c.image }}</code></el-descriptions-item>
            <el-descriptions-item :label="$t('table.command')" :span="4">{{ c.command?.join(' ') || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-row :gutter="8" style="margin-top:8px">
            <el-col :span="12">
              <div v-if="c.ports?.length" class="sub-section">
                <h5>{{ $t('template.portMapping') }}</h5>
                <el-tag v-for="(p, pi) in c.ports" :key="pi" size="small" style="margin-right:4px">{{ p.containerPort }}{{ p.protocol ? '/'+p.protocol : '' }}</el-tag>
              </div>
              <div v-if="c.resources?.limits" class="sub-section">
                <h5>{{ $t('template.resources') }}</h5>
                <span v-if="c.resources.limits.cpu">{{ c.resources.limits.cpu }}{{ $t('sandbox.cores') }} </span>
                <span v-if="c.resources.limits.memory">{{ c.resources.limits.memory }}Mi</span>
                <span v-if="c.resources.limits.gpu" style="margin-left:6px">GPU: {{ c.resources.limits.gpu }}{{ c.resources.limits.gpuType ? '×'+c.resources.limits.gpuType : '' }}</span>
                <span v-if="!c.resources.limits.cpu && !c.resources.limits.memory && !c.resources.limits.gpu">-</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div v-if="c.env?.length" class="sub-section">
                <h5>{{ $t('table.env') }}</h5>
                <el-tag v-for="(e, ei) in c.env" :key="ei" size="small" style="margin-right:4px">{{ e.name }}={{ e.value || '-' }}</el-tag>
              </div>
            </el-col>
          </el-row>
        </div>
        <el-empty v-if="!resolvedContainers.length" :description="$t('template.noContainers')" :image-size="50" />
      </el-card>

      <!-- PodSpec (v2) -->
      <el-card class="section" v-if="template.kind === 'ContainerGroup' && template.podSpec">
        <template #header>{{ $t('template.containerGroup') }}: {{ template.podSpec.name }}</template>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item :label="$t('template.podRegion')">{{ template.podSpec.region || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('template.podCpu')">{{ template.podSpec.resources?.cpu || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('template.podMemory')">{{ template.podSpec.resources?.memory || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div v-for="(svcDef, svcName) in template.podSpec.services" :key="svcName" class="cont-detail" style="margin-top:12px">
          <h4 class="cont-title">{{ svcName }}</h4>
          <el-descriptions :column="4" border size="small">
            <el-descriptions-item :label="$t('table.image')" :span="4"><code>{{ svcDef.image }}</code></el-descriptions-item>
            <el-descriptions-item :label="$t('table.command')" :span="4" v-if="svcDef.command">{{ svcDef.command.join(' ') }}</el-descriptions-item>
          </el-descriptions>
          <el-row :gutter="8" style="margin-top:8px">
            <el-col :span="12">
              <div v-if="svcDef.ports?.length" class="sub-section">
                <h5>{{ $t('template.portMapping') }}</h5>
                <el-tag v-for="(p, pi) in svcDef.ports" :key="pi" size="small" style="margin-right:4px">{{ p.containerPort }}/{{ p.protocol }}</el-tag>
              </div>
              <div class="sub-section">
                <h5>{{ $t('template.serviceResources') }}</h5>
                <span>{{ svcDef.resources?.cpu || '-' }} CPU, {{ svcDef.resources?.memory || '-' }} Memory</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div v-if="svcDef.dependsOn?.length" class="sub-section">
                <h5>{{ $t('template.serviceDepends') }}</h5>
                <el-tag v-for="(dep, di) in svcDef.dependsOn" :key="di" size="small" style="margin-right:4px">{{ dep }}</el-tag>
              </div>
              <div v-if="svcDef.env?.length" class="sub-section">
                <h5>{{ $t('table.env') }}</h5>
                <el-tag v-for="(e, ei) in svcDef.env" :key="ei" size="small" style="margin-right:4px">{{ e.name }}={{ e.value || '-' }}</el-tag>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 网络 -->
      <el-card class="section" v-if="template.network">
        <template #header>{{ $t('template.network') }}</template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item :label="$t('template.mode')">{{ template.network.mode || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('template.publicIp')">{{ template.network.publicIp?.allocate ? $t('template.publicIpAllocated') : $t('template.publicIpNotAllocated') }}</el-descriptions-item>
          <el-descriptions-item :label="$t('template.vpcId')">{{ template.network.vpc?.id || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('template.securityGroup')">{{ template.network.vpc?.securityGroupId || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('template.ipAddress')">{{ template.network.ipAddress || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Extensions -->
      <el-card class="section" v-if="template.extensions">
        <template #header>{{ $t('template.extensions') }}</template>
        <div v-if="template.extensions.storage?.length" class="storage-list">
          <div v-for="(st, si) in template.extensions.storage" :key="si" class="storage-card">
            <div class="storage-hdr">
              <strong>{{ st.name }}</strong>
              <el-tag size="small">{{ st.type }}</el-tag>
              <span class="storage-mount">→ {{ st.mountPath }}</span>
            </div>
            <div class="storage-body">
              <span v-if="st.volumeId">Volume: <code>{{ st.volumeId }}</code></span>
              <span v-if="st.bucketId">Bucket: <code>{{ st.bucketId }}</code></span>
              <span v-if="st.instanceId">Instance: <code>{{ st.instanceId }}</code></span>
            </div>
          </div>
        </div>
        <pre v-else class="json-block">{{ JSON.stringify(template.extensions, null, 2) }}</pre>
      </el-card>
      <!-- Health Checks -->
      <el-card class="section" v-if="template.healthChecks?.length">
        <template #header>{{ $t('template.healthChecks') }} ({{ template.healthChecks.length }})</template>
        <div v-for="(hc, hi) in template.healthChecks" :key="hi" class="cont-box" style="margin-bottom:8px">
          <p><strong>{{ hc.name }}</strong> ({{ hc.type }}) → {{ hc.target }}</p>
          <code>{{ JSON.stringify(hc.probe) }}</code>
        </div>
      </el-card>
    </div>
    <el-empty v-else-if="!loading" :description="$t('template.notFound')" />

    <!-- Edit Dialog -->
    <el-dialog v-model="edit.show" :title="$t('template.editTitle')" width="860px">
      <el-form :model="edit.form" label-width="100px" v-loading="edit.saving">
        <el-form-item :label="$t('template.name')"><el-input v-model="edit.form.name" style="width:300px" /></el-form-item>
        <el-form-item :label="$t('template.description')"><el-input v-model="edit.form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item :label="$t('template.templateType')">
          <el-radio-group v-model="edit.form.templateType">
            <el-radio value="Container">{{ $t('template.kindContainer') }}</el-radio>
            <el-radio value="ContainerGroup">{{ $t('template.kindContainerGroup') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item :label="$t('template.singleton')">
            <el-select v-model="edit.form.limitType" clearable :placeholder="$t('template.singletonHint')" style="width:100%">
              <el-option :label="$t('template.limitFixed')" value="fixed" />
              <el-option :label="$t('template.limitPerUser')" value="perUser" />
              <el-option :label="$t('template.limitPerSystem')" value="perSystem" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('table.limit')">
            <el-input-number v-model="edit.form.limitMax" :min="1" :max="999" style="width:100%" />
          </el-form-item></el-col>
        </el-row>
        <template v-if="edit.form.templateType === 'Container'">
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="Region"><el-input v-model="edit.form.region" placeholder="cn-hangzhou" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item :label="$t('template.restartPolicy')">
              <el-select v-model="edit.form.restartPolicy" clearable>
                <el-option label="Always" value="Always" /><el-option label="OnFailure" value="OnFailure" /><el-option label="Never" value="Never" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item :label="$t('topology.instanceTitle')">
            <el-select v-model="edit.form.instanceId" filterable clearable placeholder="Optional" style="width:100%">
              <el-option v-for="inst in instances" :key="inst.id" :label="`${inst.name} (${inst.platform}/${inst.region})`" :value="inst.id" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('topology.zone')"><el-input v-model="edit.form.zone" placeholder="cn-hangzhou-a" /></el-form-item></el-col>
        </el-row>
        </template>
        <el-form-item :label="$t('template.dependsOn')">
          <el-select v-model="edit.form.dependsOn" multiple filterable style="width:100%">
            <el-option v-for="t in allTemplates" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>

        <template v-if="edit.form.templateType === 'ContainerGroup'">
          <el-divider>{{ $t('template.podSpec') }}</el-divider>
          <el-row :gutter="12">
            <el-col :span="8"><el-form-item :label="$t('template.podName')"><el-input v-model="edit.form.podName" :placeholder="$t('template.name')" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item :label="$t('template.podRegion')"><el-input v-model="edit.form.podRegion" placeholder="cn-hangzhou" /></el-form-item></el-col>
          </el-row>
          <el-row :gutter="12">
            <el-col :span="8"><el-form-item :label="$t('template.podCpu')"><el-input v-model="edit.form.podCpu" placeholder="e.g. 1" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item :label="$t('template.podMemory')"><el-input v-model="edit.form.podMemory" placeholder="e.g. 2Gi" /></el-form-item></el-col>
          </el-row>
          <el-divider>{{ $t('template.services') }}</el-divider>
          <div v-for="(s, si) in edit.form.services" :key="si" class="cont-card">
            <el-form-item :label="`${$t('template.serviceName')} ${si+1}`">
              <el-input v-model="s.name" :placeholder="$t('template.name')" style="width:140px;margin-right:6px" size="small" />
              <el-input v-model="s.image" :placeholder="$t('template.imagePlaceholder')" style="width:300px;margin-right:6px" size="small" />
              <el-button type="danger" size="small" @click="edit.form.services.splice(si,1)" circle>−</el-button>
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
                <el-option v-for="other in edit.form.services.filter((_, oi) => oi !== si)" :key="other.name" :label="other.name" :value="other.name" />
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
          <el-form-item><el-button size="small" @click="edit.form.services.push(emptyService())">{{ $t('template.addService') }}</el-button></el-form-item>
        </template>

        <template v-if="edit.form.templateType === 'Container'">
        <el-divider>{{ $t('template.containers') }}</el-divider>
        <div v-for="(c, ci) in edit.form.containers" :key="ci" class="cont-card">
          <el-form-item :label="`#${ci+1}`">
            <el-input v-model="c.name" :placeholder="$t('template.name')" style="width:140px;margin-right:6px" size="small" />
            <el-input v-model="c.image" :placeholder="$t('template.imagePlaceholder')" style="width:300px;margin-right:6px" size="small" />
            <el-button type="danger" size="small" @click="edit.form.containers.splice(ci,1)" circle>−</el-button>
          </el-form-item>
          <el-form-item :label="$t('table.command')">
            <el-input v-model="c.command" placeholder='["sleep","3600"]' style="width:500px" size="small" />
          </el-form-item>
          <el-form-item :label="$t('template.port')">
            <div v-for="(p, pi) in c.ports" :key="pi" style="display:flex;gap:4px;margin-bottom:4px">
              <el-input v-model="p.containerPort" style="width:100px" size="small" type="number" placeholder="Container Port" />
              <el-select v-model="p.protocol" style="width:80px" size="small">
                <el-option label="TCP" value="TCP" /><el-option label="UDP" value="UDP" />
              </el-select>
              <el-button type="danger" size="small" @click="c.ports.splice(pi,1)" circle>−</el-button>
            </div>
            <el-button size="small" @click="c.ports.push({containerPort:80,protocol:'TCP'})">{{ $t('template.addPort') }}</el-button>
          </el-form-item>
          <el-form-item :label="$t('template.resources')">
            <span style="margin-right:4px">CPU</span>
            <el-input-number v-model="c.cpu" :min="0" :step="0.25" size="small" style="width:90px;margin-right:10px" />
            <span style="margin-right:4px">{{ $t('template.memory') }}</span>
            <el-input-number v-model="c.memory" :min="0" :step="64" size="small" style="width:90px;margin-right:10px" />
            <span style="margin-right:4px">GPU</span>
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
        </template>
        <el-divider>{{ $t('template.networkConfig') }}</el-divider>
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item :label="$t('template.mode')">
            <el-select v-model="edit.form.networkMode" clearable :placeholder="$t('template.singletonHint')" style="width:100%">
              <el-option label="auto" value="auto" />
              <el-option label="VPC" value="vpc" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
        <el-form-item :label="$t('template.securityGroup')">
          <el-select v-model="edit.form.securityGroupId" filterable clearable placeholder="Select security group ID" style="width:100%">
            <el-option v-for="sg in sgList" :key="sg.id" :label="`${sg.name} (${sg.id})`" :value="sg.id" />
          </el-select>
        </el-form-item>
        <div class="cont-card" v-if="edit.form.networkMode === 'vpc'">
          <el-form-item :label="$t('template.subnetIds')" label-width="120px">
            <el-select v-model="edit.form.subnetIds" filterable allow-create clearable multiple placeholder="Select subnets" style="width:100%">
              <el-option v-for="sn in subnetList" :key="sn" :label="sn" :value="sn" />
            </el-select>
            <el-form-item label="IP 地址" label-width="120px">
              <el-input v-model="edit.form.ipAddress" placeholder="不设=自动分配" />
            </el-form-item>
          </el-form-item>
        </div>
        <el-divider>{{ $t('template.s3Config') }}</el-divider>
        <div v-for="(st, si) in edit.form.storage" :key="si" class="cont-card">
          <el-form-item :label="`${$t('table.volume')} ${si+1}`">
            <el-input v-model="st.name" :placeholder="$t('table.name')" size="small" style="width:120px;margin-right:4px" />
            <el-input v-model="st.mountPath" placeholder="/path" size="small" style="width:140px;margin-right:4px" />
            <el-select v-model="st.type" size="small" style="width:120px;margin-right:4px" @change="onTypeChange(st)">
              <el-option label="数据卷" value="volume" />
              <el-option label="S3/存储桶" value="bucket" />
            </el-select>
            <el-button type="danger" size="small" @click="edit.form.storage.splice(si,1)">✕</el-button>
          </el-form-item>
          <el-row :gutter="8" v-if="st.type === 'volume'">
            <el-col :span="24">
              <el-form-item :label="$t('topology.volumeTitle')" label-width="80px">
                <el-select v-model="st.volumeId" filterable clearable :placeholder="$t('table.selectPlaceholder')" size="small" style="width:100%" @change="onVolumeChange(st)">
                  <el-option v-for="v in volumes" :key="v.id" :label="`${v.name} (${v.type})`" :value="v.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="8" v-if="st.type === 'bucket'">
            <el-col :span="24">
              <el-form-item :label="$t('topology.bucketTitle')" label-width="80px">
                <el-select v-model="st.bucketId" filterable clearable :placeholder="$t('table.selectPlaceholder')" size="small" style="width:100%" @change="onBucketChange(st)">
                  <el-option v-for="b in buckets" :key="b.id" :label="`${b.name} (${b.bucketType})`" :value="b.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        <el-button size="small" @click="addStorageItem">+ {{ $t('table.volume') }}</el-button>
        <el-divider>{{ $t('template.healthChecks') }}</el-divider>
        <div class="mode-toggle">
          <el-button size="small" text @click="toggleHcJsonMode">{{ edit.healthChecksJsonMode ? '表单模式' : 'JSON 模式' }}</el-button>
        </div>
        <template v-if="!edit.healthChecksJsonMode">
          <div v-for="(hc, hi) in edit.form.healthChecks" :key="hi" class="cont-card">
            <el-row :gutter="8">
              <el-col :span="6"><el-form-item :label="$t('template.name')" label-width="50px"><el-input v-model="hc.name" size="small" /></el-form-item></el-col>
              <el-col :span="6"><el-form-item :label="$t('table.target')" label-width="50px">
                <el-select v-model="hc.target" filterable allow-create size="small" style="width:100%">
                  <el-option v-for="ct in edit.form.containers" :key="ct.name" :label="'container:'+ct.name" :value="'container:'+ct.name" />
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
              <el-col :span="2"><el-button type="danger" size="small" @click="edit.form.healthChecks.splice(hi,1)" circle>−</el-button></el-col>
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
          <el-button size="small" style="margin-top:8px" @click="edit.form.healthChecks.push(emptyHc())">{{ $t('template.addHealthCheck') }}</el-button>
        </template>
        <template v-else>
          <el-input v-model="edit.healthChecksJsonStr" type="textarea" :rows="8" placeholder='[{"name":"...","target":"container:...","type":"readiness","probe":{"tcpSocket":{"port":80}}}]' />
        </template>
        <el-divider>{{ $t('template.extraParams') }}</el-divider>
        <el-form-item :label="$t('template.healthRetry')">
          <el-input-number v-model="edit.form.healthMaxRetries" :min="-1" :step="1" style="width:100%" />
          <span style="margin-left:8px;font-size:12px;color:var(--el-text-color-secondary)">-1=永不检查，0=默认(11次)，N=N次后删除</span>
        </el-form-item>
        <el-form-item :label="$t('template.vendorPassthrough')">
          <el-input v-model="edit.form.providerOverridesStr" type="textarea" :rows="2" placeholder='{"eipBandwidth":100}' />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="edit.show=false">{{ $t('template.cancel') }}</el-button>
        <el-button type="primary" :loading="edit.saving" @click="handleSave">{{ $t('table.save') }}</el-button>
      </template>
    </el-dialog>

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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { api } from '../../api'
import { useResolver } from '../../composables/useResolver'
import { useReferenceCache } from '../../composables/useReferenceCache'

const { t } = useI18n()
const refCache = useReferenceCache()

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const template = ref<SandboxTemplate | null>(null)
const resolved = ref<SandboxTemplate | null>(null)
const allTemplates = ref<SandboxTemplate[]>([])

const { load: loadRefs, userName, templateName } = useResolver()
const instances = ref<ComputeInstance[]>([])
const volumes = ref<Volume[]>([])
const buckets = ref<RegionBucket[]>([])
const existingImages = ref<string[]>([])
const sgList = ref<SecurityGroup[]>([])
const subnetList = ref<string[]>([])

const resolvedContainers = computed(() => {
  if (template.value?.kind === 'ContainerGroup' && template.value?.podSpec?.services) {
    return Object.entries(template.value.podSpec.services).map(([name, svc]) => ({
      name,
      image: svc.image,
      command: svc.command,
      ports: svc.ports,
      resources: { limits: { cpu: svc.resources?.cpu ? Number(svc.resources.cpu) : undefined, memory: svc.resources?.memory ? Number(svc.resources.memory) : undefined } },
      env: svc.env?.map(e => ({ name: e.name, value: e.value })),
    } as ContainerDef))
  }
  return resolved.value?.container?.containers || template.value?.container?.containers || []
})
const visibility = computed(() => template.value?.visibility || 'public')
const visTag = computed(() => visibility.value === 'public' ? 'success' : 'info')

interface PortForm { containerPort: number; protocol: string }
interface ContForm { name: string; image: string; command: string; ports: PortForm[]; cpu: number; memory: number; gpu: number; gpuType: string; env: { key: string; value: string }[] }
interface ServiceForm {
  name: string; image: string; command: string
  ports: PortForm[]
  cpu: string; memory: string
  dependsOn: string[]
  env: { key: string; value: string }[]
}
interface HealthCheckForm {
  name: string; target: string; type: 'liveness' | 'readiness' | 'startup'
  probeType: 'exec' | 'httpGet' | 'tcpSocket'
  execCommand: string; httpPath: string; httpPort: number; tcpPort: number
  initialDelaySeconds: number; periodSeconds: number; timeoutSeconds: number
}

function emptyCont(): ContForm {
  return { name: '', image: '', command: '', ports: [], cpu: 0, memory: 0, gpu: 0, gpuType: '', env: [] }
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
function addStorageItem() { edit.form.storage.push(emptyStorage()) }
function onTypeChange(st: StorageForm) {
  st.volumeId = ''; st.bucketId = ''; st.instanceId = ''
}
function onVolumeChange(st: StorageForm) {
  const v = volumes.value.find(x => x.id === st.volumeId)
  if (v?.instanceId) st.instanceId = v.instanceId
}
function onBucketChange(st: StorageForm) {
  const b = buckets.value.find(x => x.id === st.bucketId)
  if (b?.instanceId) st.instanceId = b.instanceId
}
function emptyService(): ServiceForm {
  return { name: '', image: '', command: '', ports: [], cpu: '', memory: '', dependsOn: [], env: [] }
}
function serviceToForm(name: string, raw: any): ServiceForm {
  return {
    name, image: raw?.image || '', command: raw?.command ? JSON.stringify(raw.command) : '',
    ports: (raw?.ports || []).map((p: any) => ({ containerPort: p.containerPort ?? 80, protocol: p.protocol || 'TCP' })),
    cpu: raw?.resources?.cpu || '', memory: raw?.resources?.memory || '',
    dependsOn: raw?.dependsOn || [],
    env: (raw?.env || []).map((e: any) => ({ key: e.name || '', value: e.value || '' })),
  }
}
function servicesFromSpec(spec?: PodSpec): ServiceForm[] {
  if (!spec?.services) return []
  return Object.entries(spec.services).map(([k, v]) => serviceToForm(k, v))
}
function buildServiceSpec(s: ServiceForm): Record<string, any> {
  const def: Record<string, any> = { image: s.image }
  if (s.command) { try { def.command = JSON.parse(s.command) } catch { def.command = [s.command] } }
  if (s.ports.length) def.ports = s.ports.filter(p => p.containerPort)
  def.resources = {}
  if (s.cpu) def.resources.cpu = s.cpu
  if (s.memory) def.resources.memory = s.memory
  if (s.dependsOn.length) def.dependsOn = s.dependsOn
  if (s.env.length) def.env = s.env.filter(e => e.key).map(e => ({ name: e.key, value: e.value }))
  return def
}
function contToForm(raw: any): ContForm {
  return {
    name: raw?.name || '', image: raw?.image || '', command: raw?.command ? JSON.stringify(raw.command) : '',
    ports: (raw?.ports || []).map((p: any) => ({ containerPort: p.containerPort ?? 80, protocol: p.protocol || 'TCP' })),
    cpu: raw?.resources?.limits?.cpu || 0, memory: raw?.resources?.limits?.memory || 0, gpu: raw?.resources?.limits?.gpu || 0, gpuType: raw?.resources?.limits?.gpuType || '',
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
  if (c.cpu || c.memory || c.gpu) ct.resources = { limits: {} }
  if (c.cpu) ct.resources.limits.cpu = c.cpu
  if (c.memory) ct.resources.limits.memory = c.memory
  if (c.gpu) ct.resources.limits.gpu = c.gpu
  if (c.gpuType) ct.resources.limits.gpuType = c.gpuType
  if (c.env.length) ct.env = c.env.filter(e => e.key).map(e => ({ name: e.key, value: e.value }))
  return ct
}

interface StorageForm {
  name: string; type: string; mountPath: string; volumeId: string; bucketId: string; instanceId: string
}
function emptyStorage(): StorageForm {
  return { name: '', type: 'volume', mountPath: '/data', volumeId: '', bucketId: '', instanceId: '' }
}

const edit = reactive({
  show: false, saving: false,
  healthChecksJsonMode: false, healthChecksJsonStr: '',
  form: { name: '', description: '', region: '', restartPolicy: '', networkMode: 'auto', vpcInstanceId: '', securityGroupId: '', subnetIds: [] as string[], ipAddress: '', account: '', instanceId: '', zone: '', limitType: '', limitMax: 1, healthMaxRetries: 0, dependsOn: [] as string[], providerOverridesStr: '', templateType: 'Container' as TemplateKind, podName: '', podRegion: '', podCpu: '', podMemory: '', services: [] as ServiceForm[], containers: [] as ContForm[], healthChecks: [] as HealthCheckForm[], storage: [] as StorageForm[] },
})

function fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : '-' }
function fmtLimitType(type: string): string {
  const key = `template.limit${type.charAt(0).toUpperCase()}${type.slice(1)}`
  return t(key)
}

function toggleHcJsonMode() {
  if (edit.healthChecksJsonMode) {
    // JSON → form: parse and replace
    try {
      const parsed = JSON.parse(edit.healthChecksJsonStr)
      edit.form.healthChecks = hcsFromSpec(Array.isArray(parsed) ? parsed : [])
    } catch {
      ElMessage.warning('Invalid JSON, staying in JSON mode')
      return
    }
    edit.healthChecksJsonMode = false
  } else {
    // form → JSON: serialize
    const specs = edit.form.healthChecks.filter(hc => hc.name && hc.target).map(buildHcSpec)
    edit.healthChecksJsonStr = specs.length ? JSON.stringify(specs, null, 2) : '[]'
    edit.healthChecksJsonMode = true
  }
}

function openEdit() {
  if (!template.value) return
  const tpl = template.value
  edit.form.name = tpl.name; edit.form.description = tpl.description || ''
  edit.form.limitType = tpl.instanceLimit?.type || ''; edit.form.limitMax = tpl.instanceLimit?.max ?? 1
  edit.form.account = tpl.container?.account || ''; edit.form.region = tpl.container?.region || ''
  edit.form.instanceId = tpl.container?.instanceId || ''; edit.form.zone = tpl.container?.zone || ''
  edit.form.restartPolicy = tpl.container?.restartPolicy || ''
  const ext = tpl.extensions || {}
  edit.form.storage = (ext.storage || []).map((s: TemplateStorage) => ({
    name: s.name || '',
    type: s.volumeId ? 'volume' : s.bucketId ? 'bucket' : 'volume',
    mountPath: s.mountPath || '',
    volumeId: s.volumeId || '', bucketId: s.bucketId || '', instanceId: s.instanceId || '',
  }))
  edit.form.networkMode = tpl.network?.mode || 'auto'
  edit.form.vpcInstanceId = tpl.network?.vpc?.instanceId || ''
  edit.form.securityGroupId = tpl.network?.vpc?.securityGroupId || ''
  edit.form.subnetIds = tpl.network?.vpc?.subnetIds || []
  edit.form.ipAddress = tpl.network?.ipAddress || ''
  edit.form.dependsOn = tpl.dependsOn ? [...tpl.dependsOn] : []
  edit.form.healthMaxRetries = ext.healthMaxRetries ?? 0
  edit.form.providerOverridesStr = JSON.stringify(ext.providerOverrides || {}, null, 2)
  edit.healthChecksJsonStr = JSON.stringify(tpl.healthChecks || [], null, 2)
  const parsed = hcsFromSpec(tpl.healthChecks)
  const validCount = parsed.filter(h => h.name || h.target).length
  const rawCount = (tpl.healthChecks || []).length
  if (rawCount > 0 && validCount < rawCount) {
    edit.healthChecksJsonMode = true
    edit.form.healthChecks = []
  } else {
    edit.healthChecksJsonMode = false
    edit.form.healthChecks = parsed
  }
  // v2 fields
  edit.form.templateType = tpl.kind || 'Container'
  if (tpl.kind === 'ContainerGroup' && tpl.podSpec) {
    edit.form.podName = tpl.podSpec.name || ''
    edit.form.podRegion = tpl.podSpec.region || ''
    edit.form.podCpu = tpl.podSpec.resources?.cpu || ''
    edit.form.podMemory = tpl.podSpec.resources?.memory || ''
    edit.form.services = servicesFromSpec(tpl.podSpec)
  } else {
    edit.form.podName = ''; edit.form.podRegion = ''; edit.form.podCpu = ''; edit.form.podMemory = ''
    edit.form.services = []
  }
  edit.form.containers = contsFromSpec(tpl.container?.containers)
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
  } catch { ElMessage.error(t('template.fetchFailed')) }
  finally { loading.value = false }
}

async function handleSave() {
  if (!edit.form.name) { ElMessage.warning(t('template.nameRequired')); return }
  edit.saving = true
  try {
    const body: Record<string, any> = { name: edit.form.name }
    if (edit.form.description) body.description = edit.form.description
    if (edit.form.limitType) body.instanceLimit = { type: edit.form.limitType, max: edit.form.limitMax }

    if (edit.form.templateType === 'ContainerGroup') {
      body.apiVersion = 'hbi-aad/v2'
      body.kind = 'ContainerGroup'
      const podSpec: Record<string, any> = { name: edit.form.podName || edit.form.name }
      if (edit.form.podRegion) podSpec.region = edit.form.podRegion
      if (edit.form.podCpu || edit.form.podMemory) {
        podSpec.resources = {}
        if (edit.form.podCpu) podSpec.resources.cpu = edit.form.podCpu
        if (edit.form.podMemory) podSpec.resources.memory = edit.form.podMemory
      }
      const svcs = edit.form.services.filter(s => s.image)
      if (svcs.length) {
        podSpec.services = {}
        svcs.forEach(s => { podSpec.services[s.name] = buildServiceSpec(s) })
      }
      if (Object.keys(podSpec).length > 1 || podSpec.services) body.podSpec = podSpec
    } else {
      const containers = edit.form.containers.filter(c => c.image).map(buildContSpec)
      if (containers.length || edit.form.region || edit.form.restartPolicy || edit.form.instanceId || edit.form.zone) {
        const container: Record<string, any> = { containers }
        if (edit.form.region) container.region = edit.form.region
        if (edit.form.instanceId) container.instanceId = edit.form.instanceId
        if (edit.form.zone) container.zone = edit.form.zone
        if (edit.form.account) container.account = edit.form.account
        if (edit.form.restartPolicy) container.restartPolicy = edit.form.restartPolicy
        body.container = container
      }
    }
    const net: Record<string, any> = {}
    const vpc: Record<string, any> = {}
    if (edit.form.networkMode) net.mode = edit.form.networkMode
    if (edit.form.securityGroupId) vpc.securityGroupId = edit.form.securityGroupId
    if (edit.form.networkMode === 'vpc') {
      if (edit.form.vpcInstanceId) vpc.instanceId = edit.form.vpcInstanceId
      if (edit.form.subnetIds.length) vpc.subnetIds = edit.form.subnetIds
    }
    if (edit.form.ipAddress) net.ipAddress = edit.form.ipAddress
    if (Object.keys(vpc).length) net.vpc = vpc
    if (Object.keys(net).length) body.network = net
    const extensions: Record<string, any> = {}
    if (edit.form.healthMaxRetries) extensions.healthMaxRetries = edit.form.healthMaxRetries
    if (edit.form.providerOverridesStr) { try { extensions.providerOverrides = JSON.parse(edit.form.providerOverridesStr) } catch { /* ignore */ } }
    const storage = edit.form.storage.filter(s => s.name && s.mountPath)
    if (storage.length) extensions.storage = storage.map(s => {
      const item: Record<string, any> = { name: s.name, mountPath: s.mountPath, type: s.type === 'volume' ? 'nfs' : 'oss' }
      if (s.volumeId) item.volumeId = s.volumeId
      if (s.bucketId) item.bucketId = s.bucketId
      if (s.instanceId) item.instanceId = s.instanceId
      return item
    })
    if (Object.keys(extensions).length) body.extensions = extensions
    if (edit.healthChecksJsonMode && edit.healthChecksJsonStr) {
      try { body.healthChecks = JSON.parse(edit.healthChecksJsonStr) } catch { /* ignore */ }
    } else {
      const hcs = edit.form.healthChecks.filter(hc => hc.name && hc.target).map(buildHcSpec)
      if (hcs.length) body.healthChecks = hcs
    }
    if (edit.form.dependsOn.length) body.dependsOn = edit.form.dependsOn
    await api.templates.apiTemplatesIdPut(route.params.id as string, body as any)
    ElMessage.success(t('common.saved')); edit.show = false; await load()
  } catch { ElMessage.error(t('common.saveFailed')) }
  finally { edit.saving = false }
}

const applyDlg = reactive({ show: false, saving: false, form: { name: '', instanceId: '' } })

function openApply() {
  applyDlg.form.name = template.value?.name || 'sandbox-' + Date.now()
  applyDlg.form.instanceId = template.value?.container?.instanceId || ''
  applyDlg.show = true
}

async function handleApplyConfirm() {
  if (!applyDlg.form.instanceId) { ElMessage.warning(t('topology.nameRequired')); return }
  applyDlg.saving = true
  try {
    const body: Record<string, any> = { name: applyDlg.form.name, instanceId: applyDlg.form.instanceId }
    await api.templates.apiTemplatesIdApplyPost(route.params.id as string, body as any)
    ElMessage.success(t('template.applyInstanceSuccess'))
    applyDlg.show = false
    router.push('/sandboxes')
  } catch { ElMessage.error(t('template.applyFailed')) }
  finally { applyDlg.saving = false }
}

onMounted(async () => {
  await loadRefs()
  await load()
  try { allTemplates.value = await api.extractArray<SandboxTemplate>(api.templates.apiTemplatesGet()) } catch { /* ignore */ }
  await refCache.instances.load()
  instances.value = refCache.instances.data.value
  try { volumes.value = await api.topology.volumes.list().then(r => (r as any).items ?? r ?? []) } catch { /* ignore */ }
  try { buckets.value = await api.topology.buckets.list() } catch { /* ignore */ }
  await refCache.images.load()
  existingImages.value = [...new Set(refCache.images.data.value.map(r => r.image).filter(Boolean))]
  await refCache.securityGroups.load()
  sgList.value = refCache.securityGroups.data.value
  await refCache.subnets.load()
  subnetList.value = [...new Set(refCache.subnets.data.value.map((s: any) => s.name || s.id || s.cidr).filter(Boolean))]
})
</script>

<style scoped>
.back { margin-bottom: 8px; padding: 0; }
.page-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.desc { color: var(--el-text-color-secondary); font-size: 13px; margin-top: 4px; }
.storage-list { display: flex; flex-direction: column; gap: 8px; }
.storage-card { border: 1px solid var(--el-border-color); border-radius: 6px; padding: 8px 12px; }
.storage-hdr { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.storage-mount { font-size: 12px; color: var(--el-text-color-secondary); }
.storage-body { font-size: 12px; color: var(--el-text-color-secondary); display: flex; gap: 12px; }
.storage-body code { font-size: 11px; }
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

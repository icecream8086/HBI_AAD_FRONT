<template>
  <div>
    <div class="page-head">
      <el-button @click="$router.push('/dashboard')">{{ $t('table.back') }}</el-button>
      <h2>{{ $t('actionTemplate.title') }}</h2>
      <el-button @click="fetchData">{{ $t('table.refresh') }}</el-button>
    </div>

    <el-card class="filters">
      <el-form inline>
        <el-form-item :label="$t('actionTemplate.category')">
          <el-select v-model="filter.category" clearable :placeholder="$t('table.selectPlaceholder')" style="width:150px" @change="fetchData">
            <el-option :label="$t('actionTemplate.allCategories')" value="" />
            <el-option :label="$t('actionTemplate.ci')" value="ci" />
            <el-option :label="$t('actionTemplate.deploy')" value="deploy" />
            <el-option :label="$t('actionTemplate.service')" value="service" />
            <el-option :label="$t('actionTemplate.maintenance')" value="maintenance" />
            <el-option :label="$t('actionTemplate.test')" value="test" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('actionTemplate.name')">
          <el-input v-model="filter.name" clearable style="width:200px" @clear="fetchData" @keyup.enter="fetchData" />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilter">{{ $t('table.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="items" v-loading="loading" stripe :empty-text="$t('table.empty')">
      <el-table-column prop="name" :label="$t('actionTemplate.name')" min-width="160" />
      <el-table-column :label="$t('actionTemplate.category')" width="120">
        <template #default="{ row }">
          <el-tag :type="categoryType(row.category)" size="small">{{ $t(`actionTemplate.${row.category}`) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('actionTemplate.description')" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.description ? truncate(row.description, 80) : $t('actionTemplate.noDescription') }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('actionTemplate.tags')" width="160">
        <template #default="{ row }">
          <template v-if="row.tags && row.tags.length">
            <el-tag v-for="tag in row.tags.slice(0, 3)" :key="tag" size="small" style="margin-right:4px">{{ tag }}</el-tag>
            <el-tag v-if="row.tags.length > 3" size="small" type="info">+{{ row.tags.length - 3 }}</el-tag>
          </template>
          <span v-else class="dim">{{ $t('actionTemplate.noTags') }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="version" :label="$t('actionTemplate.version')" width="90" />
      <el-table-column :label="$t('table.actions')" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row.id)">{{ $t('actionTemplate.detail') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
     
      v-model:current-page="page"
      :page-size="limit"
      :total="total"
      layout="prev, pager, next"
      @current-change="fetchData"
      style="margin-top:16px; justify-content:flex-end"
    />

    <!-- Detail Dialog -->
    <el-dialog v-model="detailDlg.show" :title="$t('actionTemplate.detailTitle')" width="700px" destroy-on-close>
      <template v-if="detailDlg.template">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="$t('actionTemplate.name')" span="2">{{ detailDlg.template.name }}</el-descriptions-item>
          <el-descriptions-item :label="$t('actionTemplate.description')" span="2">
            {{ detailDlg.template.description || $t('actionTemplate.noDescription') }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('actionTemplate.version')">{{ detailDlg.template.version || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('actionTemplate.category')">
            <el-tag :type="categoryType(detailDlg.template.category)" size="small">{{ $t(`actionTemplate.${detailDlg.template.category}`) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('actionTemplate.tags')" span="2">
            <template v-if="detailDlg.template.tags && detailDlg.template.tags.length">
              <el-tag v-for="tag in detailDlg.template.tags" :key="tag" size="small" style="margin-right:4px">{{ tag }}</el-tag>
            </template>
            <span v-else class="dim">{{ $t('actionTemplate.noTags') }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <h4>{{ $t('action.detailTitle') }}</h4>
        <div v-if="detailDlg.template.trigger" class="trigger-section">
          <el-tag v-if="detailDlg.template.trigger.manual" size="small" type="primary">{{ $t('action.triggerManual') }}</el-tag>
          <el-tag v-else-if="detailDlg.template.trigger.cron" size="small" type="warning">{{ $t('action.triggerCron') }}: {{ detailDlg.template.trigger.cron }}</el-tag>
          <el-tag v-else-if="detailDlg.template.trigger.webhook" size="small" type="success">{{ $t('action.triggerWebhook') }}</el-tag>
          <el-tag v-else-if="detailDlg.template.trigger.http" size="small" type="success">{{ $t('action.triggerHttp') }}</el-tag>
          <span v-else class="dim">-</span>
        </div>
        <div v-else class="dim">-</div>

        <el-divider />

        <h4>{{ $t('action.jobs') }}</h4>
        <template v-if="detailDlg.template.jobs && Object.keys(detailDlg.template.jobs).length">
          <el-table :data="jobList(detailDlg.template.jobs)" stripe size="small" :empty-text="$t('table.empty')">
            <el-table-column prop="name" :label="$t('action.jobName')" min-width="140" />
            <el-table-column prop="image" :label="$t('template.image')" min-width="180" show-overflow-tooltip />
            <el-table-column :label="$t('action.steps')" width="80">
              <template #default="{ row }">{{ row.steps || 0 }}</template>
            </el-table-column>
          </el-table>
        </template>
        <div v-else class="dim">-</div>
      </template>
      <div v-else-if="detailDlg.loading" v-loading="detailDlg.loading" style="height:200px" />
      <template #footer>
        <el-button @click="detailDlg.show = false">{{ $t('table.close') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { api } from '../../api'

interface WorkflowTemplate {
  id: string
  name: string
  category: string
  description: string
  tags: string[]
  version: string
  trigger: {
    manual?: boolean
    cron?: string
    webhook?: boolean
    http?: boolean
  }
  jobs: Record<string, {
    image?: string
    steps?: Array<{ run: string }>
  }>
}

interface JobRow {
  name: string
  image: string
  steps: number
}

const { t } = useI18n()

const loading = ref(false)
const items = ref<WorkflowTemplate[]>([])
const page = ref(1)
const limit = 20
const total = ref(0)
const filter = reactive({ name: '', category: '' })

const detailDlg = reactive({
  show: false,
  loading: false,
  template: null as WorkflowTemplate | null,
})

const categoryTypeMap: Record<string, string> = {
  ci: 'primary',
  deploy: 'success',
  service: 'warning',
  maintenance: 'info',
  test: '',
}

function categoryType(cat: string): string {
  return categoryTypeMap[cat] || ''
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '...' : text
}

function jobList(jobs: Record<string, { image?: string; steps?: Array<{ run: string }> }>): JobRow[] {
  return Object.entries(jobs).map(([name, job]) => ({
    name,
    image: job.image || '-',
    steps: job.steps?.length || 0,
  }))
}

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, limit }
    if (filter.name) params.name = filter.name
    if (filter.category) params.category = filter.category
    const res = await api.actions.templates.list(params)
    items.value = res.items as WorkflowTemplate[]
    total.value = res.total ?? 0
  } catch {
    ElMessage.error(t('actionTemplate.fetchFailed'))
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filter.name = ''
  filter.category = ''
  page.value = 1
  fetchData()
}

async function openDetail(id: string) {
  detailDlg.loading = true
  detailDlg.template = null
  detailDlg.show = true
  try {
    const tpl = await api.actions.templates.get(id)
    detailDlg.template = tpl as WorkflowTemplate
  } catch {
    ElMessage.error(t('actionTemplate.fetchDetailFailed'))
    detailDlg.show = false
  } finally {
    detailDlg.loading = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-head h2 { margin: 0; }
.filters { margin-bottom: 16px; }
.filters :deep(.el-form-item) { margin-bottom: 0; }
.dim { color: var(--el-text-color-secondary); font-size: 13px; }
.trigger-section { display: flex; gap: 8px; }
</style>

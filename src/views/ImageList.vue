<template>
  <div>
    <div class="page-head">
      <h2>{{ $t('image.title') }}</h2>
      <div class="page-actions">
        <el-select v-model="platform" :placeholder="$t('image.allPlatforms')" clearable style="width:150px;margin-right:8px" @change="page=1;fetchData()">
          <el-option v-for="p in platforms" :key="p.name" :label="p.name" :value="p.name" />
        </el-select>
        <el-button type="primary" @click="showPull = true">{{ $t('image.pullImage') }}</el-button>
      </div>
    </div>
    <el-table :data="images || []" v-loading="loading" stripe :empty-text="$t('table.empty')">
      <el-table-column :label="$t('image.imageCol')" min-width="300" show-overflow-tooltip>
        <template #default="{ row }">{{ row.tags?.[0] || row.id }}</template>
      </el-table-column>
      <el-table-column :label="$t('image.otherTags')" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag v-for="t in row.tags?.slice(1)" :key="t" size="small" style="margin-right:4px">{{ t }}</el-tag>
          <span v-if="!row.tags?.length">-</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.size')" width="100">
        <template #default="{ row }">{{ fmtSize(row.size) }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.arch')" width="80">
        <template #default="{ row }">{{ row.architecture || '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.createdAt')" width="170">
        <template #default="{ row }">{{ row.created ? new Date(row.created).toLocaleString() : '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('table.actions')" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="inspect(row.id)">{{ $t('table.detail') }}</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">{{ $t('table.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-if="total > pageSize"
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 15, 30, 50]"
      layout="total, sizes, prev, pager, next"
      @size-change="fetchData"
      @current-change="fetchData"
    />

    <!-- Pull dialog -->
    <el-dialog v-model="showPull" :title="$t('image.pullImage')" width="500px">
      <el-form @submit.prevent="handlePull">
        <el-form-item :label="$t('image.imageCol')">
          <el-input v-model="pullImage" :placeholder="$t('image.pullPlaceholder')" @keyup.enter="handlePull" />
        </el-form-item>
        <el-form-item :label="$t('topology.instanceTitle')">
          <el-select v-model="pullClusterId" filterable clearable placeholder="Optional" style="width:100%">
            <el-option v-for="inst in pullInstances" :key="inst.id" :label="`${inst.name} (${inst.platform}/${inst.region})`" :value="inst.id" />
          </el-select>
        </el-form-item>
        <p class="hint">{{ $t('image.pullHint') }}</p>
      </el-form>
      <template #footer>
        <el-button @click="showPull=false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" :loading="pulling" @click="handlePull">{{ $t('image.pull') }}</el-button>
      </template>
    </el-dialog>

    <!-- Inspect dialog -->
    <el-dialog v-model="showDetail" :title="$t('image.imageDetail')" width="550px">
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="ID"><code>{{ detail.id }}</code></el-descriptions-item>
        <el-descriptions-item :label="$t('image.tags')">
          <el-tag v-for="t in detail.tags" :key="t" size="small" style="margin-right:4px">{{ t }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('table.size')">{{ fmtSize(detail.size) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('table.arch')">{{ detail.architecture || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('image.os')">{{ detail.os || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('image.layers')">{{ detail.layers ?? '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('table.createdAt')">{{ detail.created ? new Date(detail.created).toLocaleString() : '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../api'

const { t } = useI18n()

const loading = ref(false)
const pulling = ref(false)
const images = ref<ImageInfo[]>([])
const platforms = ref<{ name: string; containerAvailable: boolean }[]>([])
const page = ref(1)
const pageSize = ref(15)
const total = ref(0)
const platform = ref('')
const showPull = ref(false)
const pullImage = ref('')
const pullClusterId = ref('')
const pullInstances = ref<ComputeInstance[]>([])
const showDetail = ref(false)
const detail = ref<ImageInfo | null>(null)

function fmtSize(bytes?: number) {
  if (!bytes) return '-'
  const units = ['B', 'KB', 'MB', 'GB']; let i = 0; let s = bytes
  while (s >= 1024 && i < units.length - 1) { s /= 1024; i++ }
  return `${s.toFixed(1)} ${units[i]}`
}

async function fetchData() {
  loading.value = true
  try {
    const opts: any = { params: { page: page.value, limit: pageSize.value } }
    if (platform.value) opts.params.platform = platform.value
    const pageRes = await api.extractPage<ImageInfo>(api.images.apiImagesGet(opts))
    images.value = pageRes.items
    total.value = pageRes.total
  } catch { ElMessage.error(t('image.fetchFailed')) }
  finally { loading.value = false }
}

async function inspect(id: string) {
  try {
    detail.value = await api.extract<ImageInfo>(api.images.apiImagesIdGet(id))
    showDetail.value = true
  } catch { ElMessage.error(t('image.fetchDetailFailed')) }
}

async function handlePull() {
  if (!pullImage.value) { ElMessage.warning(t('image.imageRequired')); return }
  pulling.value = true
  try {
    await api.images.pull({ image: pullImage.value, instanceId: pullClusterId.value || undefined })
    ElMessage.success(t('image.pullSuccess'))
    showPull.value = false; pullImage.value = ''; pullClusterId.value = ''
    await fetchData()
  } catch { ElMessage.error(t('image.pullFailed')) }
  finally { pulling.value = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('image.deleteConfirm'), t('table.confirm'))
    await api.images.apiImagesDelete(id)
    ElMessage.success(t('image.deleteSuccess')); await fetchData()
  } catch { /* ignore */ }
}

onMounted(async () => {
  try {
    const insts = await api.topology.instances.list()
    pullInstances.value = insts
    const names = [...new Set(insts.map(i => i.platform))]
    platforms.value = names.map(n => ({ name: n, containerAvailable: true }))
  } catch { /* ignore */ }
  await fetchData()
})
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-actions { display: flex; align-items: center; }
.hint { font-size: 12px; color: var(--el-text-color-secondary); margin-top: -12px; }
code { font-size: 12px; background: var(--el-bg-color-page); padding: 2px 6px; border-radius: 3px; }
</style>

<template>
  <div>
    <div class="page-head">
      <h2>镜像</h2>
      <div class="page-actions">
        <el-select v-model="platform" placeholder="全部平台" clearable style="width:150px;margin-right:8px" @change="page=1;fetchData()">
          <el-option v-for="p in platforms" :key="p.name" :label="p.name" :value="p.name" />
        </el-select>
        <el-button type="primary" @click="showPull = true">拉取镜像</el-button>
      </div>
    </div>
    <el-table :data="images || []" v-loading="loading" stripe empty-text="暂无镜像">
      <el-table-column label="镜像" min-width="300" show-overflow-tooltip>
        <template #default="{ row }">{{ row.tags?.[0] || row.id }}</template>
      </el-table-column>
      <el-table-column label="其他标签" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag v-for="t in row.tags?.slice(1)" :key="t" size="small" style="margin-right:4px">{{ t }}</el-tag>
          <span v-if="!row.tags?.length">-</span>
        </template>
      </el-table-column>
      <el-table-column label="大小" width="100">
        <template #default="{ row }">{{ fmtSize(row.size) }}</template>
      </el-table-column>
      <el-table-column label="架构" width="80">
        <template #default="{ row }">{{ row.architecture || '-' }}</template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ row.created ? new Date(row.created).toLocaleString() : '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="inspect(row.id)">详情</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
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
    <el-dialog v-model="showPull" title="拉取镜像" width="500px">
      <el-form @submit.prevent="handlePull">
        <el-form-item label="镜像">
          <el-input v-model="pullImage" placeholder="如: docker.io/library/nginx:latest" @keyup.enter="handlePull" />
        </el-form-item>
        <p class="hint">支持私有仓库: registry.mycompany.com/myapp:v1</p>
      </el-form>
      <template #footer>
        <el-button @click="showPull=false">取消</el-button>
        <el-button type="primary" :loading="pulling" @click="handlePull">拉取</el-button>
      </template>
    </el-dialog>

    <!-- Inspect dialog -->
    <el-dialog v-model="showDetail" title="镜像详情" width="550px">
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="ID"><code>{{ detail.id }}</code></el-descriptions-item>
        <el-descriptions-item label="标签">
          <el-tag v-for="t in detail.tags" :key="t" size="small" style="margin-right:4px">{{ t }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="大小">{{ fmtSize(detail.size) }}</el-descriptions-item>
        <el-descriptions-item label="架构">{{ detail.architecture || '-' }}</el-descriptions-item>
        <el-descriptions-item label="OS">{{ detail.os || '-' }}</el-descriptions-item>
        <el-descriptions-item label="层数">{{ detail.layers ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.created ? new Date(detail.created).toLocaleString() : '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../api'

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
  } catch { ElMessage.error('获取镜像列表失败') }
  finally { loading.value = false }
}

async function inspect(id: string) {
  try {
    detail.value = await api.extract<ImageInfo>(api.images.apiImagesIdGet(id))
    showDetail.value = true
  } catch { ElMessage.error('获取镜像详情失败') }
}

async function handlePull() {
  if (!pullImage.value) { ElMessage.warning('请输入镜像名'); return }
  pulling.value = true
  try {
    await api.images.apiImagesPullPost({ image: pullImage.value })
    ElMessage.success('拉取请求已发送')
    showPull.value = false; pullImage.value = ''
    await fetchData()
  } catch { ElMessage.error('拉取失败') }
  finally { pulling.value = false }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除此镜像？', '确认')
    await api.images.apiImagesIdDelete(id)
    ElMessage.success('已删除'); await fetchData()
  } catch { /* ignore */ }
}

onMounted(async () => {
  try { platforms.value = await api.extractArray<{ name: string; containerAvailable: boolean }>(api.platforms.apiPlatformsGet()) } catch { /* ignore */ }
  await fetchData()
})
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-actions { display: flex; align-items: center; }
.hint { font-size: 12px; color: var(--el-text-color-secondary); margin-top: -12px; }
code { font-size: 12px; background: var(--el-bg-color-page); padding: 2px 6px; border-radius: 3px; }
</style>

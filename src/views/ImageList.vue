<template>
  <div>
    <div class="page-head">
      <h2>镜像</h2>
      <el-button type="primary" @click="showPull = true">拉取镜像</el-button>
    </div>
    <el-table :data="images" v-loading="loading" stripe empty-text="暂无镜像">
      <el-table-column prop="repo" label="仓库" min-width="200" />
      <el-table-column prop="tag" label="标签" width="100" />
      <el-table-column label="大小" width="100">
        <template #default="{ row }">{{ fmtSize(row.size) }}</template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ row.created ? new Date(row.created).toLocaleString() : '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showPull" title="拉取镜像" width="450px">
      <el-form @submit.prevent="handlePull">
        <el-form-item label="镜像">
          <el-input v-model="pullImage" placeholder="如: nginx:latest, alpine:3.18" @keyup.enter="handlePull" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPull=false">取消</el-button>
        <el-button type="primary" :loading="pulling" @click="handlePull">拉取</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../api'

const loading = ref(false)
const pulling = ref(false)
const images = ref<ContainerImage[]>([])
const showPull = ref(false)
const pullImage = ref('')

function fmtSize(bytes: number) {
  if (!bytes) return '-'
  const units = ['B', 'KB', 'MB', 'GB']; let i = 0; let s = bytes
  while (s >= 1024 && i < units.length - 1) { s /= 1024; i++ }
  return `${s.toFixed(1)} ${units[i]}`
}

async function fetchData() {
  loading.value = true
  try { images.value = await api.extract<ContainerImage[]>(api.images.apiImagesGet()) } catch { ElMessage.error('获取镜像列表失败') }
  finally { loading.value = false }
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

onMounted(fetchData)
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>

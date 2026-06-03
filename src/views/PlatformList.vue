<template>
  <div>
    <h2>平台 / Provider</h2>
    <el-table :data="platforms || []" v-loading="loading" stripe empty-text="暂无可用平台">
      <el-table-column label="名称">
        <template #default="{ row }">
          <div class="platform-item">
            <el-icon :size="20" style="margin-right:8px">
              <Connection />
            </el-icon>
            <span>{{ row.name }}</span>
            <el-tag v-if="row.containerAvailable" type="success" size="small" style="margin-left:8px">可用</el-tag>
            <el-tag v-else type="danger" size="small" style="margin-left:8px">不可用</el-tag>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../api'

interface PlatformInfo { name: string; containerAvailable: boolean }

const loading = ref(false)
const platforms = ref<PlatformInfo[]>([])

onMounted(async () => {
  loading.value = true
  try { platforms.value = await api.extractArray<PlatformInfo>(api.platforms.apiPlatformsGet()) } catch { /* ignore */ }
  finally { loading.value = false }
})
</script>

<style scoped>
.platform-item { display: flex; align-items: center; }
</style>

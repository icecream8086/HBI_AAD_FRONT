<template>
  <div>
    <div class="page-head">
      <h2>{{ $t('action.registryTitle') }}</h2>
    </div>

    <el-card v-if="items.length" class="section">
      <el-table :data="items" v-loading="loading" stripe :empty-text="$t('action.noActions')">
        <el-table-column prop="name" :label="$t('action.registryName')" width="160" />
        <el-table-column prop="version" :label="$t('action.registryVersion')" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" :label="$t('action.registryDescription')" min-width="200" show-overflow-tooltip />
        <el-table-column :label="$t('action.registrySource')" width="200">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.runs?.using }}</el-tag>
            <span style="margin-left:4px">{{ row.runs?.image || row.runs?.main || '' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('action.registryInputs')" width="80">
          <template #default="{ row }">{{ Object.keys(row.inputs || {}).length }}</template>
        </el-table-column>
        <el-table-column :label="$t('action.registryOutputs')" width="80">
          <template #default="{ row }">{{ Object.keys(row.outputs || {}).length }}</template>
        </el-table-column>
      </el-table>
    </el-card>
    <div v-else-if="!loading" class="empty-state">{{ $t('action.noActions') }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { api } from '../../api'

const { t } = useI18n()

const loading = ref(false)
const items = ref<ActionDef[]>([])

async function fetchData() {
  loading.value = true
  try {
    const res = await api.actions.registry.list()
    items.value = res.items ?? []
  } catch { ElMessage.error(t('action.fetchRegistryFailed')) }
  finally { loading.value = false }
}

onMounted(fetchData)
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section { margin-bottom: 16px; }
.empty-state { text-align: center; color: var(--el-text-color-secondary); padding: 40px; }
</style>

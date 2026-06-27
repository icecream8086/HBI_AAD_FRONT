<template>
  <div>
    <el-button
      text
      class="back"
      @click="$router.push('/permissions')"
    >
      {{ $t('permission.back') }}
    </el-button>
    <h2>{{ $t('permission.systemGroupTitle') }}</h2>
    <el-table
      v-loading="loading"
      :data="groups || []"
      stripe
      :empty-text="$t('table.empty')"
    >
      <el-table-column
        prop="name"
        :label="$t('table.name')"
        min-width="180"
      />
      <el-table-column
        :label="$t('permission.rules')"
        min-width="300"
      >
        <template #default="{ row }">
          <el-tag
            v-for="r in row.rules"
            :key="r.action"
            size="small"
            style="margin-right:4px"
          >
            {{ r.effect === 'allow' ? '✓' : '✗' }} {{ r.actions?.join(',') }} @{{ r.resource || '*' }} ({{ r.priority }})
          </el-tag>
          <span v-if="!row.rules?.length">{{ $t('common.none') }}</span>
        </template>
      </el-table-column>
      <el-table-column
        prop="priority"
        :label="$t('permission.priority')"
        width="80"
      />
      <el-table-column
        :label="$t('permission.dependencies')"
        width="200"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          {{ row.dependsOn?.map(id => sysGroupName(id)).join(', ') || $t('common.none') }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { api } from '../../api'

const { t } = useI18n()

const loading = ref(false)
const groups = ref<SystemGroup[]>([])

function sysGroupName(id: string) {
  const g = groups.value.find(x => x.id === id)
  return g?.name || id.slice(0, 12)
}

onMounted(async () => {
  loading.value = true
  try { groups.value = await api.systemGroups.list({ limit: 100 }).then(r => r.items) }
  catch { ElMessage.error(t('permission.systemGroupFetchFailed')) }
  finally { loading.value = false }
})
</script>

<style scoped>
.back { margin-bottom: 8px; }
</style>

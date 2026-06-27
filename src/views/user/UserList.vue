<template>
  <div>
    <div class="page-head">
      <h2>{{ $t('user.title') }}</h2>
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          :placeholder="$t('user.searchPlaceholder')"
          clearable
          style="width:320px"
          size="small"
          @keyup.enter="handleSearch"
          @clear="clearSearch"
        >
          <template #append>
            <el-button
              :loading="searching"
              @click="handleSearch"
            >
              {{ $t('user.search') }}
            </el-button>
          </template>
        </el-input>
      </div>
    </div>

    <!-- Search result banner -->
    <div
      v-if="searchResult"
      class="search-result"
    >
      <span class="result-label">{{ $t('user.searchResult') }}:</span>
      <el-tag
        closable
        style="margin-left:8px"
        @close="clearSearch"
      >
        {{ searchResult.name }} ({{ searchResult.email }}) — {{ searchResult.role }}
      </el-tag>
      <el-button
        size="small"
        text
        style="margin-left:8px"
        @click="$router.push(`/users/${searchResult.id}`)"
      >
        {{ $t('table.detail') }} →
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="users"
      stripe
      :empty-text="$t('table.empty')"
    >
      <el-table-column
        prop="name"
        :label="$t('table.name')"
        min-width="120"
      />
      <el-table-column
        prop="email"
        :label="$t('table.email')"
        min-width="200"
      />
      <el-table-column
        prop="role"
        :label="$t('table.role')"
        width="100"
      >
        <template #default="{ row }">
          <el-tag
            :type="roleType(row.role)"
            size="small"
          >
            {{ row.role }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('table.createdAt')"
        width="170"
      >
        <template #default="{ row }">
          {{ fmtCell(row.createdAt, userColumns.find(c => c.prop === 'createdAt')) }}
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('table.updatedAt')"
        width="170"
      >
        <template #default="{ row }">
          {{ fmtCell(row.updatedAt, userColumns.find(c => c.prop === 'updatedAt')) }}
        </template>
      </el-table-column>
      <el-table-column
        label="Ed25519"
        width="80"
      >
        <template #default="{ row }">
          <el-tag
            :type="row.privateKeyEd25519 ? 'success' : 'info'"
            size="small"
          >
            {{ row.privateKeyEd25519 ? $t('common.yes') : $t('common.no') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('table.actions')"
        width="120"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button
            size="small"
            @click="$router.push(`/users/${row.id}`)"
          >
            {{ $t('table.edit') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { api } from '../../api'
import { type StatusTagMap, lookup } from '../../utils/codec'
import { userColumns } from '../../constants/field-descriptors'
import { useEntityColumns } from '../../composables/useEntityColumns'

const { t } = useI18n()
const { fmtCell } = useEntityColumns(userColumns)

const loading = ref(false)
const users = ref<User[]>([])
const page = ref(1)
const total = ref(0)
const limit = 20
const searchQuery = ref('')
const searching = ref(false)
const searchResult = ref<User | null>(null)

const userRoleTags: StatusTagMap<UserRole> = { root: 'danger', Operator: 'warning', Viewer: 'info' }
function roleType(r: string) { return lookup(userRoleTags, r, 'info') }

async function handleSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  searching.value = true
  searchResult.value = null
  try {
    const user = await api.auth.search(q)
    if (user) {
      searchResult.value = user
    } else {
      ElMessage.info(t('user.notFound'))
    }
  } catch { ElMessage.error(t('common.actionFailed')) }
  finally { searching.value = false }
}

function clearSearch() {
  searchQuery.value = ''
  searchResult.value = null
}

async function fetchData() {
  loading.value = true
  try {
    const { items, total: totalItems } = await api.users.list({ page: page.value, limit })
    users.value = items
    total.value = totalItems
  } catch { /* ignore */ }
  finally { loading.value = false }
}

onMounted(async () => {
  await fetchData()
})
</script>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
.search-bar { display: flex; align-items: center; }
.search-result { display: flex; align-items: center; padding: 8px 12px; margin-bottom: 12px; background: var(--el-color-primary-light-9); border-radius: 4px; font-size: 13px; }
.result-label { color: var(--el-text-color-secondary); }
</style>

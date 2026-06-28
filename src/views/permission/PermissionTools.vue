<template>
  <div>
    <el-button
      text
      class="back"
      @click="$router.push('/dashboard')"
    >
      {{ $t('common.back') }}
    </el-button>
    <h2>{{ $t('permTools.title') }}</h2>
    <el-tabs v-model="activeTab">
      <!-- Tab 1: Permission Check -->
      <el-tab-pane
        :label="$t('permTools.check')"
        name="check"
      >
        <el-card>
          <el-form
            :model="checkForm"
            label-width="100px"
          >
            <el-form-item :label="$t('permTools.userId')">
              <el-select
                v-model="checkForm.userId"
                filterable
                :placeholder="$t('permTools.selectUser')"
                style="width:100%"
              >
                <el-option
                  v-for="u in users"
                  :key="u.id"
                  :label="`${u.name} (${u.email})`"
                  :value="u.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('permTools.action')">
              <el-input v-model="checkForm.action" />
            </el-form-item>
            <el-form-item :label="$t('permTools.resource')">
              <el-input v-model="checkForm.resource" />
            </el-form-item>
            <el-form-item :label="$t('permTools.ip')">
              <el-input v-model="checkForm.ip" />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="checkLoading"
                @click="handleCheck"
              >
                {{ $t('permTools.checkBtn') }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
        <el-card
          v-if="checkResult !== null"
          class="result-card"
        >
          <template #header>
            <span>{{ $t('permTools.result') }}</span>
          </template>
          <div class="check-result">
            <el-tag
              :type="checkResult.allowed ? 'success' : 'danger'"
              size="large"
            >
              {{ checkResult.allowed ? $t('permTools.allowed') : $t('permTools.denied') }}
            </el-tag>
          </div>
          <div
            v-if="checkResult.matchedRules?.length"
            class="matched-rules"
          >
            <h4>{{ $t('table.rules') }}</h4>
            <el-table
              :data="checkResult.matchedRules"
              stripe
              size="small"
            >
              <el-table-column
                prop="effect"
                :label="$t('permission.effect')"
                width="80"
              >
                <template #default="{ row }">
                  <el-tag
                    :type="row.effect === 'allow' ? 'success' : 'danger'"
                    size="small"
                  >
                    {{ row.effect }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="actions"
                :label="$t('permTools.action')"
              />
              <el-table-column
                prop="resource"
                :label="$t('permTools.resource')"
              />
              <el-table-column
                prop="priority"
                :label="$t('table.priority')"
                width="80"
              />
              <el-table-column
                prop="source"
                :label="$t('table.source')"
              />
            </el-table>
          </div>
          <div v-else>
            <p class="no-match">
              {{ $t('permTools.noMatchedRules') }}
            </p>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Tab 2: Compare Groups -->
      <el-tab-pane
        :label="$t('permTools.compare')"
        name="compare"
      >
        <el-card>
          <el-form
            :model="compareForm"
            label-width="120px"
          >
            <el-form-item :label="$t('permTools.groupType')">
              <el-radio-group v-model="compareForm.groupType">
                <el-radio value="permGroups">
                  {{ $t('permTools.permGroups') }}
                </el-radio>
                <el-radio value="userGroups">
                  {{ $t('permTools.userGroups') }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item :label="$t('permTools.groupA')">
              <el-select
                v-model="compareForm.idA"
                filterable
                :placeholder="$t('permTools.selectGroup')"
                style="width:100%"
              >
                <el-option
                  v-for="g in compareGroupOptions"
                  :key="g.id"
                  :label="g.name"
                  :value="g.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('permTools.groupB')">
              <el-select
                v-model="compareForm.idB"
                filterable
                :placeholder="$t('permTools.selectGroup')"
                style="width:100%"
              >
                <el-option
                  v-for="g in compareGroupOptions"
                  :key="g.id"
                  :label="g.name"
                  :value="g.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="compareLoading"
                @click="handleCompare"
              >
                {{ $t('permTools.compareBtn') }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
        <el-card
          v-if="compareResult !== null"
          class="result-card"
        >
          <template #header>
            <span>{{ $t('permTools.result') }}</span>
          </template>

          <!-- Common items -->
          <div
            v-if="compareResult.common?.length"
            class="diff-section"
          >
            <h4>{{ $t('permTools.common') }}</h4>
            <el-table
              :data="compareResult.common"
              stripe
              size="small"
            >
              <el-table-column
                prop="name"
                :label="$t('table.name')"
              />
              <el-table-column
                prop="type"
                :label="$t('table.type')"
                width="100"
              />
              <el-table-column
                prop="detail"
                :label="$t('table.detail')"
                show-overflow-tooltip
              />
            </el-table>
          </div>

          <!-- Only in A -->
          <div
            v-if="compareResult.onlyA?.length"
            class="diff-section"
          >
            <h4>{{ $t('permTools.onlyA') }}</h4>
            <el-table
              :data="compareResult.onlyA"
              stripe
              size="small"
            >
              <el-table-column
                prop="name"
                :label="$t('table.name')"
              />
              <el-table-column
                prop="type"
                :label="$t('table.type')"
                width="100"
              />
              <el-table-column
                prop="detail"
                :label="$t('table.detail')"
                show-overflow-tooltip
              />
            </el-table>
          </div>

          <!-- Only in B -->
          <div
            v-if="compareResult.onlyB?.length"
            class="diff-section"
          >
            <h4>{{ $t('permTools.onlyB') }}</h4>
            <el-table
              :data="compareResult.onlyB"
              stripe
              size="small"
            >
              <el-table-column
                prop="name"
                :label="$t('table.name')"
              />
              <el-table-column
                prop="type"
                :label="$t('table.type')"
                width="100"
              />
              <el-table-column
                prop="detail"
                :label="$t('table.detail')"
                show-overflow-tooltip
              />
            </el-table>
          </div>

          <!-- DAG dependency diff -->
          <div
            v-if="compareResult.depDiff"
            class="diff-section"
          >
            <h4>{{ $t('permTools.depDiff') }}</h4>
            <el-table
              :data="dagDiffRows"
              stripe
              size="small"
            >
              <el-table-column
                prop="group"
                :label="$t('permission.groupName')"
              />
              <el-table-column
                prop="a"
                :label="$t('permTools.groupA')"
                show-overflow-tooltip
              />
              <el-table-column
                prop="b"
                :label="$t('permTools.groupB')"
                show-overflow-tooltip
              />
            </el-table>
          </div>

          <div v-if="!compareResult.common?.length && !compareResult.onlyA?.length && !compareResult.onlyB?.length">
            <p class="no-match">
              {{ $t('table.empty') }}
            </p>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Tab 3: Log Policy -->
      <el-tab-pane
        :label="$t('permTools.logPolicy')"
        name="logPolicy"
      >
        <el-card v-loading="policyLoading">
          <template #header>
            <div class="policy-header">
              <span>{{ $t('permTools.logPolicy') }}</span>
              <el-button
                size="small"
                type="primary"
                @click="openPolicyEdit"
              >
                {{ $t('permTools.editPolicy') }}
              </el-button>
            </div>
          </template>
          <el-descriptions
            :column="1"
            border
          >
            <el-descriptions-item :label="$t('permTools.defaultLevel')">
              <el-tag>{{ policy.defaultLevel }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('permTools.auditLevel')">
              <el-tag>{{ policy.auditLevel }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('permTools.facilities')">
              <el-tag
                v-for="f in policy.facilities"
                :key="f"
                style="margin-right:4px"
              >
                {{ f }}
              </el-tag>
              <span v-if="!policy.facilities?.length">{{ $t('common.none') }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- Edit Log Policy Dialog -->
    <el-dialog
      v-model="policyDialog.show"
      :title="$t('permTools.editPolicy')"
      width="500px"
    >
      <el-form
        :model="policyForm"
        label-width="120px"
      >
        <el-form-item :label="$t('permTools.defaultLevel')">
          <el-select
            v-model="policyForm.defaultLevel"
            style="width:100%"
          >
            <el-option
              label="trace"
              value="trace"
            />
            <el-option
              label="debug"
              value="debug"
            />
            <el-option
              label="info"
              value="info"
            />
            <el-option
              label="warn"
              value="warn"
            />
            <el-option
              label="error"
              value="error"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('permTools.auditLevel')">
          <el-select
            v-model="policyForm.auditLevel"
            style="width:100%"
          >
            <el-option
              label="trace"
              value="trace"
            />
            <el-option
              label="debug"
              value="debug"
            />
            <el-option
              label="info"
              value="info"
            />
            <el-option
              label="warn"
              value="warn"
            />
            <el-option
              label="error"
              value="error"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('permTools.facilities')">
          <el-select
            v-model="policyForm.facilities"
            multiple
            filterable
            allow-create
            default-first-option
            :placeholder="$t('permTools.facilities')"
            style="width:100%"
          >
            <el-option
              label="auth"
              value="auth"
            />
            <el-option
              label="api"
              value="api"
            />
            <el-option
              label="audit"
              value="audit"
            />
            <el-option
              label="system"
              value="system"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="policyDialog.show = false">
          {{ $t('table.cancel') }}
        </el-button>
        <el-button
          type="primary"
          :loading="policySaving"
          @click="handlePolicyUpdate"
        >
          {{ $t('permTools.updatePolicy') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { api } from '../../api/typed'

const { t } = useI18n()

// ── Tab state ──
const activeTab = ref('check')

// ── Shared data ──
const users = ref<any[]>([])
const groups = ref<any[]>([])
const userGroups = ref<any[]>([])

// ── Tab 1: Permission Check ──
const checkForm = reactive({
  userId: '',
  action: '',
  resource: '',
  ip: '',
})
const checkLoading = ref(false)
const checkResult = ref<any>(null)

async function handleCheck() {
  if (!checkForm.userId || !checkForm.action || !checkForm.resource) {
    ElMessage.warning(t('permTools.actionFailed'))
    return
  }
  checkLoading.value = true
  checkResult.value = null
  try {
    const body: Record<string, any> = {
      userId: checkForm.userId,
      action: checkForm.action,
      resource: checkForm.resource,
    }
    if (checkForm.ip) body.ip = checkForm.ip
    checkResult.value = await api.permissions.check(body)
  } catch {
    ElMessage.error(t('permTools.actionFailed'))
  } finally {
    checkLoading.value = false
  }
}

// ── Tab 2: Compare Groups ──
const compareForm = reactive({
  groupType: 'permGroups' as 'permGroups' | 'userGroups',
  idA: '',
  idB: '',
})
const compareLoading = ref(false)
const compareResult = ref<any>(null)

const compareGroupOptions = computed(() => {
  if (compareForm.groupType === 'permGroups') return groups.value
  return userGroups.value
})

watch(() => compareForm.groupType, () => {
  compareForm.idA = ''
  compareForm.idB = ''
  compareResult.value = null
})

const dagDiffRows = computed(() => {
  if (!compareResult.value?.depDiff) return []
  return Object.entries(compareResult.value.depDiff).map(([group, deps]) => ({
    group,
    a: (deps as any).a?.join(', ') || '-',
    b: (deps as any).b?.join(', ') || '-',
  }))
})

async function handleCompare() {
  if (!compareForm.idA || !compareForm.idB) {
    ElMessage.warning(t('permTools.selectGroup'))
    return
  }
  compareLoading.value = true
  compareResult.value = null
  try {
    if (compareForm.groupType === 'permGroups') {
      compareResult.value = await api.permissions.compare.permGroups(compareForm.idA, compareForm.idB)
    } else {
      compareResult.value = await api.permissions.compare.userGroups(compareForm.idA, compareForm.idB)
    }
  } catch {
    ElMessage.error(t('permTools.actionFailed'))
  } finally {
    compareLoading.value = false
  }
}

// ── Tab 3: Log Policy ──
const policyLoading = ref(false)
const policy = reactive({
  defaultLevel: '',
  auditLevel: '',
  facilities: [] as string[],
})
const policyDialog = reactive({
  show: false,
})
const policyForm = reactive({
  defaultLevel: '',
  auditLevel: '',
  facilities: [] as string[],
})
const policySaving = ref(false)

async function fetchPolicy() {
  policyLoading.value = true
  try {
    const data: any = await api.permissions.logPolicy.get()
    policy.defaultLevel = data.defaultLevel ?? ''
    policy.auditLevel = data.auditLevel ?? ''
    policy.facilities = data.facilities ?? []
  } catch {
    ElMessage.error(t('permTools.fetchFailed'))
  } finally {
    policyLoading.value = false
  }
}

function openPolicyEdit() {
  policyForm.defaultLevel = policy.defaultLevel
  policyForm.auditLevel = policy.auditLevel
  policyForm.facilities = [...policy.facilities]
  policyDialog.show = true
}

async function handlePolicyUpdate() {
  policySaving.value = true
  try {
    const body: Record<string, any> = {}
    if (policyForm.defaultLevel) body.defaultLevel = policyForm.defaultLevel
    if (policyForm.auditLevel) body.auditLevel = policyForm.auditLevel
    if (policyForm.facilities.length) body.facilities = policyForm.facilities
    await api.permissions.logPolicy.update(body)
    ElMessage.success(t('permTools.updateSuccess'))
    policyDialog.show = false
    await fetchPolicy()
  } catch {
    ElMessage.error(t('permTools.updateFailed'))
  } finally {
    policySaving.value = false
  }
}

// ── Initialization ──
onMounted(async () => {
  try {
    const userPage = await api.users.list({ limit: 200 })
    users.value = userPage.items
  } catch { /* ignore */ }
  try {
    const groupPage = await api.permissions.groups.list({ limit: 100 })
    groups.value = groupPage.items
  } catch { /* ignore */ }
  try {
    const ugPage = await api.permissions.userGroups.list({ limit: 100 })
    userGroups.value = ugPage.items
  } catch { /* ignore */ }
  await fetchPolicy()
})
</script>

<style scoped>
.back { margin-bottom: 8px; }
.result-card { margin-top: 16px; }
.check-result { text-align: center; padding: 16px 0; }
.check-result .el-tag { font-size: 18px; padding: 8px 24px; }
.matched-rules { margin-top: 12px; }
.no-match { color: var(--el-text-color-secondary); text-align: center; padding: 16px; }
.diff-section { margin-bottom: 16px; }
.diff-section h4 { margin-bottom: 8px; }
.policy-header { display: flex; justify-content: space-between; align-items: center; }
</style>

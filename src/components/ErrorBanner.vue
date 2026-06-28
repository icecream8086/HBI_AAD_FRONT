<template>
  <el-alert
    :title="error.message"
    :type="config.variant"
    :closable="closable"
    show-icon
    @close="$emit('close')"
  >
    <template v-if="error.code === 'VALIDATION_ERROR' && error.fields">
      <div v-for="(msg, field) in error.fields" :key="field" class="field-error">
        <strong>{{ field }}</strong>: {{ msg }}
      </div>
    </template>
    <template v-if="error.code === 'NOT_FOUND' && error.resource">
      <div class="error-detail">资源: {{ error.resource }}</div>
    </template>
    <template v-if="error.code === 'RATE_LIMITED' && error.retryAfter">
      <div class="error-detail">请在 {{ error.retryAfter }} 秒后重试</div>
    </template>
  </el-alert>
</template>

<script setup lang="ts">
import type { AppError } from '@/types/errors'
import { ERROR_CONFIG } from '@/types/errors'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  error: AppError
  closable?: boolean
}>(), { closable: true })

defineEmits<{ close: [] }>()

const config = computed(() => ERROR_CONFIG[props.error.code])
</script>

<style scoped>
.field-error {
  font-size: 13px;
  margin-top: 4px;
}
.error-detail {
  font-size: 13px;
  margin-top: 4px;
  color: var(--el-text-color-secondary);
}
</style>

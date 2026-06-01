<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { setupInterceptors } from './api/interceptor'
import { useTheme } from './composables/useTheme'

useTheme()

onMounted(() => {
  setupInterceptors()
})
</script>

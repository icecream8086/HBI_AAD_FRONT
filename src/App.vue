<template>
  <el-config-provider :locale="elLocale">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import { useTheme } from './composables/useTheme'
import { elLocale } from './composables/useLocale'
useTheme()
</script>

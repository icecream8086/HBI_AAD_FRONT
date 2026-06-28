// 类型化 i18n composable — Layer 3A
//
// 用法：
//   const { t } = useTypedI18n()
//   t('route.dashboard')  // 编译期校验 key 存在

import { useI18n } from 'vue-i18n'
import type { I18nKey } from '@/i18n/keys'

export function useTypedI18n() {
  const { t, ...rest } = useI18n()
  return { t: t as (key: I18nKey) => string, ...rest }
}

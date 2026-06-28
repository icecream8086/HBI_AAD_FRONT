// 类型化路由 composable — Layer 2A
//
// 用法：
//   const { params } = useTypedRoute('/sandboxes/:id')
//   params.id  // string，无需 as string

import { useRoute } from 'vue-router'
import type { AppRoutePath, RouteParamsFor } from '@/router/routes'

export function useTypedRoute<P extends AppRoutePath>(_expectedPath?: P) {
  const route = useRoute()
  return {
    ...route,
    params: route.params as unknown as RouteParamsFor<P>,
  }
}

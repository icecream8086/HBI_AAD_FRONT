// Login/Register 表单 Zod schema — Layer 5
//
// Schema 是表单字段 + 校验规则的唯一信源。
// 修改字段或校验 → 只改此处，TS 自动推导类型。

import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'login.emailRequired'),
  password: z.string().min(1, 'login.passwordRequired'),
})

export const registerSchema = z.object({
  name: z.string().min(1, 'login.usernameRequired'),
  email: z.string().min(1, 'login.emailRequired'),
  password: z.string().min(8, 'login.passwordMin'),
  confirm: z.string().min(1, 'login.confirmRequired'),
}).refine(data => data.password === data.confirm, {
  message: 'login.passwordMismatch',
  path: ['confirm'],
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>

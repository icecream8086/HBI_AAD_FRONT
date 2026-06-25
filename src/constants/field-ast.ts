/**
 * ECI Extension Field AST — 纯逻辑引擎，无 UI 依赖
 * 严格遵循 ECI_EXTENSION_AST.md 规则表
 */

// ═══════════ Types ═══════════

export type FieldType = 'boolean' | 'number' | 'string' | 'string[]' | 'object'

export interface Rule {
  op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'exists' | 'empty'
  field: string
  value?: string | number | boolean | string[]
}

export interface Validation {
  kind: 'enum' | 'range' | 'pattern'
  values?: string[]
  min?: number
  max?: number
  pattern?: string
}

export interface FieldNode {
  key: string
  group: string
  type: FieldType
  label: string
  description: string
  eciParam: string
  defaultValue?: unknown
  validation?: Validation
  visibility: Rule[]     // 可见性条件 (AND)
  required: Rule[]       // 必填条件 (AND, 仅在可见时生效)
  locked: Rule[]         // 锁定条件 (AND)
  order: number
}

export interface VendorGroup {
  provider: string
  label: string
  description: string
  fields: readonly FieldNode[]
}

export interface ResolvedField extends Omit<FieldNode, 'visibility' | 'required' | 'locked'> {
  visible: boolean
  locked: boolean
  required: boolean
  errors: string[]
}

export type Severity = 'error' | 'warning'

export interface ValidationError {
  key: string
  message: string
  severity: Severity
}

// ═══════════ Rule Engine ═══════════

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  // 先查整体 key（如 'resourceSpec.gpu'、'subnetIds.length' 等合成属性）
  if (path in obj) return obj[path]
  // 再按点号拆解为嵌套路径
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur == null) return undefined
    const m = p.match(/^(\w+)\[(\d+)\]$/)
    if (m) {
      cur = (cur as Record<string, unknown>)[m[1]]
      cur = (cur as unknown[])?.[Number(m[2])]
    } else {
      cur = (cur as Record<string, unknown>)[p]
    }
  }
  return cur
}

export function evalRule(r: Rule, values: Record<string, unknown>): boolean {
  const val = resolvePath(values, r.field)
  switch (r.op) {
    case 'eq':  return val === r.value
    case 'neq': return val !== r.value
    case 'gt':  return Number(val) > Number(r.value)
    case 'gte': return Number(val) >= Number(r.value)
    case 'lt':  return Number(val) < Number(r.value)
    case 'lte': return Number(val) <= Number(r.value)
    case 'in':  return Array.isArray(r.value) && r.value.includes(val as string)
    case 'nin': return Array.isArray(r.value) && !r.value.includes(val as string)
    case 'exists': return val !== undefined && val !== null
    case 'empty':  return val === undefined || val === null || val === '' || val === false
    default: return true
  }
}

/** 所有 Rule 为 AND 关系 */
export function evalRules(rules: Rule[], values: Record<string, unknown>): boolean {
  return rules.every(r => evalRule(r, values))
}

// ═══════════ Resolver ═══════════

export function resolveField(f: FieldNode, values: Record<string, unknown>): ResolvedField {
  const visible = f.visibility.length ? evalRules(f.visibility, values) : true
  const locked  = f.locked.length    ? evalRules(f.locked, values)    : false
  const required = f.required.length  ? evalRules(f.required, values)  : false
  return { ...f, visible, locked, required, errors: [] }
}

export function resolveFields(fields: readonly FieldNode[], values: Record<string, unknown>): ResolvedField[] {
  return fields.map(f => resolveField(f, values))
}

/** 按 group 分组已解析字段 */
export function groupResolved(fields: ResolvedField[]): Map<string, ResolvedField[]> {
  const m = new Map<string, ResolvedField[]>()
  for (const f of fields) {
    if (!f.visible) continue
    const list = m.get(f.group) || []
    list.push(f)
    m.set(f.group, list)
  }
  for (const list of m.values()) list.sort((a, b) => a.order - b.order)
  return m
}

// ═══════════ Cross-field Validation ═══════════

export function validateFields(fields: readonly FieldNode[], values: Record<string, unknown>): ValidationError[] {
  const errs: ValidationError[] = []
  const resolved = resolveFields(fields, values)

  // EIP 互斥
  if (values['autoCreateEip'] && values['eipInstanceId']) {
    errs.push({ key: 'autoCreateEip', message: '与已有 EIP 实例 ID 互斥，只能二选一', severity: 'error' })
    errs.push({ key: 'eipInstanceId', message: '与自动创建 EIP 互斥，只能二选一', severity: 'error' })
  }

  // GPU 架构冲突
  if (values['gpuCount'] && values['cpuArchitecture'] && values['cpuArchitecture'] !== 'AMD64') {
    errs.push({ key: 'cpuArchitecture', message: 'GPU 实例仅支持 AMD64 架构', severity: 'error' })
  }

  // 实例类型架构冲突
  const it = values['instanceType'] as string
  if (it && it.startsWith('ecs.g') && values['cpuArchitecture'] === 'Arm64') {
    errs.push({ key: 'instanceType', message: '所选 GPU 实例类型不支持 ARM 架构', severity: 'error' })
  }

  // Spot 价格缺失
  if (values['spotStrategy'] === 'SpotWithPriceLimit') {
    const spl = values['spotPriceLimit']
    if (spl === undefined || spl === null || spl === '' || Number(spl) <= 0) {
      errs.push({ key: 'spotPriceLimit', message: '竞价上限模式下必须设置价格上限', severity: 'error' })
    }
  }

  // Windows 容器提醒
  if (values['osType'] === 'Windows') {
    errs.push({ key: 'osType', message: 'Windows 容器实例非常稀有，大部分区域不支持，且费用较高', severity: 'warning' })
  }

  // 必填字段检查（仅可见字段）
  for (const f of resolved) {
    if (f.required) {
      const fv = values[f.key]
      if (fv === undefined || fv === null || fv === '' || fv === false) {
        errs.push({ key: f.key, message: `${f.label} 为必填项`, severity: 'error' })
      }
    }
  }

  return errs
}

// ═══════════ Output Builder ═══════════

export function buildProviderOverrides(
  fields: readonly FieldNode[],
  values: Record<string, unknown>,
  provider: string = 'alibaba',
): Record<string, unknown> {
  const resolved = resolveFields(fields, values)
  const out: Record<string, unknown> = {}
  for (const f of resolved) {
    if (!f.visible) continue
    const v = values[f.key]
    if (v !== undefined && v !== '' && v !== null) out[f.key] = v
  }
  return { providerOverrides: { [provider]: out } }
}

/** 解析 JSON 输入 → values 映射（只提取已知字段） */
export function parseInput(raw: string, fields: readonly FieldNode[], provider: string = 'alibaba'): Record<string, unknown> {
  const parsed = JSON.parse(raw)
  const ali = parsed?.providerOverrides?.[provider] || parsed?.[provider] || parsed
  if (typeof ali !== 'object' || ali === null || Array.isArray(ali)) return {}
  const out: Record<string, unknown> = {}
  for (const f of fields) {
    if (ali[f.key] !== undefined) out[f.key] = ali[f.key]
  }
  return out
}

// ═══════════ Instance Type Taxonomy ═══════════

export interface InstanceFamily {
  prefix: string
  name: string
  category: string  // tag
}

export const INSTANCE_CATEGORIES = [
  { tag: '通用型', families: ['g8i','g8a','g8ae','g8y','g7','g7a','g7ne','g7nex','g7t','g6','g6a','g6e','g6t','g5','g5ne'] },
  { tag: '计算型', families: ['c8i','c8a','c8ae','c8y','c7','c7a','c6','c6a','c6e','c5'] },
  { tag: '内存型', families: ['r8i','r8a','r8ae','r8y','r7','r7a','r7p','r6','r6a','r6e','r5'] },
  { tag: '高主频', families: ['hfc8i','hfc7','hfg7','hfr7','hfc6','hfg6','hfr6'] },
  { tag: 'GPU型',  families: ['gn9gc','gn8v','gn8is','gn7e','gn7i','gn7s','gn7','gn6i','gn6e','gn6v','sgn8ia','sgn7i','vgn7i','vgn6i'] },
  { tag: '本地SSD', families: ['i4','i4g','i3','i3g','i2','i2g'] },
  { tag: '大数据',  families: ['d3c','d3s','d2c','d2s'] },
  { tag: '突发型',  families: ['t7','t6'] },
  { tag: '通用算力', families: ['u1'] },
] as const

const ALL_INSTANCE_TYPES = [
  // 通用型 g8i
  'ecs.g8i.large','ecs.g8i.xlarge','ecs.g8i.2xlarge','ecs.g8i.4xlarge','ecs.g8i.8xlarge','ecs.g8i.16xlarge','ecs.g8i.32xlarge',
  // 通用型 g8a
  'ecs.g8a.large','ecs.g8a.xlarge','ecs.g8a.2xlarge','ecs.g8a.4xlarge','ecs.g8a.8xlarge','ecs.g8a.16xlarge','ecs.g8a.32xlarge',
  // 通用型 g7
  'ecs.g7.large','ecs.g7.xlarge','ecs.g7.2xlarge','ecs.g7.4xlarge','ecs.g7.8xlarge','ecs.g7.16xlarge',
  'ecs.g7a.large','ecs.g7a.xlarge','ecs.g7a.2xlarge','ecs.g7a.4xlarge','ecs.g7a.8xlarge','ecs.g7a.16xlarge',
  'ecs.g7ne.large','ecs.g7ne.xlarge','ecs.g7ne.2xlarge','ecs.g7ne.4xlarge','ecs.g7ne.8xlarge',
  // 通用型 g6
  'ecs.g6.large','ecs.g6.xlarge','ecs.g6.2xlarge','ecs.g6.4xlarge','ecs.g6.8xlarge','ecs.g6.16xlarge',
  'ecs.g6a.large','ecs.g6a.xlarge','ecs.g6a.2xlarge','ecs.g6a.4xlarge','ecs.g6a.8xlarge','ecs.g6a.16xlarge',
  'ecs.g6e.large','ecs.g6e.xlarge','ecs.g6e.2xlarge','ecs.g6e.4xlarge','ecs.g6e.8xlarge','ecs.g6e.16xlarge',
  // 通用型 g5
  'ecs.g5.large','ecs.g5.xlarge','ecs.g5.2xlarge','ecs.g5.4xlarge','ecs.g5.8xlarge','ecs.g5.16xlarge',
  'ecs.g5ne.large','ecs.g5ne.xlarge','ecs.g5ne.2xlarge','ecs.g5ne.4xlarge','ecs.g5ne.8xlarge',
  // 计算型 c8i
  'ecs.c8i.large','ecs.c8i.xlarge','ecs.c8i.2xlarge','ecs.c8i.4xlarge','ecs.c8i.8xlarge','ecs.c8i.16xlarge','ecs.c8i.32xlarge',
  // 计算型 c8a
  'ecs.c8a.large','ecs.c8a.xlarge','ecs.c8a.2xlarge','ecs.c8a.4xlarge','ecs.c8a.8xlarge','ecs.c8a.16xlarge','ecs.c8a.32xlarge',
  // 计算型 c7
  'ecs.c7.large','ecs.c7.xlarge','ecs.c7.2xlarge','ecs.c7.4xlarge','ecs.c7.8xlarge','ecs.c7.16xlarge',
  'ecs.c7a.large','ecs.c7a.xlarge','ecs.c7a.2xlarge','ecs.c7a.4xlarge','ecs.c7a.8xlarge','ecs.c7a.16xlarge',
  // 计算型 c6
  'ecs.c6.large','ecs.c6.xlarge','ecs.c6.2xlarge','ecs.c6.4xlarge','ecs.c6.8xlarge','ecs.c6.16xlarge',
  'ecs.c6a.large','ecs.c6a.xlarge','ecs.c6a.2xlarge','ecs.c6a.4xlarge','ecs.c6a.8xlarge','ecs.c6a.16xlarge',
  'ecs.c6e.large','ecs.c6e.xlarge','ecs.c6e.2xlarge','ecs.c6e.4xlarge','ecs.c6e.8xlarge','ecs.c6e.16xlarge',
  // 计算型 c5
  'ecs.c5.large','ecs.c5.xlarge','ecs.c5.2xlarge','ecs.c5.4xlarge','ecs.c5.8xlarge','ecs.c5.16xlarge',
  // 内存型 r8i
  'ecs.r8i.large','ecs.r8i.xlarge','ecs.r8i.2xlarge','ecs.r8i.4xlarge','ecs.r8i.8xlarge','ecs.r8i.16xlarge','ecs.r8i.32xlarge',
  // 内存型 r8a
  'ecs.r8a.large','ecs.r8a.xlarge','ecs.r8a.2xlarge','ecs.r8a.4xlarge','ecs.r8a.8xlarge','ecs.r8a.16xlarge','ecs.r8a.32xlarge',
  // 内存型 r7
  'ecs.r7.large','ecs.r7.xlarge','ecs.r7.2xlarge','ecs.r7.4xlarge','ecs.r7.8xlarge','ecs.r7.16xlarge',
  'ecs.r7a.large','ecs.r7a.xlarge','ecs.r7a.2xlarge','ecs.r7a.4xlarge','ecs.r7a.8xlarge','ecs.r7a.16xlarge',
  'ecs.r7p.large','ecs.r7p.xlarge','ecs.r7p.2xlarge','ecs.r7p.4xlarge','ecs.r7p.8xlarge',
  // 内存型 r6
  'ecs.r6.large','ecs.r6.xlarge','ecs.r6.2xlarge','ecs.r6.4xlarge','ecs.r6.8xlarge','ecs.r6.16xlarge',
  'ecs.r6a.large','ecs.r6a.xlarge','ecs.r6a.2xlarge','ecs.r6a.4xlarge','ecs.r6a.8xlarge','ecs.r6a.16xlarge',
  'ecs.r6e.large','ecs.r6e.xlarge','ecs.r6e.2xlarge','ecs.r6e.4xlarge','ecs.r6e.8xlarge','ecs.r6e.16xlarge',
  // 内存型 r5
  'ecs.r5.large','ecs.r5.xlarge','ecs.r5.2xlarge','ecs.r5.4xlarge','ecs.r5.8xlarge','ecs.r5.16xlarge',
  // 高主频
  'ecs.hfc7.large','ecs.hfc7.xlarge','ecs.hfc7.2xlarge','ecs.hfc7.4xlarge','ecs.hfc7.8xlarge',
  'ecs.hfg7.large','ecs.hfg7.xlarge','ecs.hfg7.2xlarge','ecs.hfg7.4xlarge','ecs.hfg7.8xlarge',
  'ecs.hfr7.large','ecs.hfr7.xlarge','ecs.hfr7.2xlarge','ecs.hfr7.4xlarge','ecs.hfr7.8xlarge',
  // GPU 虚拟化型
  'ecs.sgn8ia-m2.xlarge','ecs.sgn8ia-m4.2xlarge','ecs.sgn8ia-m8.4xlarge','ecs.sgn8ia-m16.8xlarge','ecs.sgn8ia-m24.12xlarge','ecs.sgn8ia-m48.24xlarge',
  'ecs.sgn7i-vws-m2.xlarge','ecs.sgn7i-vws-m4.2xlarge','ecs.sgn7i-vws-m8.4xlarge','ecs.sgn7i-vws-m2s.xlarge','ecs.sgn7i-vws-m4s.2xlarge','ecs.sgn7i-vws-m8s.4xlarge',
  'ecs.vgn7i-vws-m4.xlarge','ecs.vgn7i-vws-m8.2xlarge','ecs.vgn7i-vws-m12.3xlarge','ecs.vgn7i-vws-m24.7xlarge',
  'ecs.vgn6i-m4-vws.xlarge','ecs.vgn6i-m8-vws.2xlarge','ecs.vgn6i-m16-vws.5xlarge',
  // GPU 计算型
  'ecs.gn9gc.4xlarge','ecs.gn9gc.8xlarge','ecs.gn9gc-2x.16xlarge','ecs.gn9gc-4x.32xlarge','ecs.gn9gc-8x.64xlarge',
  'ecs.gn8v.4xlarge','ecs.gn8v.6xlarge','ecs.gn8v-2x.8xlarge','ecs.gn8v-4x.8xlarge','ecs.gn8v-2x.12xlarge','ecs.gn8v-8x.16xlarge','ecs.gn8v-4x.24xlarge','ecs.gn8v-8x.48xlarge',
  'ecs.gn8is.2xlarge','ecs.gn8is.4xlarge','ecs.gn8is-2x.8xlarge','ecs.gn8is-4x.16xlarge','ecs.gn8is-8x.32xlarge',
  'ecs.gn7e-c16g1.4xlarge','ecs.gn7e-c16g1.8xlarge','ecs.gn7e-c16g1.16xlarge','ecs.gn7e-c16g1.32xlarge',
  'ecs.gn7i-c8g1.2xlarge','ecs.gn7i-c16g1.4xlarge','ecs.gn7i-c32g1.8xlarge','ecs.gn7i-c32g1.16xlarge','ecs.gn7i-c32g1.32xlarge','ecs.gn7i-c48g1.12xlarge','ecs.gn7i-c56g1.14xlarge','ecs.gn7i-2x.8xlarge','ecs.gn7i-4x.8xlarge','ecs.gn7i-4x.16xlarge','ecs.gn7i-8x.32xlarge','ecs.gn7i-8x.16xlarge',
  'ecs.gn7s-c8g1.2xlarge','ecs.gn7s-c16g1.4xlarge','ecs.gn7s-c32g1.8xlarge','ecs.gn7s-c32g1.16xlarge','ecs.gn7s-c32g1.32xlarge','ecs.gn7s-c48g1.12xlarge','ecs.gn7s-c56g1.14xlarge',
  'ecs.gn7-c12g1.3xlarge','ecs.gn7-c13g1.13xlarge','ecs.gn7-c13g1.26xlarge',
  'ecs.gn6i-c4g1.xlarge','ecs.gn6i-c8g1.2xlarge','ecs.gn6i-c16g1.4xlarge','ecs.gn6i-c24g1.6xlarge','ecs.gn6i-c40g1.10xlarge','ecs.gn6i-c24g1.12xlarge','ecs.gn6i-c24g1.24xlarge',
  'ecs.gn6e-c12g1.3xlarge','ecs.gn6e-c12g1.6xlarge','ecs.gn6e-c12g1.12xlarge','ecs.gn6e-c12g1.24xlarge',
  'ecs.gn6v-c8g1.2xlarge','ecs.gn6v-c8g1.4xlarge','ecs.gn6v-c8g1.8xlarge','ecs.gn6v-c8g1.16xlarge','ecs.gn6v-c10g1.20xlarge',
  // 本地SSD型
  'ecs.i4.large','ecs.i4.xlarge','ecs.i4.2xlarge','ecs.i4.4xlarge','ecs.i4.8xlarge','ecs.i4.16xlarge','ecs.i4.32xlarge',
  'ecs.i4g.large','ecs.i4g.xlarge','ecs.i4g.2xlarge','ecs.i4g.4xlarge','ecs.i4g.8xlarge','ecs.i4g.16xlarge','ecs.i4g.32xlarge',
  'ecs.i3.large','ecs.i3.xlarge','ecs.i3.2xlarge','ecs.i3.4xlarge','ecs.i3.8xlarge','ecs.i3.16xlarge',
  'ecs.i3g.large','ecs.i3g.xlarge','ecs.i3g.2xlarge','ecs.i3g.4xlarge','ecs.i3g.8xlarge','ecs.i3g.16xlarge',
  'ecs.i2.large','ecs.i2.xlarge','ecs.i2.2xlarge','ecs.i2.4xlarge','ecs.i2.8xlarge',
  'ecs.i2g.large','ecs.i2g.xlarge','ecs.i2g.2xlarge','ecs.i2g.4xlarge','ecs.i2g.8xlarge',
  // 大数据型
  'ecs.d3c.large','ecs.d3c.xlarge','ecs.d3c.2xlarge','ecs.d3c.4xlarge','ecs.d3c.8xlarge',
  'ecs.d3s.large','ecs.d3s.xlarge','ecs.d3s.2xlarge','ecs.d3s.4xlarge','ecs.d3s.8xlarge',
  'ecs.d2c.large','ecs.d2c.xlarge','ecs.d2c.2xlarge','ecs.d2c.4xlarge','ecs.d2c.8xlarge',
  'ecs.d2s.large','ecs.d2s.xlarge','ecs.d2s.2xlarge','ecs.d2s.4xlarge','ecs.d2s.8xlarge',
  // 突发型
  'ecs.t7.large','ecs.t7.xlarge','ecs.t7.2xlarge','ecs.t7.4xlarge',
  'ecs.t6.large','ecs.t6.xlarge','ecs.t6.2xlarge','ecs.t6.4xlarge',
  // 通用算力型
  'ecs.u1.large','ecs.u1.xlarge','ecs.u1.2xlarge','ecs.u1.4xlarge','ecs.u1.8xlarge',
] as const

export type InstanceType = (typeof ALL_INSTANCE_TYPES)[number]

// 实例规格详细信息
export interface InstanceSpec {
  cpu: number
  mem: number
  gpu: string
  gpuMem: string
  gpuCount: number
  /** 整卡(dedicated) / 分片共享(vGPU-1/6) / 共享CPU(shared-cpu) */
  gpuMode: 'dedicated' | 'vGPU' | 'shared-cpu'
  gpuFraction?: string   // "1/6", "1/4", etc.
  bandwidth: string
  pps: string
  nvlink: boolean
  nvlinkMax?: number     // 最大 NVLink 卡数
  mig: boolean
  architecture: string    // GPU 架构
}

export const INSTANCE_SPEC: Record<string, InstanceSpec> = {
  // ══ GPU 虚拟化型 ══
  'ecs.sgn8ia-m2.xlarge':       { cpu:4,   mem:16,  gpu:'Lovelace', gpuMem:'2 GB',   gpuCount:1, gpuMode:'vGPU', gpuFraction:'1/24', bandwidth:'2.5', pps:'100万',  nvlink:false, mig:false, architecture:'Lovelace' },
  'ecs.sgn8ia-m4.2xlarge':      { cpu:8,   mem:32,  gpu:'Lovelace', gpuMem:'4 GB',   gpuCount:1, gpuMode:'vGPU', gpuFraction:'1/12', bandwidth:'4',   pps:'160万',  nvlink:false, mig:false, architecture:'Lovelace' },
  'ecs.sgn8ia-m8.4xlarge':      { cpu:16,  mem:64,  gpu:'Lovelace', gpuMem:'8 GB',   gpuCount:1, gpuMode:'vGPU', gpuFraction:'1/6',  bandwidth:'7',   pps:'200万',  nvlink:false, mig:false, architecture:'Lovelace' },
  'ecs.sgn8ia-m16.8xlarge':     { cpu:32,  mem:128, gpu:'Lovelace', gpuMem:'16 GB',  gpuCount:1, gpuMode:'vGPU', gpuFraction:'1/3',  bandwidth:'10',  pps:'300万',  nvlink:false, mig:false, architecture:'Lovelace' },
  'ecs.sgn8ia-m24.12xlarge':    { cpu:48,  mem:192, gpu:'Lovelace', gpuMem:'24 GB',  gpuCount:1, gpuMode:'vGPU', gpuFraction:'1/2',  bandwidth:'16',  pps:'450万',  nvlink:false, mig:false, architecture:'Lovelace' },
  'ecs.sgn8ia-m48.24xlarge':    { cpu:96,  mem:384, gpu:'Lovelace', gpuMem:'48 GB',  gpuCount:1, gpuMode:'vGPU', gpuFraction:'1/1',  bandwidth:'32',  pps:'900万',  nvlink:false, mig:false, architecture:'Lovelace' },
  'ecs.sgn7i-vws-m2.xlarge':    { cpu:4,   mem:16,  gpu:'A10',      gpuMem:'24 GB',  gpuCount:1, gpuMode:'shared-cpu', gpuFraction:'1/12', bandwidth:'1.5/5', pps:'50万',  nvlink:false, mig:false, architecture:'Ampere' },
  'ecs.sgn7i-vws-m4.2xlarge':   { cpu:8,   mem:32,  gpu:'A10',      gpuMem:'24 GB',  gpuCount:1, gpuMode:'shared-cpu', gpuFraction:'1/6',  bandwidth:'2.6/10',pps:'100万',  nvlink:false, mig:false, architecture:'Ampere' },
  'ecs.sgn7i-vws-m8.4xlarge':   { cpu:16,  mem:64,  gpu:'A10',      gpuMem:'24 GB',  gpuCount:1, gpuMode:'shared-cpu', gpuFraction:'1/3',  bandwidth:'5/20',  pps:'200万',  nvlink:false, mig:false, architecture:'Ampere' },
  'ecs.vgn7i-vws-m4.xlarge':    { cpu:4,   mem:30,  gpu:'A10',      gpuMem:'24 GB',  gpuCount:1, gpuMode:'vGPU', gpuFraction:'1/6',  bandwidth:'3',   pps:'100万',  nvlink:false, mig:false, architecture:'Ampere' },
  'ecs.vgn7i-vws-m8.2xlarge':   { cpu:10,  mem:62,  gpu:'A10',      gpuMem:'24 GB',  gpuCount:1, gpuMode:'vGPU', gpuFraction:'1/3',  bandwidth:'5',   pps:'200万',  nvlink:false, mig:false, architecture:'Ampere' },
  'ecs.vgn7i-vws-m12.3xlarge':  { cpu:14,  mem:93,  gpu:'A10',      gpuMem:'24 GB',  gpuCount:1, gpuMode:'vGPU', gpuFraction:'1/2',  bandwidth:'8',   pps:'300万',  nvlink:false, mig:false, architecture:'Ampere' },
  'ecs.vgn7i-vws-m24.7xlarge':  { cpu:30,  mem:186, gpu:'A10',      gpuMem:'24 GB',  gpuCount:1, gpuMode:'vGPU', gpuFraction:'1/1',  bandwidth:'16',  pps:'600万',  nvlink:false, mig:false, architecture:'Ampere' },
  'ecs.vgn6i-m4-vws.xlarge':    { cpu:4,   mem:23,  gpu:'T4',       gpuMem:'16 GB',  gpuCount:1, gpuMode:'vGPU', gpuFraction:'1/4',  bandwidth:'2',   pps:'50万',   nvlink:false, mig:false, architecture:'Turing' },
  'ecs.vgn6i-m8-vws.2xlarge':   { cpu:10,  mem:46,  gpu:'T4',       gpuMem:'16 GB',  gpuCount:1, gpuMode:'vGPU', gpuFraction:'1/2',  bandwidth:'4',   pps:'80万',   nvlink:false, mig:false, architecture:'Turing' },
  'ecs.vgn6i-m16-vws.5xlarge':  { cpu:20,  mem:92,  gpu:'T4',       gpuMem:'16 GB',  gpuCount:1, gpuMode:'vGPU', gpuFraction:'1/1',  bandwidth:'7.5', pps:'120万',  nvlink:false, mig:false, architecture:'Turing' },

  // ══ GPU 计算型 (独享) ══
  'ecs.gn9gc.4xlarge':          { cpu:16,  mem:128,  gpu:'Blackwell', gpuMem:'72 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'16',  pps:'360万',  nvlink:false, mig:false, architecture:'Blackwell' },
  'ecs.gn9gc.8xlarge':          { cpu:32,  mem:192,  gpu:'Blackwell', gpuMem:'72 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'32',  pps:'750万',  nvlink:false, mig:false, architecture:'Blackwell' },
  'ecs.gn9gc-2x.16xlarge':      { cpu:64,  mem:384,  gpu:'Blackwell', gpuMem:'72 GB',  gpuCount:2, gpuMode:'dedicated', bandwidth:'65',  pps:'1500万', nvlink:true,  nvlinkMax:8, mig:false, architecture:'Blackwell' },
  'ecs.gn9gc-4x.32xlarge':      { cpu:128, mem:768,  gpu:'Blackwell', gpuMem:'72 GB',  gpuCount:4, gpuMode:'dedicated', bandwidth:'131', pps:'3000万', nvlink:true,  nvlinkMax:8, mig:false, architecture:'Blackwell' },
  'ecs.gn9gc-8x.64xlarge':      { cpu:256, mem:1536, gpu:'Blackwell', gpuMem:'72 GB',  gpuCount:8, gpuMode:'dedicated', bandwidth:'204', pps:'3000万', nvlink:true,  nvlinkMax:8, mig:false, architecture:'Blackwell' },
  'ecs.gn8v.4xlarge':           { cpu:16,  mem:96,   gpu:'H100',      gpuMem:'96 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'12',  pps:'-',     nvlink:true,  nvlinkMax:8, mig:false, architecture:'Hopper' },
  'ecs.gn8v.6xlarge':           { cpu:24,  mem:128,  gpu:'H100',      gpuMem:'96 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'15',  pps:'-',     nvlink:true,  nvlinkMax:8, mig:false, architecture:'Hopper' },
  'ecs.gn8v-2x.8xlarge':        { cpu:32,  mem:192,  gpu:'H100',      gpuMem:'96 GB',  gpuCount:2, gpuMode:'dedicated', bandwidth:'20',  pps:'-',     nvlink:true,  nvlinkMax:8, mig:false, architecture:'Hopper' },
  'ecs.gn8v-4x.8xlarge':        { cpu:32,  mem:384,  gpu:'H100',      gpuMem:'96 GB',  gpuCount:4, gpuMode:'dedicated', bandwidth:'20',  pps:'-',     nvlink:true,  nvlinkMax:8, mig:false, architecture:'Hopper' },
  'ecs.gn8v-2x.12xlarge':       { cpu:48,  mem:256,  gpu:'H100',      gpuMem:'96 GB',  gpuCount:2, gpuMode:'dedicated', bandwidth:'25',  pps:'-',     nvlink:true,  nvlinkMax:8, mig:false, architecture:'Hopper' },
  'ecs.gn8v-8x.16xlarge':       { cpu:64,  mem:768,  gpu:'H100',      gpuMem:'96 GB',  gpuCount:8, gpuMode:'dedicated', bandwidth:'32',  pps:'-',     nvlink:true,  nvlinkMax:8, mig:false, architecture:'Hopper' },
  'ecs.gn8v-4x.24xlarge':       { cpu:96,  mem:512,  gpu:'H100',      gpuMem:'96 GB',  gpuCount:4, gpuMode:'dedicated', bandwidth:'50',  pps:'-',     nvlink:true,  nvlinkMax:8, mig:false, architecture:'Hopper' },
  'ecs.gn8v-8x.48xlarge':       { cpu:192, mem:1024, gpu:'H100',      gpuMem:'96 GB',  gpuCount:8, gpuMode:'dedicated', bandwidth:'100', pps:'-',     nvlink:true,  nvlinkMax:8, mig:false, architecture:'Hopper' },
  'ecs.gn8is.2xlarge':          { cpu:8,   mem:64,   gpu:'L20',       gpuMem:'48 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'8',   pps:'-',     nvlink:false, mig:false, architecture:'Ada Lovelace' },
  'ecs.gn8is.4xlarge':          { cpu:16,  mem:128,  gpu:'L20',       gpuMem:'48 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'16',  pps:'-',     nvlink:false, mig:false, architecture:'Ada Lovelace' },
  'ecs.gn8is-2x.8xlarge':       { cpu:32,  mem:256,  gpu:'L20',       gpuMem:'48 GB',  gpuCount:2, gpuMode:'dedicated', bandwidth:'32',  pps:'-',     nvlink:false, mig:false, architecture:'Ada Lovelace' },
  'ecs.gn8is-4x.16xlarge':      { cpu:64,  mem:512,  gpu:'L20',       gpuMem:'48 GB',  gpuCount:4, gpuMode:'dedicated', bandwidth:'64',  pps:'-',     nvlink:false, mig:false, architecture:'Ada Lovelace' },
  'ecs.gn8is-8x.32xlarge':      { cpu:128, mem:1024, gpu:'L20',       gpuMem:'48 GB',  gpuCount:8, gpuMode:'dedicated', bandwidth:'100', pps:'-',     nvlink:false, mig:false, architecture:'Ada Lovelace' },
  'ecs.gn7e-c16g1.4xlarge':     { cpu:16,  mem:125,  gpu:'A100',      gpuMem:'80 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'8',   pps:'300万',  nvlink:true,  nvlinkMax:8, mig:false, architecture:'Ampere' },
  'ecs.gn7e-c16g1.8xlarge':     { cpu:32,  mem:250,  gpu:'A100',      gpuMem:'80 GB',  gpuCount:2, gpuMode:'dedicated', bandwidth:'16',  pps:'600万',  nvlink:true,  nvlinkMax:8, mig:false, architecture:'Ampere' },
  'ecs.gn7e-c16g1.16xlarge':    { cpu:64,  mem:500,  gpu:'A100',      gpuMem:'80 GB',  gpuCount:4, gpuMode:'dedicated', bandwidth:'32',  pps:'1200万', nvlink:true,  nvlinkMax:8, mig:false, architecture:'Ampere' },
  'ecs.gn7e-c16g1.32xlarge':    { cpu:128, mem:1000, gpu:'A100',      gpuMem:'80 GB',  gpuCount:8, gpuMode:'dedicated', bandwidth:'64',  pps:'2400万', nvlink:true,  nvlinkMax:8, mig:false, architecture:'Ampere' },
  'ecs.gn7i-c8g1.2xlarge':      { cpu:8,   mem:30,   gpu:'A10',       gpuMem:'24 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'16',  pps:'160万',  nvlink:false, mig:false, architecture:'Ampere' },
  'ecs.gn7i-c16g1.4xlarge':     { cpu:16,  mem:60,   gpu:'A10',       gpuMem:'24 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'16',  pps:'300万',  nvlink:false, mig:false, architecture:'Ampere' },
  'ecs.gn7i-c32g1.8xlarge':     { cpu:32,  mem:188,  gpu:'A10',       gpuMem:'24 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'16',  pps:'600万',  nvlink:false, mig:false, architecture:'Ampere' },
  'ecs.gn7i-c32g1.16xlarge':    { cpu:64,  mem:376,  gpu:'A10',       gpuMem:'24 GB',  gpuCount:2, gpuMode:'dedicated', bandwidth:'32',  pps:'1200万', nvlink:false, mig:false, architecture:'Ampere' },
  'ecs.gn7i-c32g1.32xlarge':    { cpu:128, mem:752,  gpu:'A10',       gpuMem:'24 GB',  gpuCount:4, gpuMode:'dedicated', bandwidth:'64',  pps:'2400万', nvlink:false, mig:false, architecture:'Ampere' },
  'ecs.gn7i-8x.32xlarge':       { cpu:128, mem:512,  gpu:'A10',       gpuMem:'24 GB',  gpuCount:8, gpuMode:'dedicated', bandwidth:'64',  pps:'2400万', nvlink:false, mig:false, architecture:'Ampere' },
  'ecs.gn7s-c8g1.2xlarge':      { cpu:8,   mem:60,   gpu:'A30',       gpuMem:'24 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'16',  pps:'160万',  nvlink:false, mig:true,  architecture:'Ampere' },
  'ecs.gn7s-c32g1.8xlarge':     { cpu:32,  mem:250,  gpu:'A30',       gpuMem:'24 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'16',  pps:'600万',  nvlink:false, mig:true,  architecture:'Ampere' },
  'ecs.gn7s-c32g1.32xlarge':    { cpu:128, mem:1000, gpu:'A30',       gpuMem:'24 GB',  gpuCount:4, gpuMode:'dedicated', bandwidth:'64',  pps:'2400万', nvlink:false, mig:true,  architecture:'Ampere' },
  'ecs.gn7-c12g1.3xlarge':      { cpu:12,  mem:94,   gpu:'-',         gpuMem:'40 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'4',   pps:'250万',  nvlink:false, mig:false, architecture:'-' },
  'ecs.gn7-c13g1.13xlarge':     { cpu:52,  mem:378,  gpu:'-',         gpuMem:'40 GB',  gpuCount:4, gpuMode:'dedicated', bandwidth:'16',  pps:'900万',  nvlink:false, mig:false, architecture:'-' },
  'ecs.gn7-c13g1.26xlarge':     { cpu:104, mem:756,  gpu:'-',         gpuMem:'40 GB',  gpuCount:8, gpuMode:'dedicated', bandwidth:'30',  pps:'1800万', nvlink:false, mig:false, architecture:'-' },
  'ecs.gn6i-c4g1.xlarge':       { cpu:4,   mem:15,   gpu:'T4',        gpuMem:'16 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'4',   pps:'250万',  nvlink:false, mig:false, architecture:'Turing' },
  'ecs.gn6i-c8g1.2xlarge':      { cpu:8,   mem:31,   gpu:'T4',        gpuMem:'16 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'5',   pps:'250万',  nvlink:false, mig:false, architecture:'Turing' },
  'ecs.gn6i-c16g1.4xlarge':     { cpu:16,  mem:62,   gpu:'T4',        gpuMem:'16 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'6',   pps:'250万',  nvlink:false, mig:false, architecture:'Turing' },
  'ecs.gn6i-c24g1.6xlarge':     { cpu:24,  mem:93,   gpu:'T4',        gpuMem:'16 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'7.5', pps:'250万',  nvlink:false, mig:false, architecture:'Turing' },
  'ecs.gn6i-c24g1.24xlarge':    { cpu:96,  mem:372,  gpu:'T4',        gpuMem:'16 GB',  gpuCount:4, gpuMode:'dedicated', bandwidth:'30',  pps:'450万',  nvlink:false, mig:false, architecture:'Turing' },
  'ecs.gn6e-c12g1.3xlarge':     { cpu:12,  mem:92,   gpu:'V100',      gpuMem:'32 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'5',   pps:'80万',   nvlink:true,  nvlinkMax:8, mig:false, architecture:'Volta' },
  'ecs.gn6e-c12g1.12xlarge':    { cpu:48,  mem:368,  gpu:'V100',      gpuMem:'32 GB',  gpuCount:4, gpuMode:'dedicated', bandwidth:'16',  pps:'240万',  nvlink:true,  nvlinkMax:8, mig:false, architecture:'Volta' },
  'ecs.gn6e-c12g1.24xlarge':    { cpu:96,  mem:736,  gpu:'V100',      gpuMem:'32 GB',  gpuCount:8, gpuMode:'dedicated', bandwidth:'32',  pps:'450万',  nvlink:true,  nvlinkMax:8, mig:false, architecture:'Volta' },
  'ecs.gn6v-c8g1.2xlarge':      { cpu:8,   mem:32,   gpu:'V100',      gpuMem:'16 GB',  gpuCount:1, gpuMode:'dedicated', bandwidth:'2.5', pps:'80万',   nvlink:true,  nvlinkMax:8, mig:false, architecture:'Volta' },
  'ecs.gn6v-c8g1.8xlarge':      { cpu:32,  mem:128,  gpu:'V100',      gpuMem:'16 GB',  gpuCount:4, gpuMode:'dedicated', bandwidth:'10',  pps:'200万',  nvlink:true,  nvlinkMax:8, mig:false, architecture:'Volta' },
  'ecs.gn6v-c8g1.16xlarge':     { cpu:64,  mem:256,  gpu:'V100',      gpuMem:'16 GB',  gpuCount:8, gpuMode:'dedicated', bandwidth:'20',  pps:'250万',  nvlink:true,  nvlinkMax:8, mig:false, architecture:'Volta' },
  'ecs.gn6v-c10g1.20xlarge':    { cpu:82,  mem:336,  gpu:'V100',      gpuMem:'16 GB',  gpuCount:8, gpuMode:'dedicated', bandwidth:'35',  pps:'450万',  nvlink:true,  nvlinkMax:8, mig:false, architecture:'Volta' },
}

/** 根据分类标签筛选实例规格 */
export function filterInstanceTypes(tag: string | null): readonly string[] {
  if (!tag) return ALL_INSTANCE_TYPES as readonly string[]
  const cat = INSTANCE_CATEGORIES.find(c => c.tag === tag)
  if (!cat) return ALL_INSTANCE_TYPES as readonly string[]
  return (ALL_INSTANCE_TYPES as readonly string[]).filter(t =>
    cat.families.some(f => t.includes(`.${f}.`) || t.includes(`.${f}-`))
  )
}

/** 查询某个实例规格所属分类标签 */
export function instanceTag(t: string): string {
  for (const cat of INSTANCE_CATEGORIES) {
    for (const fam of cat.families) {
      if (t.includes(`.${fam}.`) || t.includes(`.${fam}-`)) return cat.tag
    }
  }
  return '其他'
}

// ═══════════ Field Library ═══════════

const ALIBABA_COMMON: readonly FieldNode[] = [
  // ── GPU & 实例规格 ──
  { key: 'instanceType', group: 'gpu', type: 'string', label: '实例规格', description: 'ECS 实例规格族。GPU > 0 时过滤为 gn* 系列', eciParam: 'InstanceType', validation: { kind: 'enum', values: ALL_INSTANCE_TYPES as unknown as string[] }, visibility: [], required: [], locked: [{ op: 'gt', field: 'resourceSpec.gpu', value: 0 }], order: 1 },
  { key: 'cpuArchitecture', group: 'gpu',   type: 'string',  label: 'CPU 架构',    description: '实例 CPU 架构。GPU > 0 时锁定 AMD64', eciParam: 'CpuArchitecture', validation: { kind: 'enum', values: ['AMD64','Arm64'] }, defaultValue: 'AMD64', visibility: [], required: [], locked: [{ op: 'gt', field: 'resourceSpec.gpu', value: 0 }], order: 2 },
  { key: 'osType',          group: 'gpu',   type: 'string',  label: '操作系统',     description: '实例操作系统类型', eciParam: 'OsType', validation: { kind: 'enum', values: ['Linux','Windows'] }, defaultValue: 'Linux', visibility: [], required: [], locked: [], order: 3 },
  { key: 'gpuType',              group: 'gpu', type: 'string',  label: 'GPU 型号',           description: 'GPU 设备型号标识', eciParam: 'GpuType',              defaultValue: 'nvidia.com/gpu', validation: { kind: 'enum', values: ['nvidia.com/gpu','nvidia.com/t4','nvidia.com/a10','nvidia.com/a30','nvidia.com/a100','nvidia.com/v100','nvidia.com/l20','nvidia.com/l40s'] }, visibility: [{ op: 'gt', field: 'resourceSpec.gpu', value: 0 }], required: [], locked: [], order: 4 },
  { key: 'gpuCount',             group: 'gpu', type: 'number',  label: 'GPU 数量',           description: '实例 GPU 卡数量, min 1 max 8', eciParam: 'GpuCount',  defaultValue: 1, validation: { kind: 'range', min: 1, max: 8 }, visibility: [{ op: 'gt', field: 'resourceSpec.gpu', value: 0 }], required: [], locked: [], order: 5 },
  { key: 'nvidiaVisibleDevices', group: 'gpu', type: 'string',  label: '可见 GPU 设备',       description: '容器内 NVIDIA_VISIBLE_DEVICES 值', eciParam: 'NvidiaVisibleDevices', defaultValue: 'all', validation: { kind: 'enum', values: ['all','0','1','2','3','0,1','2,3'] }, visibility: [{ op: 'gt', field: 'resourceSpec.gpu', value: 0 }], required: [], locked: [], order: 6 },

  // ── 竞价实例 ──
  { key: 'spotStrategy',    group: 'spot',  type: 'string',  label: '竞价策略',     description: 'NoSpot 不竞价 / SpotAsPriceGo 系统出价 / SpotWithPriceLimit 限价', eciParam: 'SpotStrategy', validation: { kind: 'enum', values: ['NoSpot','SpotAsPriceGo','SpotWithPriceLimit'] }, defaultValue: 'NoSpot', visibility: [], required: [], locked: [], order: 10 },
  { key: 'spotPriceLimit',  group: 'spot',  type: 'number',  label: '竞价价格上限',  description: '竞价实例最高价格 (元/小时)', eciParam: 'SpotPriceLimit', validation: { kind: 'range', min: 0 }, visibility: [{ op: 'eq', field: 'spotStrategy', value: 'SpotWithPriceLimit' }], required: [{ op: 'eq', field: 'spotStrategy', value: 'SpotWithPriceLimit' }], locked: [], order: 11 },
  { key: 'spotDuration',    group: 'spot',  type: 'number',  label: '竞价持续时间',  description: '竞价实例保护时长 (小时)', eciParam: 'SpotDuration', visibility: [{ op: 'in', field: 'spotStrategy', value: ['SpotAsPriceGo','SpotWithPriceLimit'] }], required: [], locked: [], order: 12 },
  { key: 'strictSpot',      group: 'spot',  type: 'boolean', label: '严格竞价模式',  description: '启用后资源不足不回落按量', eciParam: 'StrictSpot', defaultValue: false, visibility: [{ op: 'neq', field: 'spotStrategy', value: 'NoSpot' }], required: [], locked: [], order: 13 },

  // ── 网络 — EIP ──
  { key: 'autoCreateEip',             group: 'network', type: 'boolean', label: '自动创建 EIP',        description: '自动创建并绑定弹性公网 IP', eciParam: 'AutoCreateEip', defaultValue: false, visibility: [{ op: 'empty', field: 'eipInstanceId' }],                                                              required: [], locked: [], order: 20 },
  { key: 'eipBandwidth',              group: 'network', type: 'number',  label: 'EIP 带宽',             description: '弹性公网 IP 带宽上限 (Mbps), 1–100', eciParam: 'EipBandwidth', defaultValue: 5, validation: { kind: 'range', min: 1, max: 100 }, visibility: [{ op: 'eq', field: 'autoCreateEip', value: true }, { op: 'empty', field: 'eipInstanceId' }], required: [], locked: [], order: 21 },
  { key: 'eipISP',                    group: 'network', type: 'string',  label: 'EIP 线路类型',         description: '弹性公网 IP 的 ISP 类型', eciParam: 'EipISP', defaultValue: 'BGP', validation: { kind: 'enum', values: ['BGP','BGP_PRO'] },        visibility: [{ op: 'eq', field: 'autoCreateEip', value: true }, { op: 'empty', field: 'eipInstanceId' }], required: [], locked: [], order: 22 },
  { key: 'eipInstanceId',             group: 'network', type: 'string',  label: '已有 EIP 实例 ID',     description: '绑定已有弹性公网 IP', eciParam: 'EipInstanceId',                                                                              visibility: [{ op: 'neq', field: 'autoCreateEip', value: true }],                                                           required: [], locked: [], order: 23 },
  { key: 'eipCommonBandwidthPackage', group: 'network', type: 'string',  label: '共享带宽包 ID',        description: 'EIP 加入共享带宽包', eciParam: 'EipCommonBandwidthPackage',                                                                   visibility: [],                                                                                                              required: [], locked: [], order: 24 },

  // ── 网络 — 带宽 & 固定 IP ──
  { key: 'ingressBandwidth',    group: 'network', type: 'number',  label: '入方向带宽',        description: '公网入方向带宽上限 (Mbps)', eciParam: 'IngressBandwidth', defaultValue: 100, validation: { kind: 'range', min: 0, max: 10000 }, visibility: [], required: [], locked: [], order: 30 },
  { key: 'egressBandwidth',     group: 'network', type: 'number',  label: '出方向带宽',        description: '公网出方向带宽上限 (Mbps)', eciParam: 'EgressBandwidth',  defaultValue: 100, validation: { kind: 'range', min: 0, max: 10000 }, visibility: [], required: [], locked: [], order: 31 },
  { key: 'fixedIp',             group: 'network', type: 'string',  label: '固定 IP',           description: '指定固定内网 IP 地址', eciParam: 'FixedIp',                                                              visibility: [], required: [], locked: [], order: 32 },
  { key: 'fixedIpRetainHour',   group: 'network', type: 'number',  label: '固定 IP 保留时长',   description: '实例释放后保留时长 (小时)', eciParam: 'FixedIpRetainHour', defaultValue: 48,                                               visibility: [{ op: 'exists', field: 'fixedIp' }], required: [], locked: [], order: 33 },
  { key: 'ipv6AddressCount',    group: 'network', type: 'number',  label: 'IPv6 地址数',       description: '实例分配的 IPv6 地址数量', eciParam: 'Ipv6AddressCount',                                                       visibility: [], required: [], locked: [], order: 34 },

  // ── 存储 & 镜像 ──
  { key: 'autoMatchImageCache',       group: 'storage', type: 'boolean', label: '自动匹配镜像缓存',  description: '自动匹配已有镜像缓存以加速启动', eciParam: 'AutoMatchImageCache', defaultValue: false, visibility: [], required: [], locked: [], order: 40 },
  { key: 'imageSnapshotId',           group: 'storage', type: 'string',  label: '镜像快照 ID',       description: '指定镜像缓存快照 ID', eciParam: 'ImageSnapshotId',                                   visibility: [], required: [], locked: [], order: 41 },
  { key: 'ephemeralStorage',          group: 'storage', type: 'number',  label: '临时存储',           description: '临时存储大小 (GiB)', eciParam: 'EphemeralStorage',                                     visibility: [], required: [], locked: [], order: 42 },
  { key: 'imageRegistryCredentials',  group: 'storage', type: 'object',  label: '私有仓库凭据',       description: '拉取私有镜像仓库的认证信息', eciParam: 'ImageRegistryCredentials',                       visibility: [], required: [], locked: [], order: 43 },

  // ── 调度 ──
  { key: 'scheduleStrategy',        group: 'schedule', type: 'string',  label: '调度策略',         description: '多子网时的调度策略', eciParam: 'ScheduleStrategy',        defaultValue: 'VSwitchOrdered', validation: { kind: 'enum', values: ['VSwitchOrdered','VSwitchRandom'] }, visibility: [{ op: 'gt', field: 'subnetIds.length', value: 1 }], required: [], locked: [], order: 50 },
  { key: 'cpuOptionsCore',          group: 'schedule', type: 'number',  label: 'CPU 核心数',       description: '指定 vCPU 核心数（仅特定规格）', eciParam: 'CpuOptionsCore',                           visibility: [], required: [], locked: [], order: 51 },
  { key: 'cpuOptionsThreadsPerCore',group: 'schedule', type: 'number',  label: '每核心线程数',      description: '关闭超线程时设为 1, 默认 2', eciParam: 'CpuOptionsThreadsPerCore', defaultValue: 2, validation: { kind: 'range', min: 1, max: 2 }, visibility: [], required: [], locked: [], order: 52 },

  // ── 系统 ──
  { key: 'hostName',               group: 'system', type: 'string', label: '主机名',            description: '实例 hostname', eciParam: 'HostName',                visibility: [], required: [], locked: [], order: 60 },
  { key: 'dnsPolicy',              group: 'system', type: 'string', label: 'DNS 策略',          description: '实例 DNS 解析策略', eciParam: 'DnsPolicy',           defaultValue: 'Default', validation: { kind: 'enum', values: ['Default','ClusterFirst','None'] }, visibility: [], required: [], locked: [], order: 61 },
  { key: 'activeDeadlineSeconds',  group: 'system', type: 'number', label: '活跃期限',          description: '实例最长运行时间 (秒)', eciParam: 'ActiveDeadlineSeconds',                           visibility: [], required: [], locked: [], order: 62 },
  { key: 'ramRoleName',            group: 'system', type: 'string', label: 'RAM 角色',          description: '绑定到实例的 RAM 角色名称', eciParam: 'RamRoleName',                                  visibility: [], required: [], locked: [], order: 63 },
  { key: 'resourceGroupId',        group: 'system', type: 'string', label: '资源组 ID',         description: '阿里云资源组 ID', eciParam: 'ResourceGroupId',                                       visibility: [], required: [], locked: [], order: 64 },
  { key: 'corePattern',            group: 'system', type: 'string', label: 'Core Dump 路径',    description: '容器内 core dump 文件路径', eciParam: 'CorePattern',                                  visibility: [], required: [], locked: [], order: 65 },
] as const

export const FIELD_LIBRARY: readonly VendorGroup[] = [
  { provider: 'alibaba', label: '阿里云 ECI', description: '阿里云 ECI 容器实例扩展字段，GPU 相关字段在 resourceSpec.gpu > 0 时自动展示', fields: ALIBABA_COMMON },
] as const

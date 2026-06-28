// 从 en.ts 提取所有 i18n key 路径，生成 I18nKey union type 和 I18nMessages interface
// 用法：node scripts/extract-i18n-keys.mjs

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function extractKeys(obj, prefix = '') {
  const keys = []
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') {
      keys.push(fullKey)
    } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      keys.push(...extractKeys(v, fullKey))
    }
  }
  return keys
}

function buildType(obj, indent = 0) {
  const sp = '  '.repeat(indent)
  const lines = []
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      lines.push(sp + k + ': string;')
    } else if (typeof v === 'object' && v !== null) {
      lines.push(sp + k + ': {')
      lines.push(buildType(v, indent + 1))
      lines.push(sp + '};')
    }
  }
  return lines.join('\n')
}

const enPath = resolve(root, 'src/i18n/locales/en.ts')
const enContent = readFileSync(enPath, 'utf-8')

// en.ts 格式: const messages = { ... } satisfies I18nMessages
const match = enContent.match(/const\s+messages\s*=\s*(\{[\s\S]*?\})\s*satisfies/)
if (!match) {
  console.error('Failed to parse en.ts — expected "const messages = { ... } satisfies I18nMessages"')
  process.exit(1)
}
const obj = new Function(`return ${match[1]}`)()
const keys = extractKeys(obj)

// 生成 keys.ts
const keyLines = ['// Auto-generated from en.ts — DO NOT EDIT BY HAND',
  '// Run: node scripts/extract-i18n-keys.mjs',
  '',
  `// Total keys: ${keys.length}`,
  'export type I18nKey =',
  ...keys.map((k, i) => `  | '${k}'${i === keys.length - 1 ? ';' : ''}`),
  '', '',
]
writeFileSync(resolve(root, 'src/i18n/keys.ts'), keyLines.join('\n'))
console.log(`Generated src/i18n/keys.ts with ${keys.length} keys`)

// 生成 messages.d.ts
const nested = buildType(obj, 1)
const msgOutput = '// Auto-generated i18n type — DO NOT EDIT BY HAND\n// Run: node scripts/extract-i18n-keys.mjs\n\ninterface I18nMessages {\n' + nested + '\n}\n'
writeFileSync(resolve(root, 'src/i18n/messages.d.ts'), msgOutput)
console.log('Generated src/i18n/messages.d.ts')

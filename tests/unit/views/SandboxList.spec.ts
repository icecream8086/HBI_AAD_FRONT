import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import zhCN from '../../../src/i18n/locales/zh-CN'

vi.mock('../../../src/api', () => ({
  api: {
    sandboxes: {
      apiSandboxesGet: vi.fn(),
      apiSandboxesIdDelete: vi.fn(),
    },
    extract: vi.fn(),
  },
}))

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': zhCN, en: {} },
})

describe('SandboxList.vue', () => {
  it('renders successfully', async () => {
    const SandboxList = await import('../../../src/views/sandbox/SandboxList.vue')
    const wrapper = shallowMount(SandboxList.default, {
      global: {
        plugins: [i18n],
        stubs: {
          'el-table': { template: '<div><slot /></div>' },
          'el-table-column': { template: '<div />' },
          'el-tag': { template: '<span><slot /></span>' },
          'el-button': { template: '<button><slot /></button>' },
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
  })
})

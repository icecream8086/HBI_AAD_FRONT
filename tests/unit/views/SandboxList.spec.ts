import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('../../../src/api', () => ({
  api: {
    sandboxes: {
      apiSandboxesGet: vi.fn(),
      apiSandboxesIdDelete: vi.fn(),
    },
    extract: vi.fn(),
  },
}))

describe('SandboxList.vue', () => {
  it('renders successfully', async () => {
    const SandboxList = await import('../../../src/views/sandbox/SandboxList.vue')
    const wrapper = shallowMount(SandboxList.default, {
      global: {
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

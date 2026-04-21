import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import ManagementSearchBar from '@/components/common/ManagementSearchBar.vue'

describe('management search bar', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces model updates before publishing the search query', async () => {
    vi.useFakeTimers()

    const wrapper = mount({
      components: { ManagementSearchBar },
      setup() {
        const query = ref('')
        return {
          query,
          resultCount: 2,
        }
      },
      template: `
        <ManagementSearchBar
          v-model="query"
          placeholder="Search users"
          :result-count="resultCount"
        />
      `,
    })

    await wrapper.find('input.live-search-input').setValue('Ada')

    expect(wrapper.vm.query).toBe('')
    expect(wrapper.find('.search-spinner').exists()).toBe(true)

    await vi.advanceTimersByTimeAsync(300)
    await nextTick()

    expect(wrapper.vm.query).toBe('Ada')
    expect(wrapper.text()).toContain('2 results found')
  })

  it('clears both the local input and published query', async () => {
    vi.useFakeTimers()

    const wrapper = mount({
      components: { ManagementSearchBar },
      setup() {
        const query = ref('')
        return {
          query,
          resultCount: 1,
        }
      },
      template: `
        <ManagementSearchBar
          v-model="query"
          placeholder="Search courses"
          :result-count="resultCount"
        />
      `,
    })

    await wrapper.find('input.live-search-input').setValue('Course')
    await vi.advanceTimersByTimeAsync(300)
    await nextTick()

    await wrapper.find('button.clear-search-btn').trigger('click')
    await nextTick()

    expect(wrapper.vm.query).toBe('')
    expect((wrapper.find('input.live-search-input').element as HTMLInputElement).value).toBe('')
  })
})

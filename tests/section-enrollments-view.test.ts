import type { EnrollmentDto } from '@/api/enrollments'
import type { EntityId } from '@/types'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import SectionEnrollmentsView from '@/views/SectionEnrollmentsView.vue'

const route = reactive({
  params: {
    sectionId: '1',
  },
})

const push = vi.fn()
const getSection = vi.fn()
const fetchSectionStudents = vi.fn()
const dropStudent = vi.fn()
const reenrollStudent = vi.fn()
const fetchUsers = vi.fn()

const sectionStore = {
  getSection,
  loading: false,
  error: '',
}

const enrollmentStore = {
  fetchSectionStudents,
  dropStudent,
  reenrollStudent,
  getSectionStudents: [] as EnrollmentDto[],
  isLoading: false,
  error: '',
}

const userStore = {
  fetchUsers,
  students: [],
  loading: false,
}

const mountedWrappers: Array<ReturnType<typeof mount>> = []

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push }),
}))

vi.mock('@/stores/sectionStore', () => ({
  useSectionStore: () => sectionStore,
}))

vi.mock('@/stores/enrollmentStore', () => ({
  useEnrollmentStore: () => enrollmentStore,
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => userStore,
}))

vi.mock('@/components/common/BaseButton.vue', () => ({
  default: {
    name: 'BaseButton',
    props: ['variant', 'icon'],
    template: '<button><slot /></button>',
  },
}))

function mountView() {
  const wrapper = mount(SectionEnrollmentsView, {
    global: {
      stubs: {
        AddEnrollmentModal: {
          name: 'AddEnrollmentModal',
          props: ['section'],
          template: `
            <div data-test="add-enrollment-modal">
              <button class="emit-success" @click="$emit('success')">emit-success</button>
              <button class="emit-error" @click="$emit('error', 'Modal error')">emit-error</button>
              <button class="emit-close" @click="$emit('close')">emit-close</button>
            </div>
          `,
        },
        ConfirmationModal: {
          name: 'ConfirmationModal',
          props: ['show', 'title', 'message', 'confirmText', 'cancelText'],
          template: `
            <div v-if="show" data-test="confirmation-modal">
              <p>{{ message }}</p>
              <button data-test="modal-confirm" @click="$emit('confirm')">{{ confirmText }}</button>
              <button data-test="modal-cancel" @click="$emit('cancel')">{{ cancelText }}</button>
            </div>
          `,
        },
      },
    },
  })

  mountedWrappers.push(wrapper)
  return wrapper
}

describe('sectionEnrollmentsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    route.params.sectionId = '1'
    enrollmentStore.getSectionStudents = []
    getSection.mockResolvedValue({
      id: '1',
      name: 'Test Section',
    })
    fetchSectionStudents.mockResolvedValue([])
    dropStudent.mockResolvedValue(undefined)
    reenrollStudent.mockResolvedValue(undefined)
    fetchUsers.mockResolvedValue([])
  })

  afterEach(() => {
    while (mountedWrappers.length > 0) {
      mountedWrappers.pop()?.unmount()
    }
    vi.unstubAllGlobals()
  })

  it('navigates to /sections when back button is clicked', async () => {
    const wrapper = mountView()
    await flushPromises()

    const backButton = wrapper.find('.back-button')
    await backButton.trigger('click')

    expect(push).toHaveBeenCalledWith('/sections')
  })

  it('rejects invalid sectionId params and does not call data loaders', async () => {
    route.params.sectionId = ''

    const wrapper = mountView()
    await flushPromises()

    expect(getSection).not.toHaveBeenCalled()
    expect(fetchSectionStudents).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Invalid Link')
  })

  it('reloads section data when the sectionId route param changes', async () => {
    getSection
      .mockResolvedValueOnce({
        id: '1',
        name: 'Section One',
      })
      .mockResolvedValueOnce({
        id: '2',
        name: 'Section Two',
      })

    const wrapper = mountView()
    await flushPromises()

    expect(getSection).toHaveBeenNthCalledWith(1, '1')
    expect(fetchSectionStudents).toHaveBeenNthCalledWith(1, '1')
    expect(wrapper.text()).toContain('Section One')

    route.params.sectionId = '2'
    await flushPromises()

    expect(getSection).toHaveBeenNthCalledWith(2, '2')
    expect(fetchSectionStudents).toHaveBeenNthCalledWith(2, '2')
    expect(wrapper.text()).toContain('Section Two')
  })

  it('queues rapid sectionId changes and resolves to the latest section data', async () => {
    const firstSectionRequest = createDeferred<{ id: EntityId, name: string }>()
    const firstStudentsRequest = createDeferred<EnrollmentDto[]>()

    getSection
      .mockImplementationOnce(() => firstSectionRequest.promise)
      .mockResolvedValueOnce({
        id: '2',
        name: 'Section Two',
      })

    fetchSectionStudents
      .mockImplementationOnce(() => firstStudentsRequest.promise)
      .mockResolvedValueOnce([])

    const wrapper = mountView()
    await flushPromises()
    expect(getSection).toHaveBeenCalledTimes(1)

    route.params.sectionId = '2'
    await flushPromises()
    expect(getSection).toHaveBeenCalledTimes(1)

    firstSectionRequest.resolve({
      id: '1',
      name: 'Section One',
    })
    firstStudentsRequest.resolve([])

    await flushPromises()
    await flushPromises()

    expect(getSection).toHaveBeenCalledTimes(2)
    expect(getSection).toHaveBeenNthCalledWith(2, '2')
    expect(fetchSectionStudents).toHaveBeenNthCalledWith(2, '2')
    expect(wrapper.text()).toContain('Section Two')
  })

  it('filters enrolled students by the search query', async () => {
    enrollmentStore.getSectionStudents = [
      {
        id: '1',
        enrollmentId: '101',
        studentFirstname: 'Ada',
        studentLastname: 'Lovelace',
        studentId: '2026-0001',
        enrollmentType: 'Regular',
        status: 'Active',
      },
      {
        id: '2',
        enrollmentId: '102',
        studentFirstname: 'Grace',
        studentLastname: 'Hopper',
        studentId: '2026-0002',
        enrollmentType: 'Regular',
        status: 'Active',
      },
    ]

    const wrapper = mountView()
    await flushPromises()

    const searchInput = wrapper.find('input.live-search-input')
    await searchInput.setValue('ada')

    // ManagementSearchBar uses a 300ms debounce
    await new Promise(resolve => setTimeout(resolve, 310))
    await flushPromises()

    expect(wrapper.text()).toContain('Lovelace, Ada')
    expect(wrapper.text()).not.toContain('Hopper, Grace')
  })

  it('calls drop and re-enroll actions for the matching rows', async () => {
    enrollmentStore.getSectionStudents = [
      {
        id: '3',
        enrollmentId: '201',
        studentFirstname: 'Ada',
        studentLastname: 'Lovelace',
        studentId: '2026-0001',
        enrollmentType: 'Regular',
        status: 'Active',
      },
      {
        id: '4',
        enrollmentId: '202',
        studentFirstname: 'Grace',
        studentLastname: 'Hopper',
        studentId: '2026-0002',
        enrollmentType: 'Regular',
        status: 'Dropped',
      },
    ]

    const wrapper = mountView()
    await flushPromises()

    // Click drop button to open confirmation modal
    await wrapper.find('button[title="Drop Student"]').trigger('click')
    await flushPromises()

    // Click modal confirm button
    await wrapper.find('[data-test="modal-confirm"]').trigger('click')
    await flushPromises()

    expect(dropStudent).toHaveBeenCalledWith('3', '1')

    // Re-enroll is called directly (no modal)
    await wrapper.find('button[title="Re-enroll Student"]').trigger('click')
    await flushPromises()

    expect(reenrollStudent).toHaveBeenCalledWith('4', '1')
  })

  it('opens the add enrollment modal and refreshes enrollments after a success event', async () => {
    const wrapper = mountView()
    await flushPromises()

    const enrollButton = wrapper.findAll('button').find(button => button.text().includes('Enroll Student'))
    expect(enrollButton).toBeDefined()

    await enrollButton!.trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-test="add-enrollment-modal"]').exists()).toBe(true)

    await wrapper.find('.emit-success').trigger('click')
    await flushPromises()

    expect(fetchSectionStudents).toHaveBeenCalledTimes(2)
    expect(fetchSectionStudents).toHaveBeenLastCalledWith('1')
    expect(wrapper.text()).toContain('Student enrolled successfully')
    expect(wrapper.find('[data-test="add-enrollment-modal"]').exists()).toBe(false)
  })
})

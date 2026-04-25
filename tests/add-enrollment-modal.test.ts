import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AddEnrollmentModal from '@/components/sections/AddEnrollmentModal.vue'

const enrollStudent = vi.fn()
const fetchUsers = vi.fn()
const fetchSubjects = vi.fn()

const enrollmentStore = {
  enrollStudent,
  isLoading: false,
}

const userStore = {
  fetchUsers,
  students: [
    { id: '11', firstName: 'Ada', lastName: 'Lovelace', studentId: '2026-0001' },
  ],
  loading: false,
  error: '',
}

const subjectStore = {
  fetchSubjects,
  sortedSubjects: [
    { id: '7', name: 'Discrete Mathematics' },
    { id: '9', name: 'Operating Systems' },
  ],
  loading: false,
  error: '',
}

const mountedWrappers: Array<ReturnType<typeof mount>> = []

vi.mock('@/stores/enrollmentStore', () => ({
  useEnrollmentStore: () => enrollmentStore,
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => userStore,
}))

vi.mock('@/stores/subjectStore', () => ({
  useSubjectStore: () => subjectStore,
}))

describe('addEnrollmentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchUsers.mockResolvedValue([])
    fetchSubjects.mockResolvedValue([])
    enrollStudent.mockResolvedValue({})
    userStore.error = ''
    subjectStore.error = ''
  })

  afterEach(() => {
    while (mountedWrappers.length > 0) {
      mountedWrappers.pop()?.unmount()
    }
  })

  function mountModal() {
    const wrapper = mount(AddEnrollmentModal, {
      props: {
        section: {
          id: '3',
          name: 'CS31A',
        },
      },
      global: {
        stubs: {
          Loader2: true,
          X: true,
        },
      },
    })

    mountedWrappers.push(wrapper)
    return wrapper
  }

  it('lazy-loads students and subjects when opened', async () => {
    mountModal()
    await flushPromises()

    expect(fetchUsers).toHaveBeenCalledTimes(1)
    expect(fetchSubjects).toHaveBeenCalledTimes(1)
  })

  it('renders a subject dropdown and submits the selected subject id', async () => {
    const wrapper = mountModal()
    await flushPromises()

    const selects = wrapper.findAll('select')
    expect(wrapper.text()).toContain('Discrete Mathematics')

    await selects[0].setValue('11')
    await selects[1].setValue('7')
    await wrapper.find('.btn-submit').trigger('click')

    expect(enrollStudent).toHaveBeenCalledWith({
      studentId: '11',
      sectionId: '3',
      subjectId: '7',
      enrollmentType: 'Regular',
      academicYear: new Date().getFullYear().toString(),
      semester: '1st',
    })
    expect(wrapper.emitted('success')).toBeTruthy()
  })

  it('allows selecting retake as the enrollment type', async () => {
    const wrapper = mountModal()
    await flushPromises()

    const selects = wrapper.findAll('select')
    await selects[0].setValue('11')
    await selects[1].setValue('7')
    await selects[2].setValue('Retake')
    await wrapper.find('.btn-submit').trigger('click')

    expect(enrollStudent).toHaveBeenCalledWith({
      studentId: '11',
      sectionId: '3',
      subjectId: '7',
      enrollmentType: 'Retake',
      academicYear: new Date().getFullYear().toString(),
      semester: '1st',
    })
  })

  it('emits dropdown loading errors surfaced by stores', async () => {
    userStore.error = 'Failed to fetch users'
    subjectStore.error = 'Failed to fetch subjects'

    const wrapper = mountModal()
    await flushPromises()

    expect(wrapper.emitted('error')).toEqual([[
      'Failed to fetch users Failed to fetch subjects',
    ]])
  })
})

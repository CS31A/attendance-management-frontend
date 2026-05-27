import type { AxiosResponse } from 'axios'
import type { EntityId } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { entityIdsMatch } from '@/utils/entityId'
import { getErrorMessage, getValidationErrorMessages } from '@/utils/httpError'

export interface CrudApi<TDto, TPayload> {
  getAll: (...args: unknown[]) => Promise<AxiosResponse<TDto[]>>
  getById: (id: EntityId, ...args: unknown[]) => Promise<AxiosResponse<TDto>>
  create: (data: TPayload, ...args: unknown[]) => Promise<AxiosResponse<TDto>>
  update: (id: EntityId, data: TPayload, ...args: unknown[]) => Promise<AxiosResponse<TDto>>
  delete: (id: EntityId, ...args: unknown[]) => Promise<AxiosResponse<unknown>>
}

export function createCrudStore<
  TDto extends { id: EntityId },
  TPayload,
  Singular extends string,
>(
  storeId: string,
  entityLabel: Singular,
  api: CrudApi<TDto, TPayload>,
  options?: { plural?: string },
) {
  const singular = entityLabel
  const plural = (options?.plural ?? `${entityLabel}s`) as `${Singular}s`
  const singularCap = (entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)) as Capitalize<Singular>
  const pluralCap = (plural.charAt(0).toUpperCase() + plural.slice(1)) as Capitalize<`${Singular}s`>

  return defineStore(storeId, () => {
    // State
    const items = ref<TDto[]>([])
    const currentEntity = ref<TDto | null>(null)
    const loading = ref(false)
    const error = ref('')
    const fetchError = ref('')

    // Getters
    const hasEntities = computed(() => items.value.length > 0)
    const sortedEntities = computed(() =>
      [...items.value].sort((a, b) => {
        const nameA = (a as Record<string, unknown>).name as string | null | undefined
        const nameB = (b as Record<string, unknown>).name as string | null | undefined
        const safeA = nameA ?? '\uFFFF'
        const safeB = nameB ?? '\uFFFF'
        return safeA.localeCompare(safeB)
      }),
    )

    // Actions
    async function fetchAll() {
      loading.value = true
      error.value = ''
      fetchError.value = ''
      try {
        const response = await api.getAll()
        items.value = response.data
      }
      catch (err) {
        const msg = getErrorMessage(err, `Failed to fetch ${plural}`)
        error.value = msg
        fetchError.value = msg
        console.error(`Error fetching ${plural}:`, err)
      }
      finally {
        loading.value = false
      }
    }

    async function fetchById(id: EntityId) {
      loading.value = true
      error.value = ''
      fetchError.value = ''
      try {
        const response = await api.getById(id)
        currentEntity.value = response.data
      }
      catch (err) {
        const msg = getErrorMessage(err, `${singularCap} with ID ${id} not found`)
        error.value = msg
        fetchError.value = msg
        console.error(`Error fetching ${singular}:`, err)
      }
      finally {
        loading.value = false
      }
    }

    async function createEntity(data: TPayload) {
      loading.value = true
      error.value = ''
      try {
        const response = await api.create(data)
        items.value.push(response.data)
        return response.data
      }
      catch (err) {
        error.value = getErrorMessage(err, `Failed to create ${singular}`)
        const validationErrors = getValidationErrorMessages(err)
        if (validationErrors.length > 0) {
          error.value = validationErrors.join(', ')
        }
        console.error(`Error creating ${singular}:`, err)
        throw err
      }
      finally {
        loading.value = false
      }
    }

    async function updateEntity(id: EntityId, data: TPayload) {
      loading.value = true
      error.value = ''
      try {
        const response = await api.update(id, data)
        const index = items.value.findIndex(c => entityIdsMatch(c.id, id))
        if (index !== -1) {
          items.value[index] = response.data
        }
        return response.data
      }
      catch (err) {
        error.value = getErrorMessage(err, `Failed to update ${singular}`)
        const validationErrors = getValidationErrorMessages(err)
        if (validationErrors.length > 0) {
          error.value = validationErrors.join(', ')
        }
        console.error(`Error updating ${singular}:`, err)
        throw err
      }
      finally {
        loading.value = false
      }
    }

    async function deleteEntity(id: EntityId) {
      loading.value = true
      error.value = ''
      try {
        await api.delete(id)
        items.value = items.value.filter(c => !entityIdsMatch(c.id, id))
      }
      catch (err) {
        error.value = getErrorMessage(err, `Failed to delete ${singular}`)
        console.error(`Error deleting ${singular}:`, err)
        throw err
      }
      finally {
        loading.value = false
      }
    }

    return {
      // State — entity-specific names
      [plural]: items,
      [`current${singularCap}`]: currentEntity,
      loading,
      error,
      fetchError,

      // Getters — entity-specific names
      [`has${pluralCap}`]: hasEntities,
      [`sorted${pluralCap}`]: sortedEntities,

      // Actions — entity-specific names
      [`fetch${pluralCap}`]: fetchAll,
      [`fetch${singularCap}`]: fetchById,
      [`create${singularCap}`]: createEntity,
      [`update${singularCap}`]: updateEntity,
      [`delete${singularCap}`]: deleteEntity,
    }
  })
}

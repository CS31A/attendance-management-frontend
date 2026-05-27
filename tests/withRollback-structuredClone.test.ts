import { describe, expect, it } from 'vitest'
import { withRollback } from '@/utils/withRollback'

describe('withRollback structuredClone semantics', () => {
  it('preserves Date objects through snapshot/rollback', async () => {
    const originalDate = new Date('2026-05-27')
    const arrayRef = {
      value: [
        { id: '1', createdAt: originalDate },
      ],
    }

    await expect(
      withRollback(arrayRef, async () => {
        arrayRef.value[0].createdAt = new Date('2025-01-01')
        throw new Error('mutation failed')
      }),
    ).rejects.toThrow('mutation failed')

    expect(arrayRef.value[0].createdAt).toBeInstanceOf(Date)
    expect(arrayRef.value[0].createdAt).toEqual(originalDate)
  })

  it('preserves undefined fields through snapshot/rollback', async () => {
    const arrayRef = {
      value: [
        { id: '1', name: 'Alice', extra: undefined },
      ],
    }

    await expect(
      withRollback(arrayRef, async () => {
        arrayRef.value[0].extra = 'should not persist'
        throw new Error('mutation failed')
      }),
    ).rejects.toThrow('mutation failed')

    expect(arrayRef.value[0].extra).toBeUndefined()
  })

  it('returns mutate result and preserves array on success', async () => {
    const arrayRef = {
      value: [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
      ],
    }

    const result = await withRollback(arrayRef, async () => {
      return { id: '3', name: 'Charlie' }
    })

    expect(result).toEqual({ id: '3', name: 'Charlie' })
    expect(arrayRef.value).toHaveLength(2)
    expect(arrayRef.value[0].name).toBe('Alice')
  })

  it('works with Vue reactive refs (exercises toRaw)', async () => {
    const { ref } = await import('vue')
    const arrayRef = ref([
      { id: '1', status: 'present' },
    ])

    await expect(
      withRollback(arrayRef, async () => {
        arrayRef.value[0].status = 'absent'
        throw new Error('update failed')
      }),
    ).rejects.toThrow('update failed')

    expect(arrayRef.value[0].status).toBe('present')
  })
})

describe('withRollback edge cases', () => {
  it('handles deeply nested Vue reactive objects', async () => {
    const { reactive } = await import('vue')
    const inner = reactive({ city: 'NYC' })
    const arrayRef = {
      value: [
        { id: '1', address: inner },
      ],
    }

    await expect(
      withRollback(arrayRef, async () => {
        arrayRef.value[0].address.city = 'LA'
        throw new Error('fail')
      }),
    ).rejects.toThrow('fail')

    expect(arrayRef.value[0].address.city).toBe('NYC')
  })

  it('handles circular references gracefully via memoization', async () => {
    const circular: any = { id: '1', name: 'Alice' }
    circular.self = circular
    const arrayRef = { value: [circular] }

    // Circular refs are now handled by memoization, not rejected
    await expect(
      withRollback(arrayRef, async () => {
        arrayRef.value[0].name = 'Bob'
        throw new Error('fail')
      }),
    ).rejects.toThrow('fail')

    // Rollback restores the circular structure
    expect(arrayRef.value[0].name).toBe('Alice')
    expect(arrayRef.value[0].self).toBe(arrayRef.value[0])
  })

  it('handles array self-reference without infinite recursion', async () => {
    const arr: any[] = [{ id: '1' }]
    arr.push(arr) // circular: array contains itself
    const arrayRef = { value: arr }

    // Should not hang or throw — memoization handles the cycle
    await expect(
      withRollback(arrayRef, async () => {
        arrayRef.value[0].id = 'mutated'
        throw new Error('fail')
      }),
    ).rejects.toThrow('fail')

    expect(arrayRef.value[0].id).toBe('1')
  })

  it('rolls back deeply nested mutations', async () => {
    const arrayRef = {
      value: [
        { id: '1', name: 'Alice', address: { city: 'NYC', zip: '10001' } },
        { id: '2', name: 'Bob', address: { city: 'LA', zip: '90001' } },
      ],
    }

    await expect(
      withRollback(arrayRef, async () => {
        arrayRef.value[0].address.city = 'CHANGED'
        arrayRef.value[1].address.zip = '00000'
        throw new Error('fail')
      }),
    ).rejects.toThrow('fail')

    expect(arrayRef.value[0].address.city).toBe('NYC')
    expect(arrayRef.value[1].address.zip).toBe('90001')
    expect(arrayRef.value).toHaveLength(2)
  })

  it('rolls back array push during mutation', async () => {
    const arrayRef = {
      value: [
        { id: '1', name: 'Alice' },
      ],
    }

    await expect(
      withRollback(arrayRef, async () => {
        arrayRef.value.push({ id: '2', name: 'Charlie' })
        throw new Error('fail')
      }),
    ).rejects.toThrow('fail')

    expect(arrayRef.value).toHaveLength(1)
    expect(arrayRef.value[0].name).toBe('Alice')
  })

  it('rolls back array splice during mutation', async () => {
    const arrayRef = {
      value: [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Charlie' },
      ],
    }

    await expect(
      withRollback(arrayRef, async () => {
        arrayRef.value.splice(1, 1)
        throw new Error('fail')
      }),
    ).rejects.toThrow('fail')

    expect(arrayRef.value).toHaveLength(3)
    expect(arrayRef.value[1].name).toBe('Bob')
  })

  it('rolls back when mutate modifies array synchronously then rejects', async () => {
    const arrayRef = {
      value: [
        { id: '1', name: 'Alice' },
      ],
    }

    await expect(
      withRollback(arrayRef, async () => {
        arrayRef.value.push({ id: '2', name: 'SyncAdd' })
        arrayRef.value[0].name = 'CHANGED'
        throw new Error('sync then fail')
      }),
    ).rejects.toThrow('sync then fail')

    expect(arrayRef.value).toHaveLength(1)
    expect(arrayRef.value[0].name).toBe('Alice')
  })

  it('rejects when data contains non-cloneable values', async () => {
    const arrayRef = {
      value: [{ id: '1', fn: () => 'not cloneable' } as any],
    }

    await expect(
      withRollback(arrayRef, async () => {
        throw new Error('should not reach')
      }),
    ).rejects.toThrow(/snapshot|non-cloneable/i)
  })

  it('handles empty array', async () => {
    const arrayRef = { value: [] as { id: string }[] }

    const result = await withRollback(arrayRef, async () => {
      return { id: '1' }
    })

    expect(result).toEqual({ id: '1' })
    expect(arrayRef.value).toHaveLength(0)
  })

  it('handles Map with reactive values', async () => {
    const { reactive } = await import('vue')
    const map = new Map<string, { city: string }>()
    map.set('item', reactive({ city: 'NYC' }))
    const arrayRef = {
      value: [{ id: '1', data: map }],
    }

    await expect(
      withRollback(arrayRef, async () => {
        arrayRef.value[0].data.get('item')!.city = 'LA'
        throw new Error('fail')
      }),
    ).rejects.toThrow('fail')

    expect(arrayRef.value[0].data.get('item')!.city).toBe('NYC')
  })

  it('rolls back Set with reactive values on mutation failure', async () => {
    const { reactive } = await import('vue')
    const items = new Set<{ id: string }>()
    items.add(reactive({ id: '1' }))
    items.add(reactive({ id: '2' }))
    const arrayRef = { value: [{ id: '1', items }] }

    // Mutate Set contents, then fail — rollback should restore original
    await expect(
      withRollback(arrayRef, async () => {
        arrayRef.value[0].items.add(reactive({ id: '3' }))
        const item1 = [...arrayRef.value[0].items].find(i => i.id === '1')!
        item1.id = 'mutated'
        throw new Error('fail')
      }),
    ).rejects.toThrow('fail')
    // Rollback should restore original Set
    expect(arrayRef.value[0].items.size).toBe(2)
    const ids = [...arrayRef.value[0].items].map(i => i.id).sort()
    expect(ids).toEqual(['1', '2'])
  })

  it('handles Map with Date values', async () => {
    const date = new Date('2026-05-27')
    const map = new Map<string, Date>()
    map.set('createdAt', date)
    const arrayRef = {
      value: [{ id: '1', data: map }],
    }

    await expect(
      withRollback(arrayRef, async () => {
        arrayRef.value[0].data.set('createdAt', new Date('2025-01-01'))
        throw new Error('fail')
      }),
    ).rejects.toThrow('fail')

    expect(arrayRef.value[0].data.get('createdAt')).toBeInstanceOf(Date)
    expect(arrayRef.value[0].data.get('createdAt')).toEqual(date)
  })

  it('resolves with undefined when void-returning mutate succeeds', async () => {
    const arrayRef = { value: [{ id: '1', name: 'Alice' }] }
    const result = await withRollback(arrayRef, async () => {})
    expect(result).toBeUndefined()
    expect(arrayRef.value).toHaveLength(1)
  })

  it('handles shared (non-circular) references without throwing', async () => {
    const shared = { city: 'NYC' }
    const arrayRef = {
      value: [{ id: '1', address: shared, billing: shared }],
    }

    // Should NOT throw — shared ref is not circular
    const result = await withRollback(arrayRef, async () => {
      return { id: 'new' }
    })

    expect(result).toEqual({ id: 'new' })
    expect(arrayRef.value[0].address.city).toBe('NYC')
  })

  it('rolls back correctly with shared references', async () => {
    const shared = { city: 'NYC' }
    const arrayRef = {
      value: [{ id: '1', address: shared, billing: shared }],
    }

    await expect(
      withRollback(arrayRef, async () => {
        arrayRef.value[0].address.city = 'LA'
        throw new Error('fail')
      }),
    ).rejects.toThrow('fail')

    expect(arrayRef.value[0].address.city).toBe('NYC')
    expect(arrayRef.value[0].billing.city).toBe('NYC')
  })
})

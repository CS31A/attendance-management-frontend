import { toRaw } from 'vue'

/**
 * Recursively unwrap Vue reactive proxies so structuredClone can clone the tree.
 * toRaw only strips the outermost proxy; nested reactive objects remain proxied.
 */
function toRawDeep<T>(value: T, seen = new WeakSet<object>()): T {
  const raw = toRaw(value)
  if (raw === null || raw === undefined) return raw
  if (raw instanceof Date || raw instanceof RegExp) return raw
  if (typeof raw === 'object') {
    if (seen.has(raw as object)) {
      throw new Error('circular reference detected in snapshot input')
    }
    seen.add(raw as object)
  }
  if (raw instanceof Map) {
    const m = new Map()
    for (const [k, v] of raw) m.set(toRawDeep(k, seen), toRawDeep(v, seen))
    return m as T
  }
  if (raw instanceof Set) {
    const s = new Set()
    for (const v of raw) s.add(toRawDeep(v, seen))
    return s as T
  }
  if (Array.isArray(raw)) return raw.map(item => toRawDeep(item, seen)) as T
  if (typeof raw === 'object') {
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(raw)) {
      result[key] = toRawDeep(raw[key], seen)
    }
    return result
  }
  return raw
}

/**
 * withRollback - Snapshots an array ref, runs async mutation, restores snapshot on error.
 *
 * Uses structuredClone(toRawDeep(...)) for the snapshot, which correctly handles
 * Date, undefined, Map/Set, and nested Vue reactive proxies.
 *
 * Snapshot preserves values only — not prototypes, methods, or Symbol keys.
 * Rejects immediately if snapshot creation fails (e.g., circular refs, WeakMap).
 * Rejects with original error if mutation fails (array is rolled back first).
 */
export function withRollback<T>(arrayRef: { value: T[] }, mutate: () => Promise<void>): Promise<void>
export function withRollback<T, R>(arrayRef: { value: T[] }, mutate: () => Promise<R>): Promise<R>
export function withRollback<T, R = void>(arrayRef: { value: T[] }, mutate: () => Promise<R>): Promise<R> {
  let snapshot: T[]
  try {
    snapshot = structuredClone(toRawDeep(arrayRef.value))
  } catch (err) {
    return Promise.reject(new Error(`Failed to create snapshot: input contains non-cloneable values. ${err instanceof Error ? err.message : String(err)}`))
  }
  return mutate().catch((err) => {
    arrayRef.value = snapshot
    throw err
  })
}

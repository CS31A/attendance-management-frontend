import { toRaw } from 'vue'

/**
 * Recursively unwrap Vue reactive proxies so structuredClone can clone the tree.
 * toRaw only strips the outermost proxy; nested reactive objects remain proxied.
 */
function toRawDeep<T>(value: T, memo = new Map<object, unknown>()): T {
  const raw = toRaw(value)
  if (raw === null || raw === undefined) return raw
  if (raw instanceof Date || raw instanceof RegExp) return raw
  if (typeof raw === 'object') {
    if (memo.has(raw as object)) return memo.get(raw as object) as T
  }
  if (raw instanceof Map) {
    const m = new Map()
    memo.set(raw as object, m)
    for (const [k, v] of raw) m.set(toRawDeep(k, memo), toRawDeep(v, memo))
    return m as T
  }
  if (raw instanceof Set) {
    const s = new Set()
    memo.set(raw as object, s)
    for (const v of raw) s.add(toRawDeep(v, memo))
    return s as T
  }
  if (Array.isArray(raw)) {
    const arr: unknown[] = []
    memo.set(raw as object, arr)
    for (const item of raw) arr.push(toRawDeep(item, memo))
    return arr as T
  }
  if (typeof raw === 'object') {
    const result: Record<string, unknown> = {}
    memo.set(raw as object, result)
    for (const key of Object.keys(raw)) {
      result[key] = toRawDeep(raw[key], memo)
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
 * Handles circular and shared references via memoization (no longer rejects).
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

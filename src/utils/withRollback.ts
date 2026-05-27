import { toRaw } from 'vue'

/**
 * Recursively unwrap Vue reactive proxies so structuredClone can clone the tree.
 * toRaw only strips the outermost proxy; nested reactive objects remain proxied.
 */
function toRawDeep<T>(value: T): T {
  const raw = toRaw(value) as any
  if (raw === null || raw === undefined) return raw
  if (raw instanceof Date || raw instanceof RegExp) return raw
  if (raw instanceof Map || raw instanceof Set) return raw
  if (Array.isArray(raw)) return raw.map(toRawDeep) as T
  if (typeof raw === 'object') {
    const result: any = {}
    for (const key of Object.keys(raw)) {
      result[key] = toRawDeep(raw[key])
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
export function withRollback<T>(arrayRef: { value: T[] }, mutate: () => Promise<T>): Promise<T> {
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

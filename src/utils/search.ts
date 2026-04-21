function normalizeSearchValue(value: unknown): string[] {
  if (value === null || value === undefined)
    return []

  if (Array.isArray(value)) {
    return value.flatMap(entry => normalizeSearchValue(entry))
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return [String(value).trim().toLowerCase()]
  }

  return []
}

export function matchesSearchQuery(query: string, values: readonly unknown[]): boolean {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery)
    return true

  return values.some(value =>
    normalizeSearchValue(value).some(entry => entry.includes(normalizedQuery)),
  )
}

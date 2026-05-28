
export function normalizeUserName(raw: unknown): { firstName: string, lastName: string } {
  if (raw == null || typeof raw !== 'object')
    return { firstName: '', lastName: '' }

  const obj = raw as Record<string, unknown>
  return {
    firstName: String((obj.firstName as string) ?? (obj.firstname as string) ?? ''),
    lastName: String((obj.lastName as string) ?? (obj.lastname as string) ?? ''),
  }
}

export function formatDisplayName(raw: unknown, fallback = '', extra?: { firstName?: string, lastName?: string }): string {
  const names = normalizeUserName(raw)
  const firstName = names.firstName || extra?.firstName || ''
  const lastName = names.lastName || extra?.lastName || ''
  const full = `${firstName} ${lastName}`.trim().replace(/\s+/g, ' ')
  return full || fallback
}

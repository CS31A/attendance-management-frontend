type DateInput = string | Date | null | undefined
interface ShortWeekdayDateOptions {
  includeYear?: boolean
  fallback?: string
}

const shortTableFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
})

const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const shortWeekdayFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

const shortWeekdayWithYearFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const longWeekdayFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

function toValidDate(value: DateInput): Date | null {
  if (!value)
    return null

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatWithFormatter(value: DateInput, fallback: string, formatter: Intl.DateTimeFormat): string {
  const date = toValidDate(value)
  return date ? formatter.format(date) : fallback
}

export function formatShortTableDate(value: DateInput, fallback = 'N/A'): string {
  return formatWithFormatter(value, fallback, shortTableFormatter)
}

export function formatLongDate(value: DateInput, fallback = 'N/A'): string {
  return formatWithFormatter(value, fallback, longDateFormatter)
}

export function formatShortWeekdayDate(value: DateInput, options: ShortWeekdayDateOptions = {}): string {
  const { includeYear = false, fallback = 'N/A' } = options
  return formatWithFormatter(value, fallback, includeYear ? shortWeekdayWithYearFormatter : shortWeekdayFormatter)
}

export function formatShortWeekdayDateWithYear(value: DateInput, fallback = 'N/A'): string {
  return formatShortWeekdayDate(value, { includeYear: true, fallback })
}

export function formatLongWeekdayDate(value: DateInput, fallback = 'N/A'): string {
  return formatWithFormatter(value, fallback, longWeekdayFormatter)
}

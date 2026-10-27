// Всё считаю в локальном времени — так же, как Telegram показывает даты в экспорте

export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
export const WEEKDAYS_FULL = [
  'понедельникам',
  'вторникам',
  'средам',
  'четвергам',
  'пятницам',
  'субботам',
  'воскресеньям',
]

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// setDate вместо +86400000, чтобы не ломаться на переходе на летнее время
export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

// 0 = понедельник
export function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7
}

export function startOfWeek(d: Date): Date {
  const day = startOfDay(d)
  return addDays(day, -weekdayIndex(day))
}

export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000)
}

const shortDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
const longDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

export const formatShort = (d: Date) => shortDate.format(d)
export const formatLong = (d: Date) => longDate.format(d)

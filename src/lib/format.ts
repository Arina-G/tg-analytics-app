export const num = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 })
export const pct = new Intl.NumberFormat('ru-RU', { style: 'percent', maximumFractionDigits: 0 })

export function formatDuration(minutes: number | null): string {
  if (minutes == null) return '—'
  if (minutes < 1) return '< 1 мин'
  if (minutes < 60) return `${Math.round(minutes)} мин`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    const rest = Math.round(minutes % 60)
    return rest ? `${hours} ч ${rest} мин` : `${hours} ч`
  }
  return `${num.format(minutes / 1440)} д`
}

// Excel по умолчанию открывает CSV в cp1251, поэтому BOM + «;» как разделитель
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v)
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = '﻿' + rows.map((r) => r.map(escape).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

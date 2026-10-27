import { useState } from 'react'
import { formatLong } from '../lib/dates'
import { downloadCsv, formatDuration, num, pct } from '../lib/format'
import type { PersonStats } from '../types'

type SortKey = 'count' | 'medianReplyMinutes' | 'afterHoursShare' | 'reactionsReceived' | 'lastActive'

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'count', label: 'Сообщений' },
  { key: 'medianReplyMinutes', label: 'Медиана ответа' },
  { key: 'afterHoursShare', label: 'Вне раб. времени' },
  { key: 'reactionsReceived', label: 'Реакций получено' },
  { key: 'lastActive', label: 'Последняя активность' },
]

function sortValue(p: PersonStats, key: SortKey): number {
  if (key === 'lastActive') return p.lastActive.getTime()
  // у кого нет ответов — в конец списка при сортировке по скорости
  if (key === 'medianReplyMinutes') return p.medianReplyMinutes ?? Number.POSITIVE_INFINITY
  return p[key]
}

// Пороги подсветки: медленный ответ и переработки
const SLOW_REPLY_MINUTES = 60
const HIGH_AFTER_HOURS = 0.25

export function TeamTable({ people, chatName }: { people: PersonStats[]; chatName: string }) {
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: 'count', asc: false })

  const sorted = [...people].sort((a, b) => {
    const diff = sortValue(a, sort.key) - sortValue(b, sort.key)
    return sort.asc ? diff : -diff
  })

  function toggle(key: SortKey) {
    setSort((s) => (s.key === key ? { key, asc: !s.asc } : { key, asc: key === 'medianReplyMinutes' }))
  }

  function exportCsv() {
    downloadCsv(`${chatName} — команда.csv`, [
      ['Участник', 'Сообщений', 'Доля', 'Ответов', 'Медиана ответа, мин', 'Вне рабочего времени, %', 'Реакций получено', 'Последняя активность'],
      ...sorted.map((p) => [
        p.name,
        p.count,
        Math.round(p.share * 100),
        p.replies,
        p.medianReplyMinutes == null ? '' : Math.round(p.medianReplyMinutes),
        Math.round(p.afterHoursShare * 100),
        p.reactionsReceived,
        p.lastActive.toLocaleString('ru-RU'),
      ]),
    ])
  }

  return (
    <>
      <div className="card-head">
        <h3>Команда</h3>
        <button className="btn ghost small" onClick={exportCsv}>
          Экспорт CSV
        </button>
      </div>
      <div className="table-wrap">
        <table className="team-table">
          <thead>
            <tr>
              <th>Участник</th>
              {COLUMNS.map((c) => (
                <th key={c.key} className="sortable" onClick={() => toggle(c.key)}>
                  {c.label}
                  {sort.key === c.key && (sort.asc ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.name}>
                <td>{p.name}</td>
                <td>
                  {num.format(p.count)} <span className="muted">· {pct.format(p.share)}</span>
                </td>
                <td className={p.medianReplyMinutes != null && p.medianReplyMinutes > SLOW_REPLY_MINUTES ? 'warn' : ''}>
                  {formatDuration(p.medianReplyMinutes)}
                  {p.replies > 0 && <span className="muted"> · {p.replies}</span>}
                </td>
                <td className={p.afterHoursShare > HIGH_AFTER_HOURS ? 'warn' : ''}>{pct.format(p.afterHoursShare)}</td>
                <td>{num.format(p.reactionsReceived)}</td>
                <td>{formatLong(p.lastActive)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted small">
        Медиана ответа — по reply на сообщения коллег (до 3 суток). Рабочее время: пн–пт, 9:00–19:00. Красным —
        ответ дольше часа или больше 25% сообщений вне рабочего времени.
      </p>
    </>
  )
}

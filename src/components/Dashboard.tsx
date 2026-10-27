import { useMemo, useState } from 'react'
import { formatLong, WEEKDAYS_FULL } from '../lib/dates'
import { formatDuration, num, pct } from '../lib/format'
import { CHAT_TYPES } from '../lib/parser'
import { computeStats, filterByPeriod } from '../lib/stats'
import type { Chat, Stats } from '../types'
import { KindsChart, TimelineChart, WeekdayChart } from './Charts'
import { Heatmap } from './Heatmap'
import { Reactions, Tags, TopPosts } from './Lists'
import { TeamTable } from './TeamTable'

const PERIODS = [
  { days: 7, label: '7 дней' },
  { days: 30, label: '30 дней' },
  { days: 90, label: 'Квартал' },
  { days: 365, label: 'Год' },
  { days: 0, label: 'Всё время' },
]

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="kpi">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  )
}

function summary(stats: Stats): string[] {
  const lines: string[] = []
  if (stats.peak) {
    lines.push(`Пик нагрузки — по ${WEEKDAYS_FULL[stats.peak.weekday]} около ${stats.peak.hour}:00.`)
  }
  if (stats.medianReplyMinutes != null) {
    lines.push(`Медианное время ответа коллегам — ${formatDuration(stats.medianReplyMinutes)}.`)
  }
  const slowest = stats.people
    .filter((p) => p.medianReplyMinutes != null && p.replies >= 5)
    .sort((a, b) => b.medianReplyMinutes! - a.medianReplyMinutes!)[0]
  if (slowest && slowest.medianReplyMinutes! > 60) {
    lines.push(`Дольше всех отвечает ${slowest.name} (${formatDuration(slowest.medianReplyMinutes)}).`)
  }
  if (stats.afterHoursShare > 0.15) {
    lines.push(`${pct.format(stats.afterHoursShare)} сообщений написаны вне рабочего времени.`)
  }
  return lines
}

export function Dashboard({ chat }: { chat: Chat }) {
  const [period, setPeriod] = useState(30)

  const messages = useMemo(() => filterByPeriod(chat.messages, period), [chat, period])
  const stats = useMemo(() => computeStats(messages), [messages])

  const first = messages[0].date
  const last = messages[messages.length - 1].date
  const lines = summary(stats)

  return (
    <section className="dashboard">
      <div className="dash-head">
        <div>
          <h2>{chat.name}</h2>
          <p className="muted">
            {CHAT_TYPES[chat.type] ?? chat.type} · {formatLong(first)} — {formatLong(last)}
          </p>
        </div>
        <div className="period">
          {PERIODS.map((p) => (
            <button key={p.days} className={period === p.days ? 'active' : ''} onClick={() => setPeriod(p.days)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {lines.length > 0 && (
        <div className="summary">
          <b>Сводка</b>
          <ul>
            {lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="kpis">
        <Kpi label="сообщений" value={num.format(stats.total)} hint={`${num.format(stats.avgPerDay)} в день`} />
        <Kpi label="участников" value={num.format(stats.people.length)} />
        <Kpi label="медиана ответа" value={formatDuration(stats.medianReplyMinutes)} />
        <Kpi label="вне рабочего времени" value={pct.format(stats.afterHoursShare)} hint="пн–пт 9:00–19:00" />
        <Kpi
          label="активных дней"
          value={num.format(stats.activeDays)}
          hint={`из ${stats.spanDays} · ${pct.format(stats.activeDays / stats.spanDays)}`}
        />
        <Kpi label="ответов в тредах" value={pct.format(stats.replyShare)} hint={`репостов ${pct.format(stats.forwardShare)}`} />
      </div>

      <div className="grid">
        <div className="card wide">
          <h3>Активность {stats.timelineUnit === 'week' ? 'по неделям' : 'по дням'}</h3>
          <div className="chart-box">
            <TimelineChart timeline={stats.timeline} />
          </div>
        </div>

        {stats.people.length > 1 && (
          <div className="card wide">
            <TeamTable people={stats.people} chatName={chat.name} />
          </div>
        )}

        <div className="card wide">
          <h3>Нагрузка: день недели × час</h3>
          <Heatmap data={stats.heatmap} />
        </div>

        <div className="card">
          <h3>По дням недели</h3>
          <div className="chart-box">
            <WeekdayChart weekdays={stats.weekdays} />
          </div>
        </div>

        <div className="card">
          <h3>Типы сообщений</h3>
          <div className="chart-box">
            <KindsChart kinds={stats.kinds} />
          </div>
        </div>

        <div className="card">
          <h3>Ключевые темы</h3>
          <Tags items={stats.words} empty="Текстовых сообщений нет" />
          <h3 className="mt">Хэштеги</h3>
          <Tags items={stats.hashtags} empty="Хэштегов нет" />
        </div>

        <div className="card">
          <h3>Реакции</h3>
          <Reactions items={stats.reactions} />
        </div>

        <div className="card wide">
          <h3>Сообщения с наибольшим откликом</h3>
          <TopPosts posts={stats.topPosts} />
        </div>
      </div>
    </section>
  )
}

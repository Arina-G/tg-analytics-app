import { WEEKDAYS } from '../lib/dates'

const HOURS = Array.from({ length: 24 }, (_, h) => h)

export function Heatmap({ data }: { data: number[][] }) {
  const max = Math.max(1, ...data.flat())

  return (
    <div className="heatmap">
      <div />
      {HOURS.map((h) => (
        <div key={h} className="heatmap-hour">
          {h % 3 === 0 ? h : ''}
        </div>
      ))}

      {data.map((row, wd) => (
        <div key={wd} className="heatmap-row">
          <div className="heatmap-day">{WEEKDAYS[wd]}</div>
          {row.map((value, h) => (
            <div
              key={h}
              className="heatmap-cell"
              // корень делает разницу между «мало» и «ничего» заметнее
              style={{ opacity: value ? 0.12 + 0.88 * Math.sqrt(value / max) : 0.04 }}
              title={`${WEEKDAYS[wd]}, ${h}:00–${h + 1}:00 — ${value} сообщ.`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

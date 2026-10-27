import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { COLORS } from '../chartSetup'
import { WEEKDAYS } from '../lib/dates'
import type { Counted, MessageKind, Stats } from '../types'

const KIND_LABELS: Record<MessageKind, string> = {
  text: 'Текст',
  photo: 'Фото',
  video: 'Видео',
  voice: 'Голосовые',
  sticker: 'Стикеры',
  gif: 'GIF',
  audio: 'Аудио',
  file: 'Файлы',
  poll: 'Опросы',
}

export function TimelineChart({ timeline }: { timeline: Stats['timeline'] }) {
  return (
    <Line
      data={{
        labels: timeline.map((p) => p.label),
        datasets: [
          {
            data: timeline.map((p) => p.count),
            borderColor: COLORS.accent,
            backgroundColor: COLORS.accentSoft,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHitRadius: 8,
            borderWidth: 2,
          },
        ],
      }}
      options={{
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } },
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
      }}
    />
  )
}

export function WeekdayChart({ weekdays }: { weekdays: number[] }) {
  const max = Math.max(...weekdays)
  return (
    <Bar
      data={{
        labels: WEEKDAYS,
        datasets: [
          {
            data: weekdays,
            backgroundColor: weekdays.map((v) => (v === max ? COLORS.accent : COLORS.accentSoft)),
            borderRadius: 6,
          },
        ],
      }}
      options={{
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } },
      }}
    />
  )
}

export function KindsChart({ kinds }: { kinds: Counted<MessageKind>[] }) {
  return (
    <Doughnut
      data={{
        labels: kinds.map((k) => KIND_LABELS[k.key]),
        datasets: [{ data: kinds.map((k) => k.count), backgroundColor: COLORS.palette, borderWidth: 0 }],
      }}
      options={{
        cutout: '62%',
        plugins: { legend: { display: true, position: 'right', labels: { boxWidth: 10, boxHeight: 10 } } },
      }}
    />
  )
}


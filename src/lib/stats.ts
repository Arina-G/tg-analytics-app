import type { Counted, Message, MessageKind, PersonStats, Stats } from '../types'
import { addDays, dayKey, daysBetween, formatShort, startOfDay, startOfWeek, weekdayIndex } from './dates'

// Короткий список стоп-слов, чтобы в топе не было «что», «это», «the»...
const STOP_WORDS = new Set(
  `и в во не что он на я с со как а то все всё она так его но да ты к у же вы за бы по только ее её мне было
  вот от меня еще ещё нет о из ему теперь когда даже ну ли если уже или ни быть был него до вас нибудь
  опять уж вам ведь там потом себя ничего ей может они тут где есть надо ней для мы тебя их чем была сам
  чтоб без будто чего раз тоже себе под будет ж тогда кто этот того потому этого какой совсем ним здесь
  этом один почти мой тем чтобы нее сейчас были куда зачем всех никогда можно при об другой хоть после
  над больше тот через эти нас про всего них какая много разве эту моя впрочем хорошо свою этой перед
  иногда лучше чуть том нельзя такой им более всегда конечно всю между это просто очень вообще тоже
  кстати типа короче вроде либо пока сегодня завтра вчера спасибо привет
  the a an and or of to in is it for on with that this you i are be was at as not but so if my me`
    .split(/\s+/)
    .filter(Boolean),
)

const WORD_RE = /[\p{L}\p{N}_]+/gu
const HASHTAG_RE = /#[\p{L}\p{N}_]+/gu
const URL_RE = /https?:\/\/\S+/g

function topN<T>(map: Map<T, number>, n: number): Counted<T>[] {
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

function inc<T>(map: Map<T, number>, key: T, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by)
}

function buildTimeline(messages: Message[], first: Date, last: Date) {
  const unit: 'day' | 'week' = daysBetween(first, last) > 120 ? 'week' : 'day'
  const bucketOf = unit === 'day' ? startOfDay : startOfWeek
  const step = unit === 'day' ? 1 : 7

  const counts = new Map<string, number>()
  for (const m of messages) inc(counts, dayKey(bucketOf(m.date)))

  // Заполняю пустые дни нулями, иначе график врёт
  const timeline: Stats['timeline'] = []
  for (let cur = bucketOf(first); cur <= last; cur = addDays(cur, step)) {
    timeline.push({ label: formatShort(cur), count: counts.get(dayKey(cur)) ?? 0 })
  }
  return { timeline, unit }
}

function longestStreak(dayKeys: Set<string>, first: Date, last: Date): number {
  let best = 0
  let current = 0
  for (let cur = startOfDay(first); cur <= last; cur = addDays(cur, 1)) {
    if (dayKeys.has(dayKey(cur))) {
      current++
      best = Math.max(best, current)
    } else {
      current = 0
    }
  }
  return best
}

// Рабочее время: пн–пт, 9:00–19:00 по локальному времени браузера
export const WORK_START = 9
export const WORK_END = 19

export function isAfterHours(d: Date): boolean {
  const h = d.getHours()
  return weekdayIndex(d) >= 5 || h < WORK_START || h >= WORK_END
}

// Ответы старше трёх суток — это уже не «скорость реакции», а раскопки истории
const MAX_REPLY_MINUTES = 3 * 24 * 60

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// Время ответа = разница между сообщением и reply на него от другого участника
function replyDelays(messages: Message[]): Map<string, number[]> {
  const byId = new Map(messages.map((m) => [m.id, m]))
  const delays = new Map<string, number[]>()
  for (const m of messages) {
    if (m.replyTo == null) continue
    const original = byId.get(m.replyTo)
    if (!original || original.author === m.author) continue
    const minutes = (m.date.getTime() - original.date.getTime()) / 60_000
    if (minutes < 0 || minutes > MAX_REPLY_MINUTES) continue
    const list = delays.get(m.author) ?? []
    list.push(minutes)
    delays.set(m.author, list)
  }
  return delays
}

function buildPeople(messages: Message[]): PersonStats[] {
  const delays = replyDelays(messages)
  const people = new Map<string, PersonStats & { afterHours: number }>()

  for (const m of messages) {
    let p = people.get(m.author)
    if (!p) {
      p = {
        name: m.author,
        count: 0,
        share: 0,
        replies: 0,
        medianReplyMinutes: null,
        afterHoursShare: 0,
        reactionsReceived: 0,
        lastActive: m.date,
        afterHours: 0,
      }
      people.set(m.author, p)
    }
    p.count++
    p.reactionsReceived += m.reactionsTotal
    p.lastActive = m.date
    if (isAfterHours(m.date)) p.afterHours++
  }

  return [...people.values()]
    .map(({ afterHours, ...p }) => {
      const own = delays.get(p.name) ?? []
      return {
        ...p,
        share: p.count / messages.length,
        replies: own.length,
        medianReplyMinutes: median(own),
        afterHoursShare: afterHours / p.count,
      }
    })
    .sort((a, b) => b.count - a.count)
}

export function computeStats(messages: Message[]): Stats {
  const first = messages[0].date
  const last = messages[messages.length - 1].date
  const spanDays = daysBetween(first, last) + 1

  const days = new Set<string>()
  const weekdays = Array<number>(7).fill(0)
  const heatmap = Array.from({ length: 7 }, () => Array<number>(24).fill(0))
  const kinds = new Map<MessageKind, number>()
  const authors = new Map<string, number>()
  const words = new Map<string, number>()
  const hashtags = new Map<string, number>()
  const reactions = new Map<string, number>()

  let textCount = 0
  let textLength = 0
  let totalReactions = 0
  let forwards = 0
  let replies = 0

  for (const m of messages) {
    days.add(dayKey(m.date))
    const wd = weekdayIndex(m.date)
    weekdays[wd]++
    heatmap[wd][m.date.getHours()]++
    inc(kinds, m.kind)
    inc(authors, m.author)
    if (m.isForward) forwards++
    if (m.replyTo != null) replies++

    for (const r of m.reactions) inc(reactions, r.emoji, r.count)
    totalReactions += m.reactionsTotal

    if (m.text) {
      textCount++
      textLength += m.text.length
      for (const tag of m.text.match(HASHTAG_RE) ?? []) inc(hashtags, tag.toLowerCase())

      const clean = m.text.replace(URL_RE, ' ').replace(HASHTAG_RE, ' ').toLowerCase()
      for (const word of clean.match(WORD_RE) ?? []) {
        if (word.length < 3 || STOP_WORDS.has(word) || /^\d+$/.test(word)) continue
        inc(words, word)
      }
    }
  }

  let peak: Stats['peak'] = null
  let peakValue = 0
  heatmap.forEach((row, weekday) =>
    row.forEach((value, hour) => {
      if (value > peakValue) {
        peakValue = value
        peak = { weekday, hour }
      }
    }),
  )

  const { timeline, unit } = buildTimeline(messages, first, last)

  const topPosts = messages
    .filter((m) => m.reactionsTotal > 0)
    .sort((a, b) => b.reactionsTotal - a.reactionsTotal)
    .slice(0, 5)

  const allDelays = [...replyDelays(messages).values()].flat()

  return {
    total: messages.length,
    medianReplyMinutes: median(allDelays),
    afterHoursShare: messages.filter((m) => isAfterHours(m.date)).length / messages.length,
    people: buildPeople(messages),
    spanDays,
    activeDays: days.size,
    longestStreak: longestStreak(days, first, last),
    avgPerDay: messages.length / spanDays,
    avgLength: textCount ? Math.round(textLength / textCount) : 0,
    totalReactions,
    forwardShare: forwards / messages.length,
    replyShare: replies / messages.length,
    timeline,
    timelineUnit: unit,
    weekdays,
    heatmap,
    peak,
    kinds: topN(kinds, 20),
    authors: topN(authors, 10),
    words: topN(words, 30),
    hashtags: topN(hashtags, 15),
    reactions: topN(reactions, 12),
    topPosts,
  }
}

// Оставляю только последние N дней относительно последнего сообщения
// (экспорт может быть старым, поэтому не от «сегодня»)
export function filterByPeriod(messages: Message[], days: number): Message[] {
  if (!days || messages.length === 0) return messages
  const cutoff = addDays(startOfDay(messages[messages.length - 1].date), -(days - 1))
  return messages.filter((m) => m.date >= cutoff)
}

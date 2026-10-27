import type { TgExport, TgRawMessage, TgRawReaction, TgTextPart } from '../types'
import { addDays, startOfDay } from './dates'

// Демо-чат проектной команды. Генерируется «сырой» экспорт, чтобы он проходил через тот же парсер.

// mulberry32 — сидируемый ГПСЧ, чтобы демо было воспроизводимым
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let rand = mulberry32(2026)
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]

function weighted<T>(items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0)
  let r = rand() * total
  for (const [item, w] of items) {
    r -= w
    if (r <= 0) return item
  }
  return items[0][0]
}

interface Member {
  name: string
  weight: number
  // медианное время ответа в минутах
  replyMinutes: number
  // вероятность написать вне рабочего времени
  lateness: number
}

const TEAM: Member[] = [
  { name: 'Анна Ковалёва', weight: 5, replyMinutes: 12, lateness: 0.18 },
  { name: 'Игорь Петров', weight: 3.5, replyMinutes: 35, lateness: 0.08 },
  { name: 'Марина Соколова', weight: 3, replyMinutes: 20, lateness: 0.1 },
  { name: 'Денис Орлов', weight: 2.5, replyMinutes: 90, lateness: 0.35 },
  { name: 'Ольга Лебедева', weight: 1.5, replyMinutes: 55, lateness: 0.05 },
  { name: 'Сергей Волков', weight: 1, replyMinutes: 180, lateness: 0.02 },
]

const PHRASES = [
  'Задеплоили релиз на стейдж, можно проверять',
  'Клиент просит перенести созвон на четверг',
  'Отчёт за неделю загрузила в папку проекта',
  'Кто берёт задачу по интеграции с CRM?',
  'Дизайн карточки товара согласован, передаю в разработку',
  'Есть блокер по API — ждём доступы от клиента',
  'Оценка по новому модулю: 3–4 дня',
  'Напоминаю: в пятницу демо для клиента',
  'Поправила тексты на лендинге по комментариям',
  'Баг с оплатой воспроизводится только в Safari',
  'Хотфикс выкатили, мониторим',
  'Скинула счёт и акт на подпись',
  'Нужен апрув по бюджету на рекламу',
  'Ретро в 17:00, ссылка в календаре',
  'Тесты зелёные, мержу в main',
  'Клиент доволен демо, ждём фидбек по второй итерации',
  'Обновила роадмап на квартал',
  'Перенесли дедлайн по мобильной версии на неделю',
  'Сделала выгрузку заказов за месяц',
  'Кто сегодня дежурит по поддержке?',
  'Новый тикет от клиента: не приходят письма',
  'Созвонились с подрядчиком, сроки подтвердили',
  'Прошу посмотреть пулреквест до конца дня',
  'Метрики конверсии за неделю выросли на 8%',
  'Закрыли спринт, 21 из 24 задач',
  'Договор продлили до конца года',
]

const SHORT = ['Принято', 'Ок', 'Понял, беру', 'Спасибо!', 'Посмотрю', '+', 'Готово', 'Согласовано', 'В работе', 'Сделаю до вечера']
const HASHTAGS = ['#релиз', '#баг', '#созвон', '#отчёт', '#клиент', '#дизайн', '#бэкенд', '#бюджет']
const EMOJIS: [string, number][] = [
  ['👍', 10],
  ['✅', 5],
  ['🔥', 3],
  ['👀', 2],
  ['❤', 1.5],
  ['🎉', 1.5],
  ['🙏', 1.5],
  ['🤔', 1],
]
const WORK_HOURS: [number, number][] = [
  [9, 3], [10, 6], [11, 7], [12, 6], [13, 4], [14, 6], [15, 7], [16, 6], [17, 5], [18, 3],
]
const LATE_HOURS: [number, number][] = [
  [7, 1], [8, 2], [19, 3], [20, 3], [21, 3], [22, 2], [23, 1],
]

function makeText(): string | TgTextPart[] {
  if (rand() < 0.3) return pick(SHORT)
  const phrase = pick(PHRASES)
  if (rand() < 0.3) return [phrase + ' ', { type: 'hashtag', text: pick(HASHTAGS) }]
  return phrase
}

function makeReactions(): TgRawReaction[] | undefined {
  if (rand() < 0.55) return undefined
  const result = new Map<string, number>()
  const n = 1 + Math.floor(rand() * 2)
  for (let i = 0; i < n; i++) {
    const emoji = weighted(EMOJIS)
    result.set(emoji, (result.get(emoji) ?? 0) + 1 + Math.floor(rand() * rand() * 4))
  }
  return [...result].map(([emoji, count]) => ({ type: 'emoji', count, emoji }))
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function rawMessage(id: number, date: Date, from: string): TgRawMessage {
  const kind = weighted<string>([
    ['text', 84], ['photo', 6], ['file', 5], ['voice_message', 2], ['sticker', 2], ['video_file', 1],
  ])
  const m: TgRawMessage = {
    id,
    type: 'message',
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
    date_unixtime: String(Math.floor(date.getTime() / 1000)),
    from,
    text: kind === 'text' || kind === 'photo' ? makeText() : '',
    reactions: makeReactions(),
  }
  if (kind === 'photo') m.photo = '(File not included)'
  else if (kind === 'file') m.file = '(File not included)'
  else if (kind !== 'text') m.media_type = kind
  if (rand() < 0.03) m.forwarded_from = 'Клиент'
  return m
}

export function makeDemoExport(): TgExport {
  rand = mulberry32(2026)
  const messages: TgRawMessage[] = []
  const end = startOfDay(new Date())
  const start = addDays(end, -364)
  const memberWeights = TEAM.map((m): [Member, number] => [m, m.weight])
  let id = 1

  for (let day = start, i = 0; day <= end; day = addDays(day, 1), i++) {
    const weekend = day.getDay() === 0 || day.getDay() === 6
    // нагрузка растёт к концу года, в августе отпуска
    const growth = 0.7 + (0.6 * i) / 365
    const vacation = day.getMonth() === 7 ? 0.5 : 1
    const base = (weekend ? 0.8 : 12) * growth * vacation
    const count = Math.round(base * (0.5 + rand()))

    for (let j = 0; j < count; j++) {
      const author = weighted(memberWeights)
      const late = weekend || rand() < author.lateness
      const date = new Date(day)
      date.setHours(weighted(late ? LATE_HOURS : WORK_HOURS), Math.floor(rand() * 60), Math.floor(rand() * 60))
      const msg = rawMessage(id++, date, author.name)
      messages.push(msg)

      // часть сообщений получает ответ от коллеги со «своей» скоростью реакции
      if (rand() < 0.4) {
        const others = memberWeights.filter(([m]) => m !== author)
        const replier = weighted(others)
        const minutes = replier.replyMinutes * -Math.log(1 - rand() * 0.98)
        const replyDate = new Date(date.getTime() + minutes * 60_000 + 30_000)
        const reply = rawMessage(id++, replyDate, replier.name)
        reply.reply_to_message_id = msg.id
        messages.push(reply)
      }
    }
  }

  // в настоящем экспорте id идут по времени — перенумеровываю и чиню ссылки на ответы
  messages.sort((a, b) => Number(a.date_unixtime) - Number(b.date_unixtime))
  const newIds = new Map<number, number>()
  messages.forEach((m, idx) => newIds.set(m.id, idx + 1))
  for (const m of messages) {
    m.id = newIds.get(m.id)!
    if (m.reply_to_message_id != null) m.reply_to_message_id = newIds.get(m.reply_to_message_id)
  }

  return { name: 'Проект Atlas · рабочий чат', type: 'private_supergroup', id: 1, messages }
}

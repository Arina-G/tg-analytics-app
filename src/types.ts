// Формат result.json из Telegram Desktop (только поля, которые мне нужны)
export type TgTextPart = string | { type: string; text: string }

export interface TgRawReaction {
  type: string
  count: number
  emoji?: string
}

export interface TgRawMessage {
  id: number
  type: 'message' | 'service'
  date: string
  date_unixtime?: string
  from?: string | null
  from_id?: string
  text: string | TgTextPart[]
  media_type?: string
  photo?: string
  file?: string
  poll?: unknown
  forwarded_from?: string
  reply_to_message_id?: number
  reactions?: TgRawReaction[]
}

export interface TgExport {
  name?: string
  type?: string
  id?: number
  messages: TgRawMessage[]
}

// То, с чем работает приложение после парсинга
export type MessageKind =
  | 'text'
  | 'photo'
  | 'video'
  | 'voice'
  | 'sticker'
  | 'gif'
  | 'audio'
  | 'file'
  | 'poll'

export interface Reaction {
  emoji: string
  count: number
}

export interface Message {
  id: number
  date: Date
  author: string
  text: string
  kind: MessageKind
  reactions: Reaction[]
  reactionsTotal: number
  isForward: boolean
  replyTo: number | null
}

export interface Chat {
  name: string
  type: string
  messages: Message[]
}

export interface Counted<T = string> {
  key: T
  count: number
}

export interface PersonStats {
  name: string
  count: number
  share: number
  replies: number
  medianReplyMinutes: number | null
  afterHoursShare: number
  reactionsReceived: number
  lastActive: Date
}

export interface Stats {
  total: number
  medianReplyMinutes: number | null
  afterHoursShare: number
  people: PersonStats[]
  spanDays: number
  activeDays: number
  longestStreak: number
  avgPerDay: number
  avgLength: number
  totalReactions: number
  forwardShare: number
  replyShare: number
  timeline: { label: string; count: number }[]
  timelineUnit: 'day' | 'week'
  weekdays: number[]
  heatmap: number[][]
  peak: { weekday: number; hour: number } | null
  kinds: Counted<MessageKind>[]
  authors: Counted[]
  words: Counted[]
  hashtags: Counted[]
  reactions: Counted[]
  topPosts: Message[]
}

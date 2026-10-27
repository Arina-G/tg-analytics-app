import type { Chat, Message, MessageKind, TgExport, TgRawMessage, TgTextPart } from '../types'

// text в экспорте бывает строкой или массивом кусочков (ссылки, жирный, хэштеги...)
export function flattenText(text: string | TgTextPart[] | undefined): string {
  if (!text) return ''
  if (typeof text === 'string') return text
  return text.map((part) => (typeof part === 'string' ? part : part.text ?? '')).join('')
}

const MEDIA_KINDS: Record<string, MessageKind> = {
  sticker: 'sticker',
  voice_message: 'voice',
  video_message: 'video',
  video_file: 'video',
  animation: 'gif',
  audio_file: 'audio',
}

function detectKind(m: TgRawMessage): MessageKind {
  if (m.media_type) return MEDIA_KINDS[m.media_type] ?? 'file'
  if (m.photo) return 'photo'
  if (m.poll) return 'poll'
  if (m.file) return 'file'
  return 'text'
}

function parseDate(m: TgRawMessage): Date {
  if (m.date_unixtime) return new Date(Number(m.date_unixtime) * 1000)
  return new Date(m.date)
}

function toMessage(m: TgRawMessage, fallbackAuthor: string): Message {
  const reactions = (m.reactions ?? [])
    .filter((r) => r.count > 0)
    .map((r) => ({ emoji: r.emoji ?? (r.type === 'custom_emoji' ? '✨' : '❔'), count: r.count }))

  return {
    id: m.id,
    date: parseDate(m),
    author: m.from || fallbackAuthor,
    text: flattenText(m.text),
    kind: detectKind(m),
    reactions,
    reactionsTotal: reactions.reduce((sum, r) => sum + r.count, 0),
    isForward: Boolean(m.forwarded_from),
    replyTo: m.reply_to_message_id ?? null,
  }
}

export function parseExport(data: unknown): Chat {
  if (!data || typeof data !== 'object') {
    throw new Error('Это не похоже на JSON-экспорт Telegram')
  }
  if ('chats' in data && !('messages' in data)) {
    throw new Error('Это экспорт всего аккаунта. Выгрузите историю одного чата: ⋮ → «Экспорт истории чата»')
  }

  const raw = data as TgExport
  if (!Array.isArray(raw.messages)) {
    throw new Error('В файле нет поля messages — проверьте, что выбран формат JSON, а не HTML')
  }

  const name = raw.name || 'Без названия'
  const messages = raw.messages
    .filter((m) => m.type === 'message')
    .map((m) => toMessage(m, name))
    .filter((m) => !Number.isNaN(m.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  if (messages.length === 0) {
    throw new Error('В чате нет сообщений')
  }

  return { name, type: raw.type ?? 'unknown', messages }
}

export const CHAT_TYPES: Record<string, string> = {
  personal_chat: 'Личный чат',
  private_group: 'Группа',
  private_supergroup: 'Супергруппа',
  public_supergroup: 'Публичная супергруппа',
  private_channel: 'Приватный канал',
  public_channel: 'Канал',
  bot_chat: 'Чат с ботом',
  saved_messages: 'Избранное',
}

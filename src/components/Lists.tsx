import { formatLong } from '../lib/dates'
import type { Counted, Message } from '../types'

export function Tags({ items, empty }: { items: Counted[]; empty: string }) {
  if (items.length === 0) return <p className="muted">{empty}</p>
  const max = items[0].count

  return (
    <div className="tags">
      {items.map((item) => (
        <span
          key={item.key}
          className="tag"
          style={{ fontSize: `${0.8 + 0.55 * (item.count / max)}rem` }}
          title={`${item.count} раз`}
        >
          {item.key}
        </span>
      ))}
    </div>
  )
}

export function Reactions({ items }: { items: Counted[] }) {
  if (items.length === 0) return <p className="muted">Нет данных о реакциях (в экспорте старых версий Telegram их нет)</p>
  const max = items[0].count

  return (
    <ul className="reactions">
      {items.map((r) => (
        <li key={r.key}>
          <span className="reaction-emoji">{r.key}</span>
          <span className="bar">
            <span style={{ width: `${(r.count / max) * 100}%` }} />
          </span>
          <span className="reaction-count">{r.count}</span>
        </li>
      ))}
    </ul>
  )
}

export function TopPosts({ posts }: { posts: Message[] }) {
  if (posts.length === 0) return <p className="muted">Нет сообщений с реакциями</p>

  return (
    <ol className="top-posts">
      {posts.map((p) => (
        <li key={p.id}>
          <div className="post-meta">
            <b>{p.author}</b> · {formatLong(p.date)}
          </div>
          <div className="post-text">{p.text || <i className="muted">[{p.kind}]</i>}</div>
          <div className="post-reactions">
            {p.reactions.map((r) => (
              <span key={r.emoji}>
                {r.emoji} {r.count}
              </span>
            ))}
          </div>
        </li>
      ))}
    </ol>
  )
}

import { useState, type DragEvent } from 'react'

interface Props {
  onFile: (file: File) => void
  onDemo: () => void
  error: string | null
  loading: boolean
}

export function Dropzone({ onFile, onDemo, error, loading }: Props) {
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <section
      className={`dropzone ${dragging ? 'dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="dropzone-icon">📊</div>
      <h1>Аналитика рабочих чатов Telegram</h1>
      <p>
        Загрузите <code>result.json</code> из экспорта Telegram Desktop, чтобы увидеть нагрузку команды,
        скорость ответов и активность вне рабочего времени
      </p>

      <div className="dropzone-actions">
        <label className="btn">
          {loading ? 'Обработка…' : 'Загрузить экспорт'}
          <input
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onFile(file)
              e.target.value = ''
            }}
          />
        </label>
        <button className="btn ghost" onClick={onDemo}>
          Открыть демо
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <details>
        <summary>Как выгрузить чат из Telegram</summary>
        <ol>
          <li>Откройте Telegram Desktop → нужный чат, группу или канал</li>
          <li>
            ⋮ → <b>Экспорт истории чата</b>
          </li>
          <li>
            Снимите галочки с медиафайлов (они не нужны), формат — <b>Машиночитаемый JSON</b>
          </li>
          <li>
            Загрузите сюда <code>result.json</code>
          </li>
        </ol>
        <p className="muted">🔒 Файл не покидает ваш компьютер: обработка выполняется в браузере.</p>
      </details>
    </section>
  )
}

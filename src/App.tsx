import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { Dropzone } from './components/Dropzone'
import { makeDemoExport } from './lib/demo'
import { parseExport } from './lib/parser'
import type { Chat } from './types'

export default function App() {
  const [chat, setChat] = useState<Chat | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleFile(file: File) {
    setLoading(true)
    setError(null)
    try {
      const json: unknown = JSON.parse(await file.text())
      setChat(parseExport(json))
    } catch (e) {
      setError(e instanceof SyntaxError ? 'Не удалось прочитать файл: это не JSON' : (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function handleDemo() {
    setError(null)
    setChat(parseExport(makeDemoExport()))
  }

  return (
    <>
      <header className="topbar">
        <button className="logo" onClick={() => setChat(null)}>
          📊 <b>TG Analytics</b>
          <span className="badge">Ops</span>
        </button>
        {chat && (
          <button className="btn ghost small" onClick={() => setChat(null)}>
            ← Другой файл
          </button>
        )}
      </header>

      <main>
        {chat ? <Dashboard chat={chat} /> : <Dropzone onFile={handleFile} onDemo={handleDemo} error={error} loading={loading} />}
      </main>

      <footer className="muted">Данные обрабатываются локально в браузере и никуда не передаются</footer>
    </>
  )
}

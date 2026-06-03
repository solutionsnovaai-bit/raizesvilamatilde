import { useState, useRef, useEffect, useCallback } from 'react'
import '../styles/TabIA.css'

// ─────────────────────────────────────────────────────────
// As chaves de IA NÃO ficam mais aqui. O front chama /api/chat,
// que faz o proxy seguro pro Gemini (com fallback Groq) no servidor.
// ─────────────────────────────────────────────────────────

interface Msg {
  id: number
  role: 'ia' | 'user'
  text: string
  streaming?: boolean
}

const SUGS = [
  'Posso proibir Airbnb no condomínio?',
  'Como cobrar inadimplente?',
  'Quórum para alterar convenção?',
  'Multar barulho após 22h?',
  'Animal de estimação em área comum?',
  'Como fazer obras em área comum?',
]

let _id = 1

// Chama nosso proxy /api/chat (stream de texto puro)
async function callChatStream(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onChunk: (chunk: string) => void,
  signal: AbortSignal
): Promise<void> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  })

  if (!res.ok || !res.body) throw new Error(`Chat ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    if (chunk) onChunk(chunk)
  }
}

export default function TabIA() {
  const [msgs, setMsgs] = useState<Msg[]>([{
    id: 0, role: 'ia',
    text: 'Olá! Sou o **Assistente IA do Raízes Vila Matilde**. 👋\n\nEspecialista em legislação condominial — multas, assembleias, inadimplência, animais, obras e muito mais.\n\nComo posso ajudar você hoje?'
  }])
  const [streaming, setStreaming] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const msgsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const scrollDown = useCallback(() => {
    setTimeout(() => {
      if (msgsRef.current) {
        msgsRef.current.scrollTop = msgsRef.current.scrollHeight
      }
    }, 40)
  }, [])

  useEffect(() => { scrollDown() }, [msgs, scrollDown])

  // Escapa HTML antes de formatar (evita XSS de resposta da IA)
  function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  function renderText(text: string): string {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,.08);padding:1px 5px;border-radius:4px;font-size:.9em">$1</code>')
      .replace(/\n/g, '<br>')
  }

  function buildHistory(list: Msg[]): { role: 'user' | 'assistant'; content: string }[] {
    return list
      .filter(m => m.id > 0)
      .map(m => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }))
  }

  async function send(txt?: string) {
    const text = (txt || input).trim()
    if (!text || streaming) return

    setError('')
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'

    const userMsg: Msg = { id: _id++, role: 'user', text }
    const aiId = _id++

    setMsgs(prev => [
      ...prev,
      userMsg,
      { id: aiId, role: 'ia', text: '', streaming: true }
    ])
    setStreaming(true)

    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    let accumulated = ''
    const onChunk = (chunk: string) => {
      accumulated += chunk
      setMsgs(prev => prev.map(m =>
        m.id === aiId ? { ...m, text: accumulated, streaming: true } : m
      ))
      scrollDown()
    }

    try {
      const history = [
        ...buildHistory(msgs),
        { role: 'user' as const, content: text }
      ]
      await callChatStream(history, onChunk, signal)
    } catch (err) {
      if (signal.aborted) return
      setError('Não foi possível conectar ao assistente. Tente novamente.')
      setMsgs(prev => prev.filter(m => m.id !== aiId))
      setStreaming(false)
      return
    }

    setMsgs(prev => prev.map(m =>
      m.id === aiId ? { ...m, text: accumulated || '…', streaming: false } : m
    ))
    setStreaming(false)
  }

  function stopStreaming() {
    abortRef.current?.abort()
    setStreaming(false)
    setMsgs(prev => prev.map(m =>
      m.streaming ? { ...m, streaming: false } : m
    ))
  }

  return (
    <div className="ia-root">
      <div className="chat-wrap">

        <div className="chat-head">
          <div className="chat-av-wrap">
            <div className="chat-av">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <span className="online-dot" />
          </div>
          <div className="chat-head-info">
            <h4>Assistente IA · Raízes</h4>
            <p><span className="online-txt">● Online</span> · Especialista condominial</p>
          </div>
          <div className="ia-badge">IA</div>
        </div>

        <div className="chat-msgs" ref={msgsRef}>
          {msgs.map(msg => (
            <div key={msg.id} className={`msg msg-${msg.role}`}>
              <div className="msg-av">{msg.role === 'ia' ? 'IA' : 'SÍ'}</div>
              <div
                className={`bub ${msg.streaming ? 'stream-cursor' : ''}`}
                dangerouslySetInnerHTML={{
                  __html: msg.text
                    ? renderText(msg.text)
                    : (msg.streaming ? '' : '…')
                }}
              />
            </div>
          ))}

          {streaming && msgs[msgs.length - 1]?.text === '' && (
            <div className="msg msg-ia">
              <div className="msg-av">IA</div>
              <div className="bub typing-bub"><span /><span /><span /></div>
            </div>
          )}

          {error && (
            <div className="chat-error">
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="sugs-row">
          {SUGS.map(s => (
            <button key={s} className="sug-chip" onClick={() => send(s)}>{s}</button>
          ))}
        </div>

        <div className="chat-inp-area">
          <textarea
            ref={inputRef}
            className="chat-inp"
            value={input}
            rows={1}
            placeholder="Pergunte sobre legislação, multas, assembleias…"
            disabled={streaming}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
          <button
            className={`chat-send ${(input.trim() || streaming) ? 'active' : ''}`}
            onClick={streaming ? stopStreaming : () => send()}
            title={streaming ? 'Parar' : 'Enviar'}
          >
            {streaming ? (
              <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            ) : (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <aside className="ia-aside">
        <div className="aside-card">
          <h5>⚡ Perguntas rápidas</h5>
          {SUGS.map(s => (
            <div key={s} className="aside-sug" onClick={() => send(s)}>
              <span className="aside-dot" />{s}
            </div>
          ))}
        </div>
        <div className="aside-card">
          <h5>⚖️ Base legal</h5>
          {[
            ['CC 10.406/02', 'Arts. 1.331–1.358'],
            ['Lei 4.591/64', 'Lei do Condomínio'],
            ['Lei 8.245/91', 'Lei do Inquilinato'],
            ['ABNT 5674',    'Manutenção predial'],
          ].map(([tag, desc]) => (
            <div key={tag} className="lei-item">
              <span className="lei-tag">{tag}</span>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}

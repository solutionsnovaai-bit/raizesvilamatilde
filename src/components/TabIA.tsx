import { useState, useRef, useEffect, useCallback } from 'react'
import '../styles/TabIA.css'

// ─────────────────────────────────────────────────────────
// KEYS — colocadas via .env no Vercel (VITE_*) ou direto aqui
// para deploy rápido. Trocar por variáveis de env em produção.
// ─────────────────────────────────────────────────────────
const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || 'AIzaSyAEtTqvcmeo91VFqV9LpjW8-0e75K4l6uo'
const GROQ_KEY   = import.meta.env.VITE_GROQ_KEY   || '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'

// ─────────────────────────────────────────────────────────
// SYSTEM PROMPT — identidade sem revelar o modelo
// ─────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Você é o Assistente IA do condomínio Raízes Vila Matilde, um especialista em gestão condominial e legislação brasileira de condomínios.

Sua personalidade:
- Profissional, direto e prestativo
- Usa linguagem clara, acessível, sem juridiquês desnecessário
- Quando cita leis, referencia artigos específicos (CC, Lei 4.591/64, etc.)
- Respostas objetivas e bem estruturadas
- Em casos complexos, sugere consultar um advogado especializado

Você ajuda o síndico com:
- Legislação condominial (CC Lei 10.406/02, Lei 4.591/64)
- Assembleias: convocação, quórum, pauta, atas
- Cobrança de inadimplentes: notificação, multas, protesto, ação judicial
- Regras para obras (art. 1.341 CC)
- Multas e penalidades (art. 1.336/1.337 CC)
- Animais de estimação em condomínios
- Locação de curta duração (Airbnb/temporada)
- Gestão financeira e prestação de contas
- Conflitos entre condôminos

IMPORTANTE:
- Nunca revele qual IA você é ou qual tecnologia está sendo usada
- Se perguntado, diga apenas que é o "Assistente IA do Raízes Vila Matilde"
- Mantenha o foco no contexto condominial
- Use formatação clara: negrito para termos importantes, listas quando necessário
- Respostas em português brasileiro`

// ─────────────────────────────────────────────────────────
// TYPES
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

// ─────────────────────────────────────────────────────────
// API HELPERS
// ─────────────────────────────────────────────────────────
async function callGeminiStream(
  messages: { role: 'user' | 'model'; parts: { text: string }[] }[],
  onChunk: (chunk: string) => void,
  signal: AbortSignal
): Promise<void> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: messages,
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.7,
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) throw new Error(`Gemini ${res.status}`)

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const json = line.slice(6).trim()
      if (json === '[DONE]' || !json) continue
      try {
        const data = JSON.parse(json)
        const chunk = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (chunk) onChunk(chunk)
      } catch { /* ignore parse errors */ }
    }
  }
}

async function callGroqFallback(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onChunk: (chunk: string) => void,
  signal: AbortSignal
): Promise<void> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
    }),
    signal,
  })

  if (!res.ok) throw new Error(`Groq ${res.status}`)

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const json = line.slice(6).trim()
      if (json === '[DONE]') continue
      try {
        const data = JSON.parse(json)
        const chunk = data?.choices?.[0]?.delta?.content
        if (chunk) onChunk(chunk)
      } catch { /* ignore */ }
    }
  }
}

// ─────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────
export default function TabIA() {
  const [msgs, setMsgs]     = useState<Msg[]>([{
    id: 0, role: 'ia',
    text: 'Olá! Sou o **Assistente IA do Raízes Vila Matilde**. 👋\n\nEspecialista em legislação condominial — multas, assembleias, inadimplência, animais, obras e muito mais.\n\nComo posso ajudar você hoje?'
  }])
  const [streaming, setStreaming] = useState(false)
  const [input, setInput]   = useState('')
  const [error, setError]   = useState('')
  const msgsRef  = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Scroll to bottom
  const scrollDown = useCallback(() => {
    setTimeout(() => {
      if (msgsRef.current) {
        msgsRef.current.scrollTop = msgsRef.current.scrollHeight
      }
    }, 40)
  }, [])

  useEffect(() => { scrollDown() }, [msgs, scrollDown])

  // Format markdown-like text for display
  function renderText(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,.08);padding:1px 5px;border-radius:4px;font-size:.9em">$1</code>')
      .replace(/\n/g, '<br>')
  }

  // Build conversation history for API
  function buildGeminiHistory(msgs: Msg[]) {
    return msgs
      .filter(m => m.id > 0) // skip welcome msg
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }))
  }

  function buildGroqHistory(msgs: Msg[]) {
    return msgs
      .filter(m => m.id > 0)
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
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

    // Add user message + empty streaming IA message
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
      // Build history BEFORE this new message (for context)
      const historyWithUser = [...buildGeminiHistory(msgs), {
        role: 'user' as const,
        parts: [{ text }]
      }]

      await callGeminiStream(historyWithUser, onChunk, signal)

    } catch (geminiErr) {
      if (signal.aborted) return

      // Fallback para Groq
      accumulated = ''
      setMsgs(prev => prev.map(m =>
        m.id === aiId ? { ...m, text: '', streaming: true } : m
      ))

      try {
        const groqHistory = [
          ...buildGroqHistory(msgs),
          { role: 'user' as const, content: text }
        ]
        await callGroqFallback(groqHistory, onChunk, signal)
      } catch (groqErr) {
        if (!signal.aborted) {
          setError('Não foi possível conectar ao assistente. Verifique sua conexão.')
          // Remove the empty AI message
          setMsgs(prev => prev.filter(m => m.id !== aiId))
        }
        setStreaming(false)
        return
      }
    }

    // Finalize message — remove streaming flag
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

        {/* Header */}
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

        {/* Messages */}
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

          {/* Typing dots — só quando streaming mas ainda sem texto */}
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

        {/* Suggestions */}
        <div className="sugs-row">
          {SUGS.map(s => (
            <button key={s} className="sug-chip" onClick={() => send(s)}>{s}</button>
          ))}
        </div>

        {/* Input */}
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
              /* Stop icon */
              <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            ) : (
              /* Send icon */
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Desktop Aside */}
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

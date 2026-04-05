import { useState, useRef } from 'react'
import '../styles/TabComunicados.css'

type State = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

interface Props { onSent?: () => void }

export default function TabComunicados({ onSent }: Props) {
  const [state, setState]     = useState<State>('idle')
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setFileName(file.name)
    setState('uploading')
    setProgress(0)
    setErrorMsg('')

    // Barra de progresso animada enquanto faz upload
    let p = 0
    const iv = setInterval(() => {
      p += Math.random() * 15
      setProgress(Math.min(p, 88))
      if (p >= 88) clearInterval(iv)
    }, 160)

    try {
      const formData = new FormData()
      formData.append('arquivo', file, file.name)

      const res = await fetch('/api/send', {
        method: 'POST',
        body: formData,
      })

      clearInterval(iv)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Erro ${res.status}`)
      }

      setProgress(100)
      setState('processing')

      // Aguarda Make + Gemini processar (feedback visual)
      setTimeout(() => {
        setState('done')
        onSent?.() // notifica App para incrementar contador
      }, 3500)

    } catch (err) {
      clearInterval(iv)
      setErrorMsg(err instanceof Error ? err.message : 'Erro desconhecido')
      setState('error')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  function reset() {
    setState('idle'); setProgress(0); setFileName(''); setErrorMsg('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="tab-scroll">
      <div className="tab-inner">
        <h1 className="tab-title anim-up">Gerar comunicado</h1>
        <p className="tab-sub anim-up d1">Envie o documento · a IA cria o comunicado perfeito</p>

        {/* IDLE */}
        {state === 'idle' && (
          <div
            className={`upload-zone anim-up d2 ${dragging ? 'drag' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <input ref={fileRef} type="file" style={{ display: 'none' }}
              accept=".pdf,.doc,.docx"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            <div className="up-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <h3>Arraste o documento aqui</h3>
            <p>ou toque para selecionar do dispositivo</p>
            <div className="type-chips">
              {['📋 ATA', '💰 Financeiro', '📅 Convocação', '🔔 Aviso'].map(t => (
                <span key={t} className="type-chip">{t}</span>
              ))}
            </div>
            <button className="btn-primary" onClick={e => { e.stopPropagation(); fileRef.current?.click() }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Selecionar arquivo
            </button>
            <p className="up-note">PDF · DOC · DOCX · até 4,5 MB</p>
          </div>
        )}

        {/* UPLOADING */}
        {state === 'uploading' && (
          <div className="status-card anim-up">
            <div className="s-icon spin">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </div>
            <div className="s-text">
              <h4>Enviando documento…</h4>
              <p className="s-fname">{fileName}</p>
              <div className="prog-bar"><div className="prog-fill" style={{ width: `${progress}%` }} /></div>
              <span className="prog-pct">{Math.round(progress)}%</span>
            </div>
          </div>
        )}

        {/* PROCESSING */}
        {state === 'processing' && (
          <div className="status-card anim-up">
            <div className="s-icon spin gold">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <div className="s-text">
              <h4>IA processando…</h4>
              <p>Gemini está gerando o comunicado para os moradores</p>
              <div className="prog-bar"><div className="prog-indet" /></div>
            </div>
          </div>
        )}

        {/* DONE */}
        {state === 'done' && (
          <div className="status-card done anim-up">
            <div className="s-icon ok">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="s-text">
              <h4>Enviado com sucesso! ✅</h4>
              <p>A automação foi acionada — o comunicado chegará no seu e-mail em instantes.</p>
            </div>
            <button className="btn-ghost" onClick={reset}>Novo</button>
          </div>
        )}

        {/* ERROR */}
        {state === 'error' && (
          <div className="status-card err anim-up">
            <div className="s-icon erro">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="s-text">
              <h4>Falha no envio ⚠️</h4>
              <p>{errorMsg || 'Verifique as variáveis de ambiente no Vercel.'}</p>
            </div>
            <button className="btn-ghost" onClick={reset}>Tentar novamente</button>
          </div>
        )}

        <div className="tip-card anim-up d3">
          <span className="tip-icon">💡</span>
          <div><strong>Como funciona:</strong> O documento vai para a automação no Make, o Gemini AI gera o comunicado e entrega no seu e-mail automaticamente.</div>
        </div>
      </div>
    </div>
  )
}

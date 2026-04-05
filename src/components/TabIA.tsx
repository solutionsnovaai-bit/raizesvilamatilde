import { useState, useRef, useEffect } from 'react'
import '../styles/TabIA.css'

interface Msg { id: number; role: 'ia' | 'user'; html: boolean; text: string }

const RESPS: Record<string, string> = {
  airbnb:   `Com base no <strong>REsp 1.819.075/RS (STJ 2020)</strong>, o condomínio <strong>pode proibir</strong> Airbnb desde que aprovado em assembleia por maioria qualificada e inserido na convenção.<br><br>Sem vedação expressa, a Lei 8.245/91 (art. 48) permite a locação.<br><br>💡 <em>Recomendo levar à pauta na próxima assembleia.</em>`,
  inadimpl: `Fluxo correto de cobrança:<br><br>① Notificação extrajudicial com AR<br>② Multa <strong>2%</strong> + juros <strong>1%/mês</strong> + IPCA (Art. 1.336 §1º CC)<br>③ Protesto em cartório (Lei 9.492/97)<br>④ Ação de cobrança ou execução<br><br>⏱ Prescrição: <strong>5 anos</strong> (Art. 206 §5º I CC).`,
  quorum:   `Quóruns essenciais:<br><br>• <strong>Alterar convenção:</strong> 2/3 de todos os condôminos (Art. 1.351 CC)<br>• <strong>Destituir síndico:</strong> maioria absoluta + metade das frações ideais<br>• <strong>2ª convocação:</strong> sem quórum mínimo (30 min após a 1ª)<br>• <strong>Obras voluptuárias:</strong> 2/3 dos votos presentes`,
  barulho:  `Art. 1.336, IV CC — dever de não perturbar o sossego.<br><br>① Registre a ocorrência formalmente<br>② Notifique o infrator<br>③ 1ª infração: até <strong>5×</strong> a cota (Art. 1.336 §2º)<br>④ Reincidência: até <strong>10×</strong> (Art. 1.337 CC)<br><br>📎 Guarde provas: áudios, fotos e registros escritos.`,
  pet:      `STJ posição consolidada (AREsp 1.454.083): condomínio pode <strong>regulamentar</strong> mas <strong>não pode proibir totalmente</strong> animais domésticos nas unidades.<br><br>💡 Crie um regulamento específico aprovado em assembleia.`,
  multa:    `A multa condominial deve estar prevista na convenção ou regulamento interno. O CC permite:<br><br>• <strong>Até 2%</strong> do valor da cota por atraso (Art. 1.336 §1º)<br>• <strong>Até 5×</strong> a cota por infração de conduta (Art. 1.336 §2º)<br>• <strong>Até 10×</strong> por reincidência (Art. 1.337)<br><br>Sempre notifique antes de aplicar.`,
  obra:     `Para obras em áreas comuns:<br><br>• <strong>Obras úteis:</strong> maioria simples dos presentes<br>• <strong>Obras voluptuárias:</strong> 2/3 dos presentes<br>• <strong>Obras necessárias urgentes:</strong> síndico pode executar sem assembleia<br><br>Documente tudo com ATA e guarde os orçamentos aprovados.`,
  default:  `Com base no <strong>Código Civil (Lei 10.406/02)</strong> e na Lei 4.591/64, toda deliberação que afete os condôminos deve, preferencialmente, passar por assembleia para ter força vinculante.<br><br>Pode me dar mais detalhes da situação? Assim consigo orientar com mais precisão para o contexto do <strong>Raízes Vila Matilde</strong>. 🏢`,
}

function getResp(txt: string): string {
  const t = txt.toLowerCase()
  if (t.includes('airbnb') || t.includes('temporada') || t.includes('aluguel')) return RESPS.airbnb
  if (t.includes('inadimpl') || t.includes('cobran') || t.includes('devendo') || t.includes('devedor')) return RESPS.inadimpl
  if (t.includes('quórum') || t.includes('quorum') || t.includes('conven') || t.includes('assembleia') || t.includes('assemblé')) return RESPS.quorum
  if (t.includes('barulho') || t.includes('ruído') || t.includes('22h') || t.includes('silêncio') || t.includes('perturbação')) return RESPS.barulho
  if (t.includes('pet') || t.includes('animal') || t.includes('cachorro') || t.includes('gato')) return RESPS.pet
  if (t.includes('multa') || t.includes('penalidade')) return RESPS.multa
  if (t.includes('obra') || t.includes('reforma') || t.includes('construção')) return RESPS.obra
  return RESPS.default
}

const SUGS = [
  'Posso proibir Airbnb?',
  'Como cobrar inadimplente?',
  'Quórum para alterar convenção?',
  'Multar barulho após 22h?',
  'Pet em área comum?',
  'Obras em área comum?',
]

let _id = 1

export default function TabIA() {
  const [msgs, setMsgs]       = useState<Msg[]>([{
    id: 0, role: 'ia', html: true,
    text: `Olá! Sou o <strong>Assistente IA do Raízes Vila Matilde</strong>. 👋<br><br>Especialista em legislação condominial — multas, assembleias, inadimplência, pets, obras e muito mais.<br><br>Como posso ajudar você hoje?`
  }])
  const [typing, setTyping]   = useState(false)
  const [input, setInput]     = useState('')
  const msgsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  function scrollDown() {
    setTimeout(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight }, 60)
  }
  useEffect(() => { scrollDown() }, [msgs, typing])

  function send(txt?: string) {
    const text = (txt || input).trim()
    if (!text || typing) return
    setMsgs(m => [...m, { id: _id++, role: 'user', html: false, text }])
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setTyping(true)
    const delay = 1400 + Math.random() * 900
    setTimeout(() => {
      setTyping(false)
      setMsgs(m => [...m, { id: _id++, role: 'ia', html: true, text: getResp(text) }])
    }, delay)
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
          <div className="ia-badge">DEMO</div>
        </div>

        {/* Mensagens */}
        <div className="chat-msgs" ref={msgsRef}>
          {msgs.map(msg => (
            <div key={msg.id} className={`msg msg-${msg.role}`}>
              <div className="msg-av">{msg.role === 'ia' ? 'IA' : 'SÍ'}</div>
              {msg.html
                ? <div className="bub" dangerouslySetInnerHTML={{ __html: msg.text }} />
                : <div className="bub">{msg.text}</div>}
            </div>
          ))}
          {typing && (
            <div className="msg msg-ia">
              <div className="msg-av">IA</div>
              <div className="bub typing-bub"><span /><span /><span /></div>
            </div>
          )}
        </div>

        {/* Sugestões scroll horizontal */}
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
            onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          />
          <button
            className={`chat-send ${input.trim() ? 'active' : ''}`}
            onClick={() => send()}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Sidebar desktop */}
      <aside className="ia-aside">
        <div className="aside-notice">
          <span className="notice-icon">🔧</span>
          <div>
            <strong>Modo Demo</strong>
            <p>Em breve conectado ao Gemini via Make para respostas em tempo real.</p>
          </div>
        </div>
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
          {[['CC 10.406/02','Arts. 1.331–1.358'],['Lei 4.591/64','Lei do Condomínio'],['Lei 8.245/91','Lei do Inquilinato'],['ABNT 5674','Manutenção predial']].map(([tag,desc]) => (
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

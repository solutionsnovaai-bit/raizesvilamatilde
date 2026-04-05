import { useState } from 'react'
import '../styles/TabHistorico.css'

type DocType = 'ata' | 'fin' | 'conv' | 'avi'
type Filter  = '' | DocType

export interface HistDoc {
  id: number
  tipo: DocType
  nome: string
  data: string
  hora: string
  texto: string
}

const TIPO = {
  ata:  { emoji: '📋', label: 'ATA',        pill: 'pill-ata',  ic: 'ic-ata'  },
  fin:  { emoji: '💰', label: 'Financeiro', pill: 'pill-fin',  ic: 'ic-fin'  },
  conv: { emoji: '📅', label: 'Convocação', pill: 'pill-conv', ic: 'ic-conv' },
  avi:  { emoji: '🔔', label: 'Aviso',      pill: 'pill-avi',  ic: 'ic-avi'  },
}

const ICONS: Record<DocType, React.ReactNode> = {
  ata:  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  fin:  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  conv: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  avi:  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
}

interface Props { docs: HistDoc[] }

export default function TabHistorico({ docs }: Props) {
  const [filter, setFilter] = useState<Filter>('')
  const [modal, setModal]   = useState<HistDoc | null>(null)

  const filtered = filter ? docs.filter(d => d.tipo === filter) : docs

  return (
    <div className="tab-scroll">
      <div className="tab-inner">
        <h1 className="tab-title anim-up">Histórico</h1>
        <p className="tab-sub anim-up d1">Todos os comunicados gerados · toque para visualizar</p>

        <div className="hist-filters anim-up d2">
          {([['', 'Todos'], ['ata', '📋 ATAs'], ['fin', '💰 Financeiro'], ['conv', '📅 Convocações'], ['avi', '🔔 Avisos']] as [Filter,string][]).map(([v, l]) => (
            <button key={v} className={`fchip ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="hist-empty anim-up d3">
            <div className="empty-icon">📂</div>
            <h3>Nenhum comunicado ainda</h3>
            <p>Envie um documento na aba Comunicados para começar.</p>
          </div>
        ) : (
          <div className="hist-list">
            {filtered.map((doc, i) => {
              const cfg = TIPO[doc.tipo]
              return (
                <div
                  key={doc.id}
                  className="hist-row anim-up"
                  style={{ animationDelay: `${0.05 + i * 0.055}s` }}
                  onClick={() => setModal(doc)}
                >
                  <div className={`hist-ic ${cfg.ic}`}>{ICONS[doc.tipo]}</div>
                  <div className="hist-info">
                    <div className="hist-nome">{doc.nome}</div>
                    <div className="hist-meta">
                      <span className={`pill ${cfg.pill}`}>{cfg.label}</span>
                      {doc.data} · {doc.hora}
                    </div>
                  </div>
                  <div className="hist-acts" onClick={e => e.stopPropagation()}>
                    <button className="ic-btn" title="Baixar">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                    <button className="ic-btn" title="Reenviar">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-ov" onClick={() => setModal(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-head">
              <div className={`modal-ic ${TIPO[modal.tipo].ic}`}>{TIPO[modal.tipo].emoji}</div>
              <div className="modal-tg">
                <h3>{modal.nome}</h3>
                <p>{modal.data} · {modal.hora} · Raízes Vila Matilde</p>
              </div>
              <button className="modal-close" onClick={() => setModal(null)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body"><pre className="modal-pre">{modal.texto}</pre></div>
            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setModal(null)}>Fechar</button>
              <button className="btn-primary">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Baixar .docx
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

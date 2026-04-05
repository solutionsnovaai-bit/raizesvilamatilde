import { useState } from 'react'
import { Tab } from '../App'
import { HistDoc } from './TabHistorico'
import NavBottom from './NavBottom'
import TabComunicados from './TabComunicados'
import TabHistorico from './TabHistorico'
import TabIA from './TabIA'
import TabDashboard from './TabDashboard'
import '../styles/Portal.css'

const LOGO_HEADER = "data:image/jpeg;base64,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"

interface Props {
  activeTab: Tab
  setActiveTab: (t: Tab) => void
  onLogout: () => void
}

let _docId = 1
const TIPOS = ['ata','fin','conv','avi'] as const

export default function Portal({ activeTab, setActiveTab, onLogout }: Props) {
  const [docs, setDocs]   = useState<HistDoc[]>([])
  const [total, setTotal] = useState(0)

  function onSent() {
    const now = new Date()
    const tipo = TIPOS[Math.floor(Math.random() * TIPOS.length)]
    const nomes = {
      ata:  'ATA de Assembleia',
      fin:  'Balancete Financeiro',
      conv: 'Convocação de Assembleia',
      avi:  'Aviso aos Moradores',
    }
    const newDoc: HistDoc = {
      id: _docId++,
      tipo,
      nome: `${nomes[tipo]} — ${now.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}`,
      data: now.toLocaleDateString('pt-BR'),
      hora: now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) + 'h',
      texto: `Documento processado automaticamente pelo Portal Raízes VM.\nEnviado em: ${now.toLocaleString('pt-BR')}\nTipo detectado: ${nomes[tipo]}\n\nO comunicado completo foi gerado pelo Gemini AI e enviado\npara os moradores do Raízes Vila Matilde.`,
    }
    setDocs(d => [newDoc, ...d])
    setTotal(t => t + 1)
  }

  return (
    <div className="portal-root">
      <header className="portal-header">
        <div className="portal-header-logo">
          <img
            src={LOGO_HEADER}
            alt="Raízes Vila Matilde"
            className="header-logo-img"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const p = e.currentTarget.parentElement
              if (p) p.innerHTML = '<div class="header-logo-fb"><span>raízes</span><small>VILA MATILDE</small></div>'
            }}
          />
        </div>
        <div className="portal-header-right">
          <div className="user-pill">
            <div className="user-av">SÍ</div>
            <span className="user-name">Síndico</span>
          </div>
          <button className="btn-sair" onClick={onLogout}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair
          </button>
        </div>
      </header>

      <div className="portal-content">
        {activeTab === 'comunicados' && <TabComunicados onSent={onSent} />}
        {activeTab === 'historico'   && <TabHistorico docs={docs} />}
        {activeTab === 'ia'          && <TabIA />}
        {activeTab === 'dashboard'   && <TabDashboard totalEnviados={total} />}
      </div>

      <NavBottom active={activeTab} setActive={setActiveTab} />
    </div>
  )
}

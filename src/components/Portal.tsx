import { useState } from 'react'
import { Tab } from '../App'
import { HistDoc } from './TabHistorico'
import NavBottom from './NavBottom'
import TabComunicados from './TabComunicados'
import TabHistorico from './TabHistorico'
import TabIA from './TabIA'
import TabDashboard from './TabDashboard'
import '../styles/Portal.css'
import { LOGO_SRC } from './logo'


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
      texto: `Documento processado automaticamente pelo Portal Raízes VM.\nEnviado em: ${now.toLocaleString('pt-BR')}\nTipo: ${nomes[tipo]}\n\nO comunicado foi gerado pelo Gemini AI e enviado\npara os moradores do Raízes Vila Matilde.`,
    }
    setDocs(d => [newDoc, ...d])
    setTotal(t => t + 1)
  }

  return (
    <div className="portal-root">
      <header className="portal-header">
        <div className="portal-header-logo">
          <img
            src={LOGO_SRC}
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

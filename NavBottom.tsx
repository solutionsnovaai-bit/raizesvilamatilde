import { Tab } from '../App'
import '../styles/NavBottom.css'

const ITEMS = [
  {
    id: 'comunicados' as Tab, label: 'Comunicados',
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  },
  {
    id: 'historico' as Tab, label: 'Histórico',
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  },
  {
    id: 'ia' as Tab, label: 'IA',
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
  },
  {
    id: 'dashboard' as Tab, label: 'Dashboard',
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  },
]

interface Props { active: Tab; setActive: (t: Tab) => void }

export default function NavBottom({ active, setActive }: Props) {
  return (
    <nav className="nav-bottom">
      {ITEMS.map(item => (
        <button
          key={item.id}
          className={`nav-btn ${active === item.id ? 'active' : ''}`}
          onClick={() => setActive(item.id)}
        >
          {active === item.id && <span className="nav-indicator" />}
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

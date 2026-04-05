import { useState } from 'react'
import Login from './components/Login'
import Portal from './components/Portal'

export type Tab = 'comunicados' | 'historico' | 'ia' | 'dashboard'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('comunicados')

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />
  }

  return (
    <Portal
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={() => { setLoggedIn(false); setActiveTab('comunicados') }}
    />
  )
}

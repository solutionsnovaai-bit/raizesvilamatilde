import { useState, useRef } from 'react'
import '../styles/Login.css'
import { LOGO_SRC } from './logo'


// Credenciais válidas
const VALID_EMAIL = "sindico"
const VALID_PASS  = "vilamatilde"

interface Props { onLogin: () => void }

export default function Login({ onLogin }: Props) {
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  function handleLogin(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    setError('')

    if (email.trim() !== VALID_EMAIL || password !== VALID_PASS) {
      setError('E-mail ou senha incorretos.')
      return
    }

    // Ripple
    const btn = btnRef.current
    if (btn) {
      const r = document.createElement('span')
      r.className = 'ripple-el'
      const rect = btn.getBoundingClientRect()
      r.style.left = (e.clientX - rect.left - 30) + 'px'
      r.style.top  = (e.clientY - rect.top  - 30) + 'px'
      btn.appendChild(r)
      setTimeout(() => r.remove(), 700)
    }

    setLoading(true)
    setTimeout(() => { setLoading(false); onLogin() }, 900)
  }

  return (
    <div className="login-root">
      <div className="login-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="login-card">
        <div className="login-logo-wrap">
          <img
            src={LOGO_SRC}
            alt="Raízes Vila Matilde"
            className="login-logo-img"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const p = e.currentTarget.parentElement
              if (p) p.innerHTML = '<div class="logo-fb"><span>raízes</span><small>VILA MATILDE</small></div>'
            }}
          />
        </div>

        <div className="login-badge"><span className="badge-dot" />Portal do Síndico</div>
        <h1 className="login-titulo">Bem-vindo</h1>
        <p className="login-sub">Acesse o portal de gestão condominial</p>

        <div className="login-field">
          <label>E-mail</label>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && btnRef.current?.click()}
          />
        </div>

        <div className="login-field">
          <label>Senha</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && btnRef.current?.click()}
          />
        </div>

        {error && <div className="login-error">⚠️ {error}</div>}

        <button
          ref={btnRef}
          className="btn-login ripple-container"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? <span className="login-spinner" /> : <>Acessar portal <span className="btn-arrow">→</span></>}
        </button>
      </div>
    </div>
  )
}

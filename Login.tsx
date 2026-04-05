import { useState, useRef } from 'react'
import '../styles/Login.css'

const LOGO_SRC = "data:image/jpeg;base64,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"

// Credenciais válidas
const VALID_EMAIL = "sindicoai@raizes.com"
const VALID_PASS  = "vilamatilde1"

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

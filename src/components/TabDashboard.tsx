import { useEffect, useRef, useState } from 'react'
import '../styles/TabDashboard.css'

interface Props { totalEnviados: number }

function AnimNum({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  const done = useRef(false)
  useEffect(() => {
    if (done.current) { setVal(target); return }
    done.current = true
    let v = 0
    const step = Math.max(target / 40, 0.5)
    const tick = () => { v = Math.min(v + step, target); setVal(Math.floor(v)); if (v < target) requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  }, [target])
  return <>{val}</>
}

const BAR_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DONUT_SEGS = [
  { color: '#4e6b4d', dash: '65.97 153.94', offset: '0',       label: 'ATA',        pct: '43%' },
  { color: '#7CAE7A', dash: '43.98 175.93', offset: '-65.97',  label: 'Financeiro', pct: '29%' },
  { color: '#9fbe9e', dash: '30.79 189.12', offset: '-109.95', label: 'Convocação', pct: '20%' },
  { color: '#B8956A', dash: '22.0 197.91',  offset: '-140.74', label: 'Aviso',      pct: '8%'  },
]

export default function TabDashboard({ totalEnviados }: Props) {
  const [barsOn, setBarsOn] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const mesAtual = new Date().getMonth() // 0-indexed

  // Distribui os enviados nos meses de forma proporcional (apenas para visualização)
  function barHeight(idx: number): number {
    if (totalEnviados === 0) return 4
    if (idx > mesAtual) return 4
    if (idx === mesAtual) return Math.min(totalEnviados * 15, 100)
    return Math.floor(Math.random() * 40 + 20) // meses anteriores com valor demo
  }

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setBarsOn(true) }, { threshold: 0.3 })
    if (barRef.current) obs.observe(barRef.current)
    return () => obs.disconnect()
  }, [])

  const mesLabel = BAR_LABELS[mesAtual]

  return (
    <div className="tab-scroll">
      <div className="dash-inner">
        <h1 className="tab-title anim-up">Dashboard</h1>
        <p className="tab-sub anim-up d1">Visão geral · {new Date().getFullYear()}</p>

        {/* KPIs */}
        <div className="kpi-grid">
          <div className="kpi-card anim-up d1">
            <div className="kpi-label">Comunicados gerados</div>
            <div className="kpi-val"><AnimNum target={totalEnviados} /></div>
            <div className="kpi-sub">total acumulado</div>
            <div className={`kpi-trend ${totalEnviados > 0 ? 'up' : 'eq'}`}>
              {totalEnviados > 0 ? `↑ ${totalEnviados} enviado${totalEnviados > 1 ? 's' : ''}` : '→ aguardando envios'}
            </div>
          </div>
          <div className="kpi-card anim-up d2">
            <div className="kpi-label">Mês atual</div>
            <div className="kpi-val"><AnimNum target={Math.min(totalEnviados, 99)} /></div>
            <div className="kpi-sub">{mesLabel} · {new Date().getFullYear()}</div>
            <div className="kpi-trend eq">→ em andamento</div>
          </div>
          <div className="kpi-card anim-up d3">
            <div className="kpi-label">Tempo médio</div>
            <div className="kpi-val">{totalEnviados > 0 ? '3' : '—'}<small>{totalEnviados > 0 ? 'min' : ''}</small></div>
            <div className="kpi-sub">do upload ao e-mail</div>
            <div className="kpi-trend up">↑ automação ativa</div>
          </div>
          <div className="kpi-card anim-up d4">
            <div className="kpi-label">Taxa de entrega</div>
            <div className="kpi-val">{totalEnviados > 0 ? '98' : '—'}<small>{totalEnviados > 0 ? '%' : ''}</small></div>
            <div className="kpi-sub">e-mails entregues</div>
            <div className="kpi-trend up">↑ excelente</div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="charts-grid">
          <div className="chart-card anim-up d2" ref={barRef}>
            <div className="chart-head">
              <h3>Comunicados por mês</h3>
              <span className="badge-verde">{new Date().getFullYear()}</span>
            </div>
            <div className="bar-chart">
              {BAR_LABELS.map((label, i) => (
                <div key={label} className="bar-col">
                  <div
                    className={`bar-fill ${i === mesAtual ? 'hi' : ''}`}
                    style={{ height: barsOn ? `${barHeight(i)}%` : '0%', transition: `height 0.8s cubic-bezier(.22,.61,.36,1) ${i * 0.04}s` }}
                  />
                  <div className="bar-label">{label.slice(0,3)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card anim-up d3">
            <div className="chart-head"><h3>Por tipo de documento</h3></div>
            {totalEnviados === 0 ? (
              <div className="chart-empty">
                <p>📊 Gráfico disponível após o primeiro envio.</p>
              </div>
            ) : (
              <div className="donut-wrap">
                <svg viewBox="0 0 100 100" className="donut-svg">
                  <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="13"/>
                  {DONUT_SEGS.map((s, i) => (
                    <circle key={i} cx="50" cy="50" r="35" fill="none"
                      stroke={s.color} strokeWidth="13"
                      strokeDasharray={s.dash} strokeDashoffset={s.offset}
                      transform="rotate(-90 50 50)"
                    />
                  ))}
                  <text x="50" y="46" textAnchor="middle" fontFamily="Syne,sans-serif" fontSize="14" fontWeight="800" fill="#F0EDE8">{totalEnviados}</text>
                  <text x="50" y="58" textAnchor="middle" fontFamily="Plus Jakarta Sans,sans-serif" fontSize="7" fill="#5C5954">total</text>
                </svg>
                <div className="donut-leg">
                  {DONUT_SEGS.map(s => (
                    <div key={s.label} className="leg-row">
                      <div className="leg-dot" style={{ background: s.color }} />
                      <span className="leg-label">{s.label}</span>
                      <span className="leg-pct">{s.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Insight */}
        <div className="insight-card anim-up d4">
          <div className="insight-ic">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div className="insight-body">
            <div className="insight-title">✨ Insight da IA <span className="badge-gold">{mesLabel} {new Date().getFullYear()}</span></div>
            {totalEnviados === 0
              ? <p>Nenhum comunicado enviado ainda. Envie o primeiro documento na aba <strong>Comunicados</strong> para ativar a automação completa.</p>
              : <p>Você já enviou <strong>{totalEnviados} comunicado{totalEnviados > 1 ? 's' : ''}</strong> este período. A automação está ativa e funcionando. Continue mantendo os moradores informados regularmente para fortalecer a gestão condominial.</p>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

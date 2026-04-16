import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api'
import { useAuth } from '../App'

function riskColor(s) { return s >= 60 ? '#ff4444' : s >= 30 ? '#f5c542' : '#00ff88' }
function riskLabel(s) { return s >= 60 ? 'HIGH' : s >= 30 ? 'MEDIUM' : 'LOW' }

const SEV_ICONS = { ok: '✅', warning: '⚠️', critical: '❌', info: 'ℹ️' }
const SEV_COLORS = { ok: '#00ff88', warning: '#f5c542', critical: '#ff4444', info: '#00bfff' }

function ScanModal({ scan, onClose }) {
  if (!scan) return null

  const results = scan.results || []
  let currentCat = null

  async function download() {
    const token = localStorage.getItem('mr7_token')
    window.open(`http://localhost:8000/scan/${scan.id}/report?token=${token}`)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1.5rem',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'rgba(0,5,18,0.97)',
        border: '1px solid rgba(0,191,255,0.2)',
        borderRadius: 16,
        width: '100%', maxWidth: 780,
        maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Modal header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(0,191,255,0.1)' }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '1rem' }}>Scan #{scan.id}</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.78rem', fontFamily: 'Space Mono, monospace', marginTop: 2 }}>{scan.target_url}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className="btn btn-outline btn-sm" onClick={download}>⬇ Download</button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Risk score bar */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Risk Score</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '1.6rem', fontWeight: 700, color: riskColor(scan.risk_score) }}>{scan.risk_score}</span>
              <span style={{ padding: '2px 8px', background: `${riskColor(scan.risk_score)}22`, border: `1px solid ${riskColor(scan.risk_score)}44`, borderRadius: 100, fontSize: '0.7rem', fontWeight: 800, color: riskColor(scan.risk_score), letterSpacing: '0.06em' }}>{riskLabel(scan.risk_score)}</span>
            </div>
          </div>
          <div>
            <div style={{ height: 6, width: 200, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${scan.risk_score}%`, background: riskColor(scan.risk_score), borderRadius: 3 }} />
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{new Date(scan.created_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Tree output */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.2rem 1.5rem', fontFamily: 'Space Mono, monospace', fontSize: '0.76rem', lineHeight: 1.7 }}>
          <div style={{ color: 'var(--cyan)', marginBottom: 4 }}>mr7.ai scan: {scan.target_url}</div>
          <div style={{ color: 'rgba(255,255,255,0.15)', marginBottom: 6 }}>│</div>

          {results.map((r, i) => {
            const isNewCat = r.category !== currentCat
            if (isNewCat) currentCat = r.category
            const sColor = SEV_COLORS[r.severity] || '#00bfff'
            const sIcon  = SEV_ICONS[r.severity]  || 'ℹ️'
            return (
              <div key={i}>
                {isNewCat && (
                  <div style={{ marginTop: 10, marginBottom: 2 }}>
                    <span style={{ color: 'var(--cyan)' }}>├── </span>
                    <span style={{ color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>[{r.category}]</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: 2 }}>
                  <span style={{ color: 'rgba(255,255,255,0.2)', whiteSpace: 'pre' }}>│   ├── </span>
                  <span style={{ color: sColor }}>{sIcon} </span>
                  <span style={{ color: '#e0e8f0', fontWeight: 600 }}>{r.check}</span>
                  <span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 6px' }}>—</span>
                  <span style={{ color: sColor, opacity: 0.85, minWidth: 48 }}>[{r.status}]</span>
                  <span style={{ color: 'rgba(200,220,240,0.5)', marginLeft: 8, wordBreak: 'break-all' }}>{r.detail}</span>
                </div>
              </div>
            )
          })}

          {results.length === 0 && <div style={{ color: 'var(--muted)' }}>No results saved for this scan.</div>}

          <div style={{ color: 'rgba(255,255,255,0.15)', marginTop: 6 }}>│</div>
          <div style={{ color: 'var(--green)', marginTop: 4 }}>└── Scan complete.</div>
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, logout } = useAuth()
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    apiFetch('/scan/history').then(setScans).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const totalScans  = scans.length
  const criticalPct = scans.length
    ? Math.round(scans.filter(s => s.risk_score >= 60).length / scans.length * 100)
    : 0

  return (
    <div className="page-pad" style={{ minHeight: '100vh', padding: '2.5rem 1.5rem 4rem' }}>
      <div style={{ maxWidth: 950, margin: '0 auto' }}>

        {/* Profile header */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--cyan-dim)', border: '2px solid var(--cyan)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', fontWeight: 800, color: 'var(--cyan)',
            fontFamily: 'Space Mono, monospace', flexShrink: 0,
          }}>
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.02em' }}>{user?.username}</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 2 }}>{user?.email}</p>
            {user?.is_admin && (
              <span style={{ marginTop: 6, display: 'inline-block', padding: '2px 8px', background: 'rgba(245,197,66,0.1)', border: '1px solid rgba(245,197,66,0.3)', borderRadius: 6, fontSize: '0.7rem', color: '#f5c542', fontWeight: 800, letterSpacing: '0.06em' }}>
                ADMIN
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/scanner" className="btn btn-cyan btn-sm">⚡ New Scan</Link>
            {user?.is_admin && <Link to="/admin" className="btn btn-ghost btn-sm">🛡 Admin</Link>}
            <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Scans', val: totalScans, color: 'var(--cyan)' },
            { label: 'Member Since', val: user ? new Date(user.created_at).toLocaleDateString() : '—', color: 'var(--text)', small: true },
            { label: 'High Risk Scans', val: `${criticalPct}%`, color: criticalPct > 50 ? '#ff4444' : criticalPct > 20 ? '#f5c542' : '#00ff88' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1.2rem' }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: s.small ? '1rem' : '1.8rem', fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Scan history */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em', marginBottom: '1.2rem' }}>📋 Scan History</h2>

          {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
          {!loading && scans.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
              <p>No scans yet. <Link to="/scanner" style={{ color: 'var(--cyan)' }}>Run your first scan →</Link></p>
            </div>
          )}

          {scans.map(s => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
              padding: '0.9rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              cursor: 'pointer', transition: 'background 0.15s', borderRadius: 8,
            }}
              onClick={() => setSelected(s)}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,191,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Status dot */}
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.status === 'done' ? '#00ff88' : s.status === 'running' ? 'var(--cyan)' : '#f5c542', flexShrink: 0 }} />

              {/* URL */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.8rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.target_url}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>
                  {new Date(s.created_at).toLocaleString()} · Scan #{s.id}
                </div>
              </div>

              {/* Risk */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{
                  fontFamily: 'Space Mono, monospace', fontSize: '0.9rem', fontWeight: 700,
                  color: riskColor(s.risk_score),
                }}>{s.risk_score}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--muted)', marginLeft: 4 }}>/ 100</span>
                <div style={{ fontSize: '0.68rem', color: riskColor(s.risk_score), textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>{riskLabel(s.risk_score)}</div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setSelected(s) }}>View</button>
                <button className="btn btn-outline btn-sm" onClick={e => {
                  e.stopPropagation()
                  const token = localStorage.getItem('mr7_token')
                  window.open(`http://localhost:8000/scan/${s.id}/report?token=${token}`)
                }}>⬇</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && <ScanModal scan={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

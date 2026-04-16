import { useState, useEffect } from 'react'
import { apiFetch } from '../api'

function riskColor(s) { return s >= 60 ? '#ff4444' : s >= 30 ? '#f5c542' : '#00ff88' }
function riskLabel(s) { return s >= 60 ? 'HIGH' : s >= 30 ? 'MEDIUM' : 'LOW' }

export default function Admin() {
  const [tab, setTab]     = useState('users')
  const [users, setUsers] = useState([])
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [u, s] = await Promise.all([apiFetch('/admin/users'), apiFetch('/admin/scans')])
      setUsers(u); setScans(s)
    } catch (e) { setMsg(e.message) }
    finally { setLoading(false) }
  }

  async function toggleBan(userId, username) {
    try {
      const res = await apiFetch(`/admin/users/${userId}/ban`, { method: 'POST' })
      setMsg(`${username} — ${res.banned ? '🔴 Banned' : '🟢 Unbanned'}`)
      loadData()
    } catch (e) { setMsg(e.message) }
  }

  async function deleteScan(scanId) {
    if (!confirm(`Delete scan #${scanId}?`)) return
    await apiFetch(`/admin/scans/${scanId}`, { method: 'DELETE' })
    setMsg(`Scan #${scanId} deleted`)
    loadData()
  }

  const totalScans = scans.length
  const bannedCount = users.filter(u => u.is_banned).length
  const highRiskScans = scans.filter(s => s.risk_score >= 60).length

  return (
    <div className="page-pad" style={{ minHeight: '100vh', padding: '2.5rem 1.5rem 4rem' }}>
      <div style={{ maxWidth: 1050, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 6 }}>
            <span style={{ fontSize: '1.3rem' }}>🛡️</span>
            <h1 style={{ fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-0.03em' }}>Admin Dashboard</h1>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Monitor all users, scans, and platform activity.</p>
        </div>

        {msg && (
          <div className="alert alert-info" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            {msg} <button style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer' }} onClick={() => setMsg('')}>✕</button>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Users',      val: users.length,  color: 'var(--cyan)'  },
            { label: 'Total Scans',      val: totalScans,     color: '#00ff88'      },
            { label: 'Banned Users',     val: bannedCount,    color: bannedCount > 0 ? '#ff4444' : '#00ff88' },
            { label: 'High Risk Scans',  val: highRiskScans,  color: highRiskScans > 0 ? '#ff4444' : '#00ff88' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1.1rem' }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem' }}>
          {['users', 'scans'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? 'btn-cyan' : 'btn-ghost'}`} style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t === 'users' ? `👤 Users (${users.length})` : `🔍 Scans (${scans.length})`}
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={loadData}>↻ Refresh</button>
        </div>

        {/* Users table */}
        {tab === 'users' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(0,191,255,0.06)', borderBottom: '1px solid var(--border)' }}>
                  {['ID', 'Username', 'Email', 'Admin', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.8rem 1rem', textAlign: 'left', color: 'var(--muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading…</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,191,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '0.75rem' }}>#{u.id}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{u.username}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '0.78rem' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {u.is_admin ? <span style={{ color: '#f5c542', fontSize: '0.72rem', fontWeight: 700 }}>ADMIN</span>
                                  : <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>user</span>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 100, fontSize: '0.68rem', fontWeight: 800,
                        background: u.is_banned ? 'rgba(255,68,68,0.12)' : 'rgba(0,255,136,0.1)',
                        color: u.is_banned ? '#ff4444' : '#00ff88',
                        border: `1px solid ${u.is_banned ? 'rgba(255,68,68,0.25)' : 'rgba(0,255,136,0.25)'}`,
                        letterSpacing: '0.06em',
                      }}>{u.is_banned ? 'BANNED' : 'ACTIVE'}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)', fontSize: '0.78rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {!u.is_admin && (
                        <button className={`btn btn-sm ${u.is_banned ? 'btn-outline' : 'btn-red'}`}
                          onClick={() => toggleBan(u.id, u.username)}>
                          {u.is_banned ? '✅ Unban' : '🔴 Ban'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Scans table */}
        {tab === 'scans' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(0,191,255,0.06)', borderBottom: '1px solid var(--border)' }}>
                  {['ID', 'Target URL', 'User', 'Status', 'Risk', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.8rem 1rem', textAlign: 'left', color: 'var(--muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading…</td></tr>
                ) : scans.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,191,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '0.75rem' }}>#{s.id}</td>
                    <td style={{ padding: '0.75rem 1rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.78rem' }}>{s.target_url}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)', fontSize: '0.78rem' }}>#{s.user_id}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 100, fontSize: '0.68rem', fontWeight: 800,
                        background: s.status === 'done' ? 'rgba(0,255,136,0.1)' : 'rgba(0,191,255,0.1)',
                        color: s.status === 'done' ? '#00ff88' : 'var(--cyan)',
                        border: `1px solid ${s.status === 'done' ? 'rgba(0,255,136,0.25)' : 'var(--border)'}`,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>{s.status}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontFamily: 'Space Mono, monospace', color: riskColor(s.risk_score), fontWeight: 700 }}>{s.risk_score}</span>
                      <span style={{ fontSize: '0.68rem', color: riskColor(s.risk_score), marginLeft: 4, textTransform: 'uppercase' }}>{riskLabel(s.risk_score)}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)', fontSize: '0.78rem' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <button className="btn btn-red btn-sm" onClick={() => deleteScan(s.id)}>🗑 Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

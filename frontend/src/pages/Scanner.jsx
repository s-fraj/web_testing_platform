import { useState, useRef, useEffect, useCallback } from 'react'
import { apiFetch, streamScan } from '../api'
import { useAuth } from '../App'

// ── Severity config ──────────────────────────────────────────────────
const SEV = {
  ok:       { color: '#00ff88', icon: '✅', label: 'OK'       },
  warning:  { color: '#f5c542', icon: '⚠️', label: 'WARN'    },
  critical: { color: '#ff4444', icon: '❌', label: 'CRIT'    },
  info:     { color: '#00bfff', icon: 'ℹ️', label: 'INFO'    },
}

function riskColor(score) {
  if (score >= 60) return '#ff4444'
  if (score >= 30) return '#f5c542'
  return '#00ff88'
}
function riskLabel(score) {
  if (score >= 60) return 'HIGH'
  if (score >= 30) return 'MEDIUM'
  return 'LOW'
}

// ── Terminal line renderer ───────────────────────────────────────────
function TerminalLine({ line }) {
  if (line.type === 'group_start') {
    return (
      <div style={{ marginTop: 10, marginBottom: 2 }}>
        <span style={{ color: '#00bfff', fontWeight: 700 }}>├── </span>
        <span style={{ color: '#ffffff', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
          [{line.group}]
        </span>
      </div>
    )
  }
  if (line.type === 'group_end') {
    return <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.78rem', marginLeft: 4, marginBottom: 4 }}>│</div>
  }
  if (line.type === 'result') {
    const s = SEV[line.severity] || SEV.info
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: 2, fontFamily: 'Space Mono, monospace', fontSize: '0.78rem', lineHeight: 1.5 }}>
        <span style={{ color: 'rgba(255,255,255,0.2)', whiteSpace: 'pre' }}>│   ├── </span>
        <span style={{ color: s.color, flexShrink: 0 }}>{s.icon} </span>
        <span style={{ color: '#e0e8f0', fontWeight: 600 }}>{line.check}</span>
        <span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 6px' }}>—</span>
        <span style={{ color: s.color, opacity: 0.85, flexShrink: 0, minWidth: 48 }}>[{s.label}]</span>
        <span style={{ color: 'rgba(200,220,240,0.55)', marginLeft: 8, wordBreak: 'break-word' }}>{line.detail}</span>
      </div>
    )
  }
  if (line.type === 'system') {
    return <div style={{ color: line.color || '#00bfff', fontFamily: 'Space Mono, monospace', fontSize: '0.78rem', marginBottom: 2 }}>{line.text}</div>
  }
  return null
}

// ── Risk gauge ───────────────────────────────────────────────────────
function RiskGauge({ score }) {
  const color = riskColor(score)
  const pct   = score
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '3rem', fontWeight: 700, color, lineHeight: 1 }}>{score}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Risk Score</div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', width: 140, margin: '0 auto' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ marginTop: 8, padding: '3px 10px', background: `${color}22`, border: `1px solid ${color}55`, borderRadius: 100, display: 'inline-block', fontSize: '0.72rem', fontWeight: 800, color, letterSpacing: '0.08em' }}>
        {riskLabel(score)} RISK
      </div>
    </div>
  )
}

// ── Summary counters ─────────────────────────────────────────────────
function SummaryBar({ results }) {
  const counts = { ok: 0, warning: 0, critical: 0, info: 0 }
  results.filter(r => r.type === 'result').forEach(r => { counts[r.severity] = (counts[r.severity] || 0) + 1 })
  return (
    <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
      {Object.entries(SEV).map(([key, s]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem' }}>
          <span>{s.icon}</span>
          <span style={{ color: s.color, fontWeight: 700, fontFamily: 'Space Mono, monospace' }}>{counts[key]}</span>
          <span style={{ color: 'var(--muted)' }}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main scanner page ────────────────────────────────────────────────
export default function Scanner() {
  const { user }        = useAuth()
  const [url, setUrl]   = useState('')
  const [lines, setLines] = useState([])
  const [scanning, setScanning] = useState(false)
  const [done, setDone] = useState(false)
  const [riskScore, setRiskScore] = useState(0)
  const [scanId, setScanId]       = useState(null)
  const [error, setError]         = useState('')
  const bottomRef  = useRef(null)
  const esRef      = useRef(null)

  // Auto-scroll terminal
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const addLine = useCallback((line) => {
    setLines(prev => [...prev, line])
  }, [])

  async function startScan(e) {
    e.preventDefault()
    if (!url.trim()) return
    setError(''); setLines([]); setRiskScore(0); setDone(false); setScanning(true); setScanId(null)

    addLine({ type: 'system', color: '#00bfff', text: `► Starting scan: ${url}` })
    addLine({ type: 'system', color: '#6b8099', text: `  ${new Date().toUTCString()}` })
    addLine({ type: 'system', color: 'rgba(255,255,255,0.15)', text: '─'.repeat(72) })

    try {
      const scan = await apiFetch('/scan/start', { method: 'POST', body: JSON.stringify({ target_url: url }) })
      setScanId(scan.id)

      esRef.current = streamScan(
        scan.id,
        (event) => {
          addLine(event)
        },
        async () => {
          // fetch final risk score
          try {
            const final = await apiFetch(`/scan/${scan.id}`)
            setRiskScore(final.risk_score)
          } catch {}
          addLine({ type: 'system', color: 'rgba(255,255,255,0.15)', text: '─'.repeat(72) })
          addLine({ type: 'system', color: '#00ff88', text: '✅ Scan complete.' })
          setScanning(false)
          setDone(true)
        }
      )
    } catch (ex) {
      setError(ex.message)
      setScanning(false)
    }
  }

  function stopScan() {
    esRef.current?.close()
    setScanning(false)
    addLine({ type: 'system', color: '#f5c542', text: '⚠️ Scan stopped by user.' })
  }

  async function downloadReport() {
    if (!scanId) return
    const token = localStorage.getItem('mr7_token')
    window.open(`http://localhost:8000/scan/${scanId}/report?token=${token}`)
  }

  return (
    <div className="page-pad" style={{ minHeight: '100vh', padding: '2rem 1.5rem 4rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: 'var(--cyan)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>Security Scanner</p>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>
            Target Analysis
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
            Only scan systems you own or have explicit written permission to test. All scans are logged.
          </p>
        </div>

        {/* URL Input */}
        <form onSubmit={startScan} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://target-you-own.com"
              required
              disabled={scanning}
              style={{
                flex: 1,
                minWidth: 280,
                padding: '0.85rem 1.1rem',
                background: 'rgba(0,10,30,0.8)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                color: 'var(--text)',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
              onBlur={e => e.target.style.borderColor = ''}
            />
            {!scanning
              ? <button type="submit" className="btn btn-cyan btn-lg">⚡ Run Scan</button>
              : <button type="button" className="btn btn-red btn-lg" onClick={stopScan}>■ Stop</button>
            }
          </div>
        </form>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        {/* Summary bar */}
        {lines.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
            <SummaryBar results={lines} />
            {done && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <RiskGauge score={riskScore} />
                <button className="btn btn-outline btn-sm" onClick={downloadReport}>⬇ Report</button>
              </div>
            )}
          </div>
        )}

        {/* Terminal */}
        {lines.length > 0 && (
          <div style={{
            background: 'rgba(0,3,10,0.92)',
            border: '1px solid rgba(0,191,255,0.2)',
            borderRadius: 14,
            overflow: 'hidden',
          }}>
            {/* Terminal header bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0.6rem 1rem',
              background: 'rgba(0,191,255,0.05)',
              borderBottom: '1px solid rgba(0,191,255,0.1)',
            }}>
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#f5c542' }} />
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#00ff88' }} />
              <span style={{ marginLeft: 8, color: 'var(--muted)', fontSize: '0.72rem', fontFamily: 'Space Mono, monospace' }}>
                mr7.ai — security scanner {scanning && <span style={{ color: 'var(--cyan)' }}>● running</span>}
              </span>
            </div>

            {/* Lines */}
            <div style={{
              padding: '1.2rem 1.4rem',
              maxHeight: 520,
              overflowY: 'auto',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.78rem',
              lineHeight: 1.7,
            }}>
              {/* Tree root */}
              <div style={{ color: 'var(--cyan)', marginBottom: 4, fontSize: '0.8rem' }}>
                mr7.ai scan: {url}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.2)', marginBottom: 6 }}>│</div>

              {lines.map((l, i) => <TerminalLine key={i} line={l} />)}

              {scanning && (
                <div style={{ color: 'var(--cyan)', fontFamily: 'Space Mono, monospace', fontSize: '0.78rem', marginTop: 4 }}>
                  <span style={{ animation: 'none' }}>▌</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        )}

        {/* Idle state */}
        {lines.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', marginTop: '1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Ready to scan</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Enter a URL above to begin. Results stream live into the terminal.</p>
          </div>
        )}
      </div>
    </div>
  )
}

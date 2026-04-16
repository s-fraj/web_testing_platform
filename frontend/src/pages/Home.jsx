import { Link } from 'react-router-dom'
import { useAuth } from '../App'

const features = [
  { icon: '🔍', title: 'Deep Recon', desc: 'Port scanning, directory exposure, SSL/TLS analysis and more across 9 test categories.' },
  { icon: '⚡', title: 'Live Streaming', desc: 'Watch results appear in real-time inside a terminal-style interface as the scan runs.' },
  { icon: '🛡️', title: 'SQL & XSS Probes', desc: 'Automated injection payloads test your endpoints for common web vulnerabilities.' },
  { icon: '📊', title: 'Risk Scoring', desc: 'Every scan produces a risk score 0–100 with color-coded severity breakdown.' },
  { icon: '📋', title: 'Report Export', desc: 'Download a full tree-format text report with all findings for every scan.' },
  { icon: '👤', title: 'Scan History', desc: 'All your past scans are saved to your profile for review anytime.' },
]

const stats = [
  { num: '50K+',  label: 'Security Professionals' },
  { num: '10M+',  label: 'Training Simulations' },
  { num: '99.9%', label: 'Uptime' },
  { num: '24/7',  label: 'Support' },
]

const pricing = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'For individuals getting started.',
    features: ['5 scans/month', '3 test categories', 'Basic report export', 'Community support'],
    cta: 'Get Started',
    href: '/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    desc: 'For security professionals.',
    features: ['Unlimited scans', 'All 9 test categories', 'Full report export', 'Priority support', 'Scan history'],
    cta: 'Start Pro Trial',
    href: '/signup',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For teams and organizations.',
    features: ['Team accounts', 'API access', 'Custom integrations', 'Dedicated support', 'Admin dashboard'],
    cta: 'Contact Us',
    href: '#support',
    highlight: false,
  },
]

const howSteps = [
  { n: '01', title: 'Create Account', desc: 'Sign up free. Your account unlocks the scanner and keeps your scan history.' },
  { n: '02', title: 'Enter Target URL', desc: 'Paste the URL of the authorized target you want to test.' },
  { n: '03', title: 'Watch Live Results', desc: 'The terminal streams results in real time — green, yellow, red — as tests run.' },
  { n: '04', title: 'Download Report', desc: 'Get a full tree-format text report with all findings and risk score.' },
]

export default function Home() {
  const { user } = useAuth()
  return (
    <div className="page-pad" style={{ position: 'relative', zIndex: 5 }}>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 1.5rem',
      }}>
        <div style={{ maxWidth: 820 }}>
          <div style={{
            display: 'inline-block',
            padding: '5px 14px',
            border: '1px solid rgba(0,191,255,0.3)',
            borderRadius: 20,
            fontSize: 12,
            color: 'var(--cyan)',
            marginBottom: 24,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Built for Authorized Security Training & Research
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 6vw, 5rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.04em',
            marginBottom: 20,
          }}>
            Powerful AI for<br />
            <span style={{ color: 'var(--cyan)' }}>Security Professionals</span>
          </h1>

          <p style={{ color: 'var(--muted)', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 580, margin: '0 auto 32px' }}>
            A professional AI assistant designed for cybersecurity professionals to simulate
            security scenarios, run deep scans, and generate full reports — in controlled environments.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {user
              ? <Link to="/scanner" className="btn btn-cyan btn-lg">Launch Scanner →</Link>
              : <>
                  <Link to="/signup" className="btn btn-cyan btn-lg">Try It Free Now →</Link>
                  <Link to="/login"  className="btn btn-outline btn-lg">Sign In</Link>
                </>
            }
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{
        background: 'rgba(0,5,15,0.6)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '3.5rem 2rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem', maxWidth: 900, margin: '0 auto' }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--cyan)', fontFamily: 'Space Mono, monospace' }}>{s.num}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ color: 'var(--cyan)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8 }}>Capabilities</p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '2.5rem' }}>
            Built for Security Professionals
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.2rem' }}>
            {features.map(f => (
              <div key={f.title} className="card" style={{ transition: 'border-color 0.2s, transform 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cyan)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = ''; }}>
                <div style={{ fontSize: '1.8rem', marginBottom: 10 }}>{f.icon}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: '5rem 2rem', background: 'rgba(0,5,15,0.5)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p style={{ color: 'var(--cyan)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8, textAlign: 'center' }}>Workflow</p>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '3rem', textAlign: 'center' }}>
            How It Works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {howSteps.map(s => (
              <div key={s.n} className="card">
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '2rem', fontWeight: 700, color: 'var(--cyan)', opacity: 0.4, marginBottom: 12 }}>{s.n}</div>
                <h3 style={{ fontWeight: 800, marginBottom: 6 }}>{s.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOOLS ── */}
      <section id="tools" style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '1rem' }}>Advanced Tools</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            mr7.ai runs 9 comprehensive test categories on every scan — no configuration needed.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            {['HTTP Basics','SSL/TLS Analysis','Security Headers','Port Scanning','SQL Injection','XSS Probes','API Security','Content Analysis','Directory Exposure'].map(t => (
              <span key={t} style={{
                padding: '0.45rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: '0.85rem',
                color: 'var(--cyan)',
                background: 'var(--cyan-dim)',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.78rem',
              }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: '5rem 2rem', background: 'rgba(0,5,15,0.5)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.5rem', textAlign: 'center' }}>Flexible Pricing</h2>
          <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: '3rem' }}>Start free, upgrade when you need more power.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' }}>
            {pricing.map(p => (
              <div key={p.name} className="card" style={{
                border: p.highlight ? '1px solid var(--cyan)' : '',
                boxShadow: p.highlight ? '0 0 30px rgba(0,191,255,0.15)' : '',
                position: 'relative',
              }}>
                {p.highlight && <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--cyan)', color: '#000', fontSize: '0.7rem', fontWeight: 800,
                  padding: '3px 12px', borderRadius: 20, letterSpacing: '0.08em', whiteSpace: 'nowrap',
                }}>MOST POPULAR</div>}
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{p.name}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: 4 }}>{p.desc}</p>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--cyan)', fontFamily: 'Space Mono, monospace' }}>{p.price}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{p.period}</span>
                </div>
                <ul style={{ listStyle: 'none', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ fontSize: '0.88rem', color: 'var(--text)', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: 'var(--green)' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link to={p.href} className={`btn ${p.highlight ? 'btn-cyan' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'center' }}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUPPORT ── */}
      <section id="support" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '1rem' }}>Support</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: '2rem' }}>
            Need help? Our security team is available 24/7. All usage is logged and monitored.
            mr7.ai is strictly for authorized testing on systems you own or have explicit permission to test.
          </p>
          <a href="mailto:support@mr7.ai" className="btn btn-outline btn-lg">📧 Contact Support</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        textAlign: 'center',
        padding: '2rem',
        borderTop: '1px solid var(--border)',
        color: 'var(--muted)',
        fontSize: '0.82rem',
        fontFamily: 'Space Mono, monospace',
      }}>
        © 2026 mr7.ai — For authorized security research only. All activity is logged.
      </footer>

    </div>
  )
}

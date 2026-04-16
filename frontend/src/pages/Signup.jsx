import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { setToken, apiFetch } from '../api'

export default function Signup() {
  const [form, setForm]       = useState({ username: '', email: '', password: '', confirm: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser }           = useAuth()
  const navigate              = useNavigate()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
      })
      // Auto-login
      const res = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      setToken(data.access_token)
      const user = await apiFetch('/users/me')
      setUser(user)
      navigate('/scanner')
    } catch (ex) {
      setError(ex.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-pad" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '1.6rem', fontWeight: 700, color: 'var(--cyan)', marginBottom: 6 }}>mr7.ai</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Create your security research account</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Create Account</h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" placeholder="security_pro" value={form.username} onChange={set('username')} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input type="password" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} required />
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{
              background: 'rgba(245,197,66,0.07)',
              border: '1px solid rgba(245,197,66,0.25)',
              borderRadius: 8,
              padding: '0.75rem 1rem',
              fontSize: '0.78rem',
              color: 'var(--yellow)',
              lineHeight: 1.5,
              marginBottom: '1rem',
            }}>
              ⚠️ By creating an account, you agree to use mr7.ai <strong>only on systems you own or have explicit written permission to test</strong>. All activity is logged and may be reported to authorities.
            </div>

            <button type="submit" className="btn btn-cyan" style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }} disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--cyan)', fontWeight: 600 }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

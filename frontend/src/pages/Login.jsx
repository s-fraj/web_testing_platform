import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { setToken, apiFetch } from '../api'

export default function Login() {
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser }           = useAuth()
  const navigate              = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed')
      setToken(data.access_token)
      const user = await apiFetch('/users/me')
      setUser(user)
      navigate(user.is_admin ? '/admin' : '/scanner')
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
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '1.6rem', fontWeight: 700, color: 'var(--cyan)', marginBottom: 6 }}>mr7.ai</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Sign in to your security workspace</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Welcome back</h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-cyan" style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', marginTop: 4 }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
            No account? <Link to="/signup" style={{ color: 'var(--cyan)', fontWeight: 600 }}>Create one free →</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.6 }}>
          ⚠️ By signing in you confirm this platform is used only for authorized security testing.
        </p>
      </div>
    </div>
  )
}

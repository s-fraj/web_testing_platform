import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../App'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const a = (path) => pathname === path ? 'active' : ''

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">mr7.ai</Link>
      <div className="nav-links">
        <Link to="/#features"  className={a('/')}        data-hide-mobile>Features</Link>
        <Link to="/#pricing"   className={a('/pricing')} data-hide-mobile>Pricing</Link>
        <Link to="/#tools"     className={a('/tools')}   data-hide-mobile>Tools</Link>
        <Link to="/#how"       className={a('/how')}     data-hide-mobile>How to Use</Link>
        {user && <Link to="/scanner" className={a('/scanner')}>Scanner</Link>}
        {user && <Link to="/profile" className={a('/profile')}>Profile</Link>}
        {user?.is_admin && <Link to="/admin" className={a('/admin')} style={{color:'#f5c542'}}>Admin</Link>}
        {user
          ? <button className="btn btn-ghost btn-sm" onClick={logout} style={{marginLeft:'0.5rem'}}>Sign Out</button>
          : <>
              <Link to="/login"  className="btn btn-ghost  btn-sm" style={{marginLeft:'0.5rem'}}>Sign In</Link>
              <Link to="/signup" className="btn btn-cyan   btn-sm" style={{marginLeft:'0.4rem'}}>Get Started →</Link>
            </>
        }
      </div>
    </nav>
  )
}

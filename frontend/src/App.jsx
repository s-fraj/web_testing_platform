import React, { createContext, useContext, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Background from './components/Background'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Scanner from './pages/Scanner'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import { apiFetch, clearToken, isLoggedIn } from './api'

export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{color:'#00bfff',textAlign:'center',paddingTop:'30vh'}}>Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !user.is_admin) return <Navigate to="/scanner" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoggedIn()) {
      apiFetch('/users/me').then(u => setUser(u)).catch(() => { clearToken(); }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const logout = () => { clearToken(); setUser(null) }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      <BrowserRouter>
        <Background />
        <Navbar />
        <Routes>
          <Route path="/"        element={<Home />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/signup"  element={<Signup />} />
          <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin"   element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}

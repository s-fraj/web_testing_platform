// src/api.js
const API = 'http://localhost:8000'

export function getToken() { return localStorage.getItem('mr7_token') }
export function setToken(t) { localStorage.setItem('mr7_token', t) }
export function clearToken() { localStorage.removeItem('mr7_token') }
export function isLoggedIn() { return !!getToken() }

export async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(API + path, { ...options, headers })
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}

export function streamScan(scanId, onEvent, onDone) {
  const token = getToken()
  const es = new EventSource(`${API}/scan/${scanId}/stream?token=${token}`)
  es.onmessage = (e) => {
    const data = JSON.parse(e.data)
    if (data.type === 'done') { es.close(); onDone() }
    else onEvent(data)
  }
  es.onerror = () => { es.close(); onDone() }
  return es
}

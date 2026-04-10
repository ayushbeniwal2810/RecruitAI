import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000').replace(/\/$/, '')

function toAssetUrl(path) {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/uploads/')) return `${API_BASE}${path}`
  if (path.startsWith('uploads/')) return `${API_BASE}/${path}`
  return `${API_BASE}/${path.replace(/^\/+/, '')}`
}

export default function CandidateLayout() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  })()

  const fullName = user?.full_name || 'Candidate'
  const email = user?.email || ''
  const role = (user?.role || 'candidate').toLowerCase()
  const avatarUrl = toAssetUrl(user?.profile_photo || '')
  const initial = (fullName?.[0] || 'C').toUpperCase()

  const persistLastAccount = () => {
    const raw = localStorage.getItem('user')
    let u = null
    try {
      u = raw ? JSON.parse(raw) : null
    } catch {
      u = null
    }
    if (u?.email) localStorage.setItem('lastEmail', u.email)
    if (u?.role) localStorage.setItem('lastRole', String(u.role).toLowerCase())
    if (u?.full_name) localStorage.setItem('lastFullName', u.full_name)
  }

  const handleLogout = () => {
    persistLastAccount()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handleSwitchAccount = () => {
    persistLastAccount()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login?switch=1')
  }

  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    const t = (user?.theme || localStorage.getItem('theme') || 'light').toLowerCase()
    const theme = t === 'dark' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [user?.theme])

  const linkBase = {
    display: 'block',
    padding: '10px 12px',
    borderRadius: 10,
    textDecoration: 'none',
    fontWeight: 600,
    marginBottom: 8,
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '250px 1fr', background: 'var(--bg)', color: 'var(--text)' }}>
      <aside style={{ background: '#0f172a', color: '#e2e8f0', padding: 16, borderRight: '1px solid rgba(148,163,184,0.25)' }}>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 18 }}>
          Recruit<span style={{ color: '#a78bfa' }}>AI</span>
        </div>

        <nav>
          <NavLink to="/candidate/dashboard" style={({ isActive }) => ({ ...linkBase, background: isActive ? '#1e293b' : 'transparent', color: isActive ? '#fff' : '#cbd5e1' })}>Dashboard</NavLink>
          <NavLink to="/candidate/upload" style={({ isActive }) => ({ ...linkBase, background: isActive ? '#1e293b' : 'transparent', color: isActive ? '#fff' : '#cbd5e1' })}>Upload Resume</NavLink>
          <NavLink to="/candidate/jobs" style={({ isActive }) => ({ ...linkBase, background: isActive ? '#1e293b' : 'transparent', color: isActive ? '#fff' : '#cbd5e1' })}>Browse Jobs</NavLink>
          <NavLink to="/candidate/settings" style={({ isActive }) => ({ ...linkBase, background: isActive ? '#1e293b' : 'transparent', color: isActive ? '#fff' : '#cbd5e1' })}>Settings</NavLink>
        </nav>
      </aside>

      <section style={{ minWidth: 0 }}>
        <header
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 18px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--card)',
            color: 'var(--text)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)' }}>
            Candidate Dashboard
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Welcome, {fullName}</div>

            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  border: '2px solid var(--border)',
                  background: 'var(--card)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  padding: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
                title="Account"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="profile"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', lineHeight: 1 }}>
                    {initial}
                  </span>
                )}
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 50,
                    width: 260,
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
                    padding: 12,
                    zIndex: 50,
                  }}
                >
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Signed in as</div>
                  <div style={{ fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{fullName}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{email}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Role: {role}</div>

                  <div style={{ borderTop: '1px solid var(--border)', margin: '10px 0' }} />

                  <button
                    type="button"
                    onClick={handleSwitchAccount}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      padding: '8px 6px',
                      cursor: 'pointer',
                      color: 'var(--text)',
                      fontWeight: 600,
                    }}
                  >
                    Switch account
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      padding: '8px 6px',
                      cursor: 'pointer',
                      color: '#dc2626',
                      fontWeight: 700,
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main style={{ padding: 16 }}>
          <Outlet />
        </main>
      </section>
    </div>
  )
}
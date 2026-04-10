import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const switched = searchParams.get('switch') === '1'

  const lastEmail = localStorage.getItem('lastEmail') || ''
  const lastRole = localStorage.getItem('lastRole') || ''
  const lastFullName = localStorage.getItem('lastFullName') || ''

  const [mode, setMode] = useState('login')
  const [role, setRole] = useState(lastRole || 'recruiter')
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState(lastEmail)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const emailValid = useMemo(() => EMAIL_RE.test(email.trim()), [email])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!emailValid) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const res = await axios.post('/api/auth/login', {
          email: email.trim().toLowerCase(),
          password,
          role: role.toLowerCase(),
        })

        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        localStorage.setItem('lastEmail', res.data.user?.email || email.trim().toLowerCase())
        localStorage.setItem('lastRole', (res.data.user?.role || role).toLowerCase())
        localStorage.setItem('lastFullName', res.data.user?.full_name || '')

        const loggedRole = (res.data.user?.role || '').toLowerCase()
        navigate(loggedRole === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard')
      } else {
        await axios.post('/api/auth/register', {
          full_name: fullName,
          company_name: role === 'recruiter' ? company : undefined,
          email: email.trim().toLowerCase(),
          password,
          role: role.toLowerCase(),
        })
        setMode('login')
        setError('')
        alert('Account created! Please log in.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    outline: 'none',
    background: '#ffffff',
    color: '#0f172a',
    fontSize: 15,
    marginBottom: 10,
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        background: 'radial-gradient(circle at 10% 20%, #f0f9ff 0%, #eef2ff 45%, #f5f3ff 100%)',
      }}
    >
      <div style={{ padding: '72px 64px', color: '#1f2937' }}>
        <div style={{ fontSize: 34, fontWeight: 800, marginBottom: 10 }}>
          Recruit<span style={{ color: '#6d28d9' }}>AI</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 44, lineHeight: 1.15 }}>
          Smart hiring,
          <br />
          simpler workflow.
        </h1>
        <p style={{ marginTop: 18, maxWidth: 520, color: '#475569', fontSize: 16 }}>
          AI-powered screening for recruiters and candidates in one elegant platform.
        </p>
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
        <div
          style={{
            width: '100%',
            maxWidth: 460,
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 18,
            padding: 28,
            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.10)',
          }}
        >
          <h2 style={{ margin: 0, marginBottom: 6, color: '#0f172a' }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p style={{ color: '#64748b', marginBottom: 18 }}>
            {mode === 'login' ? 'Sign in to continue' : 'Create your RecruitAI account'}
          </p>

          {switched && mode === 'login' && lastEmail && (
            <div
              style={{
                marginBottom: 12,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: 13,
                color: '#475569',
              }}
            >
              <div>
                Switched from: <strong>{lastFullName || 'Previous user'}</strong>
              </div>
              <div style={{ marginTop: 2 }}>
                Last account: <strong>{lastEmail}</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail(lastEmail)
                  if (lastRole) setRole(lastRole)
                }}
                style={{
                  marginTop: 6,
                  border: 'none',
                  background: 'transparent',
                  color: '#4f46e5',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                Use this account
              </button>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginBottom: 14,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 6,
            }}
          >
            <button
              type="button"
              onClick={() => setRole('recruiter')}
              style={{
                border: 'none',
                borderRadius: 9,
                padding: '10px 12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: role === 'recruiter' ? '#ede9fe' : 'transparent',
                color: role === 'recruiter' ? '#5b21b6' : '#475569',
              }}
            >
              🏢 Recruiter
            </button>
            <button
              type="button"
              onClick={() => setRole('candidate')}
              style={{
                border: 'none',
                borderRadius: 9,
                padding: '10px 12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: role === 'candidate' ? '#dcfce7' : 'transparent',
                color: role === 'candidate' ? '#166534' : '#475569',
              }}
            >
              👤 Candidate
            </button>
          </div>

          {error && <div style={{ marginBottom: 12, color: '#b91c1c', fontSize: 14 }}>⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={inputStyle}
                />
                {role === 'recruiter' && (
                  <input
                    type="text"
                    placeholder="Company name"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    style={inputStyle}
                  />
                )}
              </>
            )}

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                ...inputStyle,
                borderColor: email && !emailValid ? '#ef4444' : '#cbd5e1',
              }}
            />
            {email && !emailValid && (
              <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8 }}>Invalid email format</div>
            )}

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ ...inputStyle, marginBottom: 14 }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                border: 'none',
                borderRadius: 10,
                padding: '11px 14px',
                fontWeight: 700,
                cursor: 'pointer',
                color: '#fff',
                background: 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)',
              }}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ margin: '14px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>or continue with</div>

          <button
            type="button"
            onClick={() => alert('Google login setup will be added in Phase 2')}
            style={{
              width: '100%',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '10px 14px',
              background: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              color: '#334155',
            }}
          >
            Continue with Google
          </button>

          <div style={{ marginTop: 14, fontSize: 14, color: '#475569' }}>
            {mode === 'login' ? (
              <>No account? <a style={{ cursor: 'pointer', color: '#4f46e5' }} onClick={() => { setMode('register'); setError('') }}>Register</a></>
            ) : (
              <>Have an account? <a style={{ cursor: 'pointer', color: '#4f46e5' }} onClick={() => { setMode('login'); setError('') }}>Sign in</a></>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

export default function Settings() {
  const fileRef = useRef(null)

  const [email, setEmail] = useState('')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const [photoPreview, setPhotoPreview] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000').replace(/\/$/, '')

  useEffect(() => {
    setEmail(user.email || '')
    setTheme((user.theme || localStorage.getItem('theme') || 'light').toLowerCase())
    if (user.profile_photo) {
      const photo = user.profile_photo.startsWith('http')
        ? user.profile_photo
        : `${API_BASE}${user.profile_photo.startsWith('/') ? '' : '/'}${user.profile_photo}`
      setPhotoPreview(photo)
    }

    const t = (user.theme || localStorage.getItem('theme') || 'light').toLowerCase()
    const safeTheme = t === 'dark' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', safeTheme)
    document.body.setAttribute('data-theme', safeTheme)
    localStorage.setItem('theme', safeTheme)
  }, [])

  function authHeaders() {
    return { Authorization: `Bearer ${token}` }
  }

  async function saveEmail() {
    setErr('')
    setMsg('')
    if (!EMAIL_RE.test(email.trim())) {
      setErr('Please enter a valid email.')
      return
    }

    try {
      await axios.put(`${API_BASE}/api/auth/update-email`, { email: email.trim().toLowerCase() }, { headers: authHeaders() })
      const updated = { ...user, email: email.trim().toLowerCase() }
      localStorage.setItem('user', JSON.stringify(updated))
      localStorage.setItem('lastEmail', email.trim().toLowerCase())
      setMsg('Email updated.')
    } catch (e) {
      setErr(e?.response?.data?.message || 'Email update failed.')
    }
  }

  async function saveTheme(nextTheme) {
    setErr('')
    setMsg('')

    const safeTheme = nextTheme === 'dark' ? 'dark' : 'light'

    // Apply immediately (always)
    document.documentElement.setAttribute('data-theme', safeTheme)
    document.body.setAttribute('data-theme', safeTheme)
    localStorage.setItem('theme', safeTheme)
    setTheme(safeTheme)

    // Update cached user immediately
    const raw = localStorage.getItem('user')
    try {
      const u = raw ? JSON.parse(raw) : {}
      u.theme = safeTheme
      localStorage.setItem('user', JSON.stringify(u))
    } catch (_) {}

    // Try backend sync (use an existing endpoint shape)
    // If backend doesn't support theme yet, we keep local success and show soft notice.
    try {
      await axios.put(
        `${API_BASE}/api/auth/update-profile`,
        { theme: safeTheme },
        { headers: authHeaders() }
      )
      setMsg('Theme updated.')
    } catch (e) {
      setMsg('Theme applied locally.')
      // Optional debug:
      // console.log(e?.response?.status, e?.response?.data)
    }
  }

  async function uploadFile(file) {
    if (!file) return
    setErr('')
    setMsg('')
    setBusy(true)

    try {
      const form = new FormData()
      form.append('photo', file)

      const res = await axios.post(`${API_BASE}/api/auth/upload-photo`, form, {
        headers: authHeaders(),
      })

      const path = res?.data?.profile_photo
      if (!path) throw new Error('No profile_photo path returned.')

      const updated = { ...user, profile_photo: path }
      localStorage.setItem('user', JSON.stringify(updated))

      const photo = path.startsWith('http')
        ? path
        : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`
      setPhotoPreview(photo)

      setMsg('Profile photo updated.')
    } catch (e) {
      setErr(e?.response?.data?.message || 'Photo upload failed.')
    } finally {
      setBusy(false)
    }
  }

  async function onPhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFileName(file.name)
    await uploadFile(file)
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: 16 }}>Settings</h2>

      {msg && <div style={{ color: 'green', marginBottom: 8 }}>{msg}</div>}
      {err && <div style={{ color: 'crimson', marginBottom: 8 }}>{err}</div>}

      <div style={{ marginBottom: 18 }}>
        <label>Email</label>
        <input className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={saveEmail}>
          Update Email
        </button>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label>Theme</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            className="btn btn-outline"
            onClick={() => saveTheme('light')}
            style={{ opacity: theme === 'light' ? 1 : 0.75 }}
          >
            Light
          </button>
          <button
            className="btn btn-outline"
            onClick={() => saveTheme('dark')}
            style={{ opacity: theme === 'dark' ? 1 : 0.75 }}
          >
            Dark
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label>Profile Photo</label>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={onPhotoChange}
          />
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            {selectedFileName || 'No file selected'}
          </span>
        </div>

        {busy && <div style={{ marginTop: 8, fontSize: 13 }}>Uploading...</div>}

        {photoPreview && (
          <div style={{ marginTop: 12 }}>
            <img
              src={photoPreview}
              alt="profile"
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid var(--border)',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function CandidateDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resumeBusy, setResumeBusy] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const h = { Authorization: `Bearer ${localStorage.getItem('token')}` }
      const res = await axios.get('/api/candidate/me', { headers: h })
      setData(res.data)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleResumeAction(mode = 'view') {
    try {
      setResumeBusy(true)

      const token = localStorage.getItem('token')
      const res = await axios.get(`/api/candidate/resume?view=${mode === 'view' ? '1' : '0'}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      })

      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' })
      const blobUrl = window.URL.createObjectURL(blob)

      if (mode === 'view') {
        window.open(blobUrl, '_blank', 'noopener,noreferrer')
      } else {
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = data?.resume_file_name || 'resume'
        document.body.appendChild(a)
        a.click()
        a.remove()
      }

      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000)
    } catch (err) {
      console.error('Resume action failed:', err)
      alert('Unable to open resume. Please login again and try.')
    } finally {
      setResumeBusy(false)
    }
  }

  function scoreClass(s) {
    if (s >= 75) return 'score-high'
    if (s >= 50) return 'score-mid'
    return 'score-low'
  }

  function verdictBadge(v) {
    if (v === 'Strong Match') return 'badge badge-strong'
    if (v === 'Moderate Match') return 'badge badge-moderate'
    return 'badge badge-weak'
  }

  function statusBadge(s) {
    if (s === 'Shortlisted') return 'badge badge-shortlisted'
    if (s === 'Rejected') return 'badge badge-rejected'
    return 'badge badge-pending'
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-heading">Hello, {user.full_name?.split(' ')[0] || 'there'} 👋</h1>
        <p className="page-sub">Track your applications, resume, and AI match score here.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <span className="spinner spinner-dark" style={{ width: 20, height: 20 }} />
        </div>
      ) : !data ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📄</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', marginBottom: 8, color: 'var(--heading)' }}>
            No resume uploaded yet
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 24 }}>
            Upload your resume to get your AI match score and apply for jobs.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/candidate/upload')}>
            Upload Resume →
          </button>
        </div>
      ) : (
        <>
          <div className="card fade-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div className={`score-circle ${scoreClass(data.match_score || 0)}`}>
                {data.match_score || 0}%
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  Your AI Match Score
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', color: 'var(--heading)', marginBottom: 6 }}>
                  {data.role_title || 'Applied Role'}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={verdictBadge(data.ai_verdict)}>{data.ai_verdict || 'Moderate Match'}</span>
                  <span className={statusBadge(data.status)}>Application: {data.status || 'Pending'}</span>
                </div>
              </div>
            </div>

            {data.summary && <div className="analysis-text">{data.summary}</div>}
          </div>

          <div className="card fade-up">
            <h3 className="card-title">Resume</h3>
            {data.resume_file_name ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--heading)', wordBreak: 'break-all' }}>
                  📄 {data.resume_file_name}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-outline" onClick={() => handleResumeAction('view')} disabled={resumeBusy}>
                    {resumeBusy ? 'Opening...' : 'View'}
                  </button>
                  <button className="btn btn-outline" onClick={() => handleResumeAction('download')} disabled={resumeBusy}>
                    {resumeBusy ? 'Downloading...' : 'Download'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>No resume file found.</div>
            )}
          </div>

          <div className="card fade-up">
            <h3 className="card-title">Applied Jobs</h3>
            {data.applied_jobs && data.applied_jobs.length > 0 ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {data.applied_jobs.map((job) => (
                  <div key={job.jd_id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontWeight: 600, color: 'var(--heading)' }}>{job.role_title}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                      Status: {job.application_status || 'Pending'} • Match: {job.match_score || 0}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>You have not applied to any jobs yet.</p>
            )}
          </div>
        </>
      )}
    </>
  )
}
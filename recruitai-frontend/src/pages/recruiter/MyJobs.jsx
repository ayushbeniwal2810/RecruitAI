import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const MOCK_JOBS = [
  {
    jd_id: 1,
    role_title: 'Machine Learning Engineer',
    description: 'We are looking for an ML Engineer to build and deploy machine learning models at scale.',
    required_skills: ['Python', 'TensorFlow', 'SQL', 'Flask'],
    created_at: new Date().toISOString(),
    applicants: 3,
  },
  {
    jd_id: 2,
    role_title: 'Data Analyst',
    description: 'Looking for a Data Analyst to work with large datasets and generate actionable insights.',
    required_skills: ['SQL', 'Python', 'Power BI', 'Excel'],
    created_at: new Date().toISOString(),
    applicants: 1,
  },
]

export default function MyJobs() {
  const navigate          = useNavigate()
  const [jobs,    setJobs]    = useState(MOCK_JOBS)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { loadJobs() }, [])

  async function loadJobs() {
    setLoading(true)
    try {
      const h = { Authorization: `Bearer ${localStorage.getItem('token')}` }
      const res = await axios.get('/api/recruiter/jobs', { headers: h })
      setJobs(res.data.jobs || [])
    } catch { /* use mock */ }
    finally { setLoading(false) }
  }

  async function deleteJob(id) {
    setDeleting(id)
    try {
      const h = { Authorization: `Bearer ${localStorage.getItem('token')}` }
      await axios.delete(`/api/recruiter/job/${id}`, { headers: h })
      setJobs(prev => prev.filter(j => j.jd_id !== id))
    } catch {
      setJobs(prev => prev.filter(j => j.jd_id !== id))
    } finally {
      setDeleting(null)
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-heading">My Jobs</h1>
        <p className="page-sub">All job postings you have created.</p>
      </div>

      {/* Top action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/recruiter/post-job')}
        >
          ＋ Post New Job
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <span className="spinner spinner-dark" style={{ width: 20, height: 20 }} />
        </div>
      ) : jobs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-text">No jobs posted yet.</div>
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => navigate('/recruiter/post-job')}
            >
              Post your first job
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {jobs.map(job => (
            <div key={job.jd_id} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>

                {/* Left — Job Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--heading)' }}>
                      {job.role_title}
                    </h2>
                    <span className="badge badge-blue">Active</span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: 1.7, marginBottom: 14, maxWidth: 600 }}>
                    {job.description?.length > 150
                      ? job.description.substring(0, 150) + '...'
                      : job.description}
                  </p>

                  {/* Skills */}
                  {job.required_skills?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 }}>
                        Required Skills
                      </div>
                      <div className="skill-tags">
                        {(Array.isArray(job.required_skills)
                          ? job.required_skills
                          : JSON.parse(job.required_skills || '[]')
                        ).map((s, i) => (
                          <span key={i} className="skill-tag skill-neutral">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta */}
                  <div style={{ display: 'flex', gap: 20, fontSize: '0.78rem', color: 'var(--muted)' }}>
                    <span>📅 Posted {formatDate(job.created_at)}</span>
                    <span>👥 {job.applicants || 0} applicant{job.applicants !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Right — Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate('/recruiter/candidates')}
                  >
                    View Candidates →
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={deleting === job.jd_id}
                    onClick={() => {
                      if (window.confirm(`Delete "${job.role_title}"?`)) {
                        deleteJob(job.jd_id)
                      }
                    }}
                  >
                    {deleting === job.jd_id ? 'Deleting...' : '✕ Delete'}
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
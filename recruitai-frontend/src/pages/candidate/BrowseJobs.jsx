import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const MOCK_JOBS = [
  {
    jd_id: 1,
    role_title: 'Machine Learning Engineer',
    company_name: 'TechCorp India',
    description: 'We are looking for an ML Engineer to build and deploy machine learning models at scale. You will work closely with the data engineering team.',
    required_skills: ['Python', 'TensorFlow', 'SQL', 'Flask'],
    created_at: new Date().toISOString(),
  },
  {
    jd_id: 2,
    role_title: 'Data Analyst',
    company_name: 'Analytics Hub',
    description: 'Looking for a Data Analyst to work with large datasets and generate actionable insights for business decisions.',
    required_skills: ['SQL', 'Python', 'Power BI', 'Excel'],
    created_at: new Date().toISOString(),
  },
]

export default function BrowseJobs() {
  const navigate          = useNavigate()
  const [jobs,    setJobs]    = useState(MOCK_JOBS)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

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

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  const filtered = jobs.filter(j =>
    j.role_title.toLowerCase().includes(search.toLowerCase()) ||
    (j.company_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="page-header">
        <h1 className="page-heading">Browse Jobs</h1>
        <p className="page-sub">Find the right opportunity and upload your resume to apply.</p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          className="form-input"
          type="text"
          placeholder="Search by role or company..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 340 }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <span className="spinner spinner-dark" style={{ width: 20, height: 20 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-text">No jobs found.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(job => (
            <div key={job.jd_id} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>

                {/* Left — Job Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--heading)' }}>
                      {job.role_title}
                    </h2>
                    <span className="badge badge-blue">Hiring</span>
                  </div>

                  {job.company_name && (
                    <div style={{ fontSize: '0.83rem', color: 'var(--accent)', fontWeight: 500, marginBottom: 10 }}>
                      🏢 {job.company_name}
                    </div>
                  )}

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: 1.7, marginBottom: 14, maxWidth: 600 }}>
                    {job.description?.length > 180
                      ? job.description.substring(0, 180) + '...'
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
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    📅 Posted {formatDate(job.created_at)}
                  </div>
                </div>

                {/* Right — Apply Button */}
                <div style={{ flexShrink: 0 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate('/candidate/upload', { state: { jd_id: job.jd_id, role_title: job.role_title } })}
                  >
                    Apply Now →
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
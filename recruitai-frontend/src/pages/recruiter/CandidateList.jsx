import React, { useState, useEffect } from 'react'
import axios from 'axios'


const MOCK = [
  { candidate_id: 1, full_name: 'Priya Sharma',  role_title: 'ML Engineer',  match_score: 91, ai_verdict: 'Strong Match',   recommendation: 'Shortlist', status: 'Shortlisted', matched_skills: ['Python','TensorFlow','SQL'], summary: 'Strong candidate with relevant ML experience and matching skill set.' },
  { candidate_id: 2, full_name: 'Rahul Verma',   role_title: 'ML Engineer',  match_score: 78, ai_verdict: 'Strong Match',   recommendation: 'Shortlist', status: 'Pending',     matched_skills: ['Python','Flask','ML'],      summary: 'Good fit with solid Python and ML background.' },
  { candidate_id: 3, full_name: 'Ananya Singh',  role_title: 'Data Analyst', match_score: 55, ai_verdict: 'Moderate Match', recommendation: 'Consider',  status: 'Pending',     matched_skills: ['Python','SQL'],             summary: 'Moderate match. Has foundational skills but lacks ML experience.' },
  { candidate_id: 4, full_name: 'Karan Mehta',   role_title: 'ML Engineer',  match_score: 36, ai_verdict: 'Weak Match',     recommendation: 'Reject',    status: 'Rejected',    matched_skills: ['SQL'],                      summary: 'Weak match. Limited relevant technical skills for the role.' },
]

export default function CandidateList() {
  const [candidates, setCandidates] = useState(MOCK)
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState('all')
  const [expanded,   setExpanded]   = useState(null)
  const [updating,   setUpdating]   = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const h = { Authorization: `Bearer ${localStorage.getItem('token')}` }
      const res = await axios.get('/api/recruiter/candidates', { headers: h })
      setCandidates(res.data.candidates || [])
    } catch { /* use mock */ }
    finally { setLoading(false) }
  }

  async function updateStatus(id, status) {
    setUpdating(id)
    try {
      const h = { Authorization: `Bearer ${localStorage.getItem('token')}` }
      await axios.patch(`/api/recruiter/candidate/${id}`, { status }, { headers: h })
      setCandidates(prev => prev.map(c => c.candidate_id === id ? { ...c, status } : c))
    } catch {
      setCandidates(prev => prev.map(c => c.candidate_id === id ? { ...c, status } : c))
    } finally {
      setUpdating(null)
    }
  }

  const filtered = candidates
    .filter(c => {
      const q = search.toLowerCase()
      const matchSearch = (c.full_name||'').toLowerCase().includes(q) || (c.role_title||'').toLowerCase().includes(q)
      const matchFilter =
        filter === 'all'         ? true :
        filter === 'shortlisted' ? c.status === 'Shortlisted' :
        filter === 'rejected'    ? c.status === 'Rejected' :
        filter === 'pending'     ? c.status === 'Pending' : true
      return matchSearch && matchFilter
    })
    .sort((a,b) => b.match_score - a.match_score)

  function scoreColor(s) {
    if (s >= 75) return 'var(--green)'
    if (s >= 50) return 'var(--amber)'
    return 'var(--red)'
  }

  function verdictBadge(v) {
    if (v === 'Strong Match')   return 'badge badge-strong'
    if (v === 'Moderate Match') return 'badge badge-moderate'
    return 'badge badge-weak'
  }

  function statusBadge(s) {
    if (s === 'Shortlisted') return 'badge badge-shortlisted'
    if (s === 'Rejected')    return 'badge badge-rejected'
    return 'badge badge-pending'
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-heading">Candidates</h1>
        <p className="page-sub">AI-ranked applicants — review, shortlist or reject.</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="form-input"
          type="text"
          placeholder="Search by name or role..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 240 }}
        />
        {['all','pending','shortlisted','rejected'].map(f => (
          <button
            key={f}
            className={`btn btn-outline btn-sm${filter === f ? ' active' : ''}`}
            style={filter === f ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--muted)' }}>
          {filtered.length} candidate{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <span className="spinner spinner-dark" style={{ width: 20, height: 20 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-text">No candidates match your filter.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Role Applied</th>
                <th>Match Score</th>
                <th>AI Verdict</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <React.Fragment key={c.candidate_id || i}>
                  <tr
                    style={{ cursor: 'pointer' }}
                    onClick={() => setExpanded(expanded === c.candidate_id ? null : c.candidate_id)}
                  >
                    <td style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{i+1}</td>
                    <td style={{ fontWeight: 500 }}>{c.full_name}</td>
                    <td style={{ color: 'var(--text-light)', fontSize: '0.82rem' }}>{c.role_title}</td>
                    <td>
                      <div className="score-bar-wrap">
                        <div className="score-bar">
                          <div className="score-bar-fill" style={{ width: `${c.match_score}%`, background: scoreColor(c.match_score) }} />
                        </div>
                        <span className="score-num" style={{ color: scoreColor(c.match_score) }}>{c.match_score}%</span>
                      </div>
                    </td>
                    <td><span className={verdictBadge(c.ai_verdict)}>{c.ai_verdict}</span></td>
                    <td><span className={statusBadge(c.status)}>{c.status}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {c.status !== 'Shortlisted' && (
                          <button
                            className="btn btn-success btn-sm"
                            disabled={updating === c.candidate_id}
                            onClick={() => updateStatus(c.candidate_id, 'Shortlisted')}
                          >
                            ✓ Shortlist
                          </button>
                        )}
                        {c.status !== 'Rejected' && (
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={updating === c.candidate_id}
                            onClick={() => updateStatus(c.candidate_id, 'Rejected')}
                          >
                            ✕ Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {expanded === c.candidate_id && (
                    <tr key={`exp-${c.candidate_id}`}>
                      <td colSpan={7} style={{ background: 'var(--off-white)', padding: '16px 20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                              Matched Skills
                            </div>
                            <div className="skill-tags">
                              {(c.matched_skills || []).map((s,j) => (
                                <span key={j} className="skill-tag skill-match">{s}</span>
                              ))}
                              {(!c.matched_skills || c.matched_skills.length === 0) && (
                                <span className="skill-tag skill-neutral">No skills found</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                              AI Summary
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: 1.7 }}>
                              {c.summary || 'No summary available.'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

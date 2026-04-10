import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import axios from 'axios'

const MOCK_STATS = { total: 4, avg: 72, strong: 2, jobs: 2 }
const MOCK_CANDIDATES = [
  { candidate_id: 1, full_name: 'Priya Sharma',  role_title: 'ML Engineer',   match_score: 91, ai_verdict: 'Strong Match',   status: 'Shortlisted' },
  { candidate_id: 2, full_name: 'Rahul Verma',   role_title: 'ML Engineer',   match_score: 78, ai_verdict: 'Strong Match',   status: 'Pending' },
  { candidate_id: 3, full_name: 'Ananya Singh',  role_title: 'Data Analyst',  match_score: 55, ai_verdict: 'Moderate Match', status: 'Pending' },
  { candidate_id: 4, full_name: 'Karan Mehta',   role_title: 'ML Engineer',   match_score: 36, ai_verdict: 'Weak Match',     status: 'Rejected' },
]
const MOCK_SKILLS = [
  { skill: 'Python',     count: 4 },
  { skill: 'SQL',        count: 3 },
  { skill: 'TensorFlow', count: 2 },
  { skill: 'Flask',      count: 2 },
  { skill: 'React',      count: 1 },
]

export default function RecruiterDashboard() {
  const navigate = useNavigate()
  const [stats,      setStats]      = useState(MOCK_STATS)
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES)
  const [skills,     setSkills]     = useState(MOCK_SKILLS)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const h = { Authorization: `Bearer ${localStorage.getItem('token')}` }
      const [s, c] = await Promise.all([
        axios.get('/api/dashboard/stats',     { headers: h }),
        axios.get('/api/recruiter/candidates',{ headers: h }),
      ])
      setStats(s.data)
      setCandidates(c.data.candidates || [])
      setSkills(s.data.topSkills || [])
    } catch { /* use mock */ }
    finally { setLoading(false) }
  }

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

  function rankClass(i) {
    return ['rank-1','rank-2','rank-3'][i] || 'rank-n'
  }
  // getGreeting function
  function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-heading">{getGreeting()} 👋</h1>
        <p className="page-sub">Here's what's happening with your hiring pipeline today.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Candidates</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-sub">screened via AI</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Match Score</div>
          <div className="stat-value">{stats.avg ? `${stats.avg}%` : '—'}</div>
          <div className="stat-sub">across all roles</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Strong Matches</div>
          <div className="stat-value">{stats.strong}</div>
          <div className="stat-sub">score ≥ 75%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Jobs</div>
          <div className="stat-value">{stats.jobs}</div>
          <div className="stat-sub">posted by you</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

        {/* Candidates Table */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 className="card-title" style={{ marginBottom: 0 }}>Top Candidates</h2>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/recruiter/candidates')}>
              View all →
            </button>
          </div>

          {candidates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <div className="empty-text">No candidates yet. Share your job posting!</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Candidate</th>
                  <th>Role</th>
                  <th>Score</th>
                  <th>Verdict</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...candidates].sort((a,b) => b.match_score - a.match_score).slice(0,5).map((c,i) => (
                  <tr key={c.candidate_id || i}>
                    <td><div className={`rank-badge ${rankClass(i)}`}>{i+1}</div></td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Skill Chart */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h2 className="card-title">Top Skills</h2>
          {skills.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <div className="empty-text">No skill data yet.</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={skills} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <YAxis type="category" dataKey="skill" tick={{ fontSize: 12, fill: 'var(--text)' }} width={70} />
                <Tooltip
                  contentStyle={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: 'var(--off-white)' }}
                />
                <Bar dataKey="count" radius={[0,4,4,0]}>
                  {skills.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? 'var(--accent)' : 'var(--accent-mid)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  )
}

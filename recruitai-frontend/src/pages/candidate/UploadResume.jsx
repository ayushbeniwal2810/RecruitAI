import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const STEPS = [
  'Reading uploaded file...',
  'Extracting text & skills...',
  'Computing TF-IDF vectors...',
  'Running cosine similarity...',
  'Generating AI verdict...',
]

export default function UploadResume() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const fileRef   = useRef()

  const [file,      setFile]      = useState(null)
  const [dragOver,  setDragOver]  = useState(false)
  const [jobId,     setJobId]     = useState('')
  const [jobs,      setJobs]      = useState([])
  const [loading,   setLoading]   = useState(false)
  const [stepIdx,   setStepIdx]   = useState(-1)
  const [doneSteps, setDoneSteps] = useState([])
  const [result,    setResult]    = useState(null)
  const [error,     setError]     = useState('')

  useEffect(() => {
    // Pre-select job if coming from Browse Jobs
    if (location.state?.jd_id) {
      setJobId(String(location.state.jd_id))
    }
    loadJobs()
  }, [])

  async function loadJobs() {
    try {
      const h = { Authorization: `Bearer ${localStorage.getItem('token')}` }
      const res = await axios.get('/api/recruiter/jobs', { headers: h })
      setJobs(res.data.jobs || [])
      if (!location.state?.jd_id && res.data.jobs?.length > 0) {
        setJobId(String(res.data.jobs[0].jd_id))
      }
    } catch {
      setJobs([{ jd_id: 1, role_title: 'Machine Learning Engineer' }])
      if (!location.state?.jd_id) setJobId('1')
    }
  }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) validate(f)
  }

  function validate(f) {
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      setError('Only PDF, DOCX, or TXT files are supported.')
      return
    }
    setFile(f); setError(''); setResult(null)
  }

  async function animateSteps() {
    setDoneSteps([]); setStepIdx(-1)
    for (let i = 0; i < STEPS.length; i++) {
      setStepIdx(i)
      await delay(700)
      setDoneSteps(prev => [...prev, i])
    }
    setStepIdx(-1)
  }

  async function handleSubmit() {
    if (!file)  { setError('Please upload your resume.'); return }
    if (!jobId) { setError('Please select a job.'); return }

    setError(''); setLoading(true); setResult(null)

    const form = new FormData()
    form.append('resume', file)
    form.append('jd_id',  jobId)

    try {
      const h = { Authorization: `Bearer ${localStorage.getItem('token')}` }
      const [res] = await Promise.all([
        axios.post('/api/candidate/upload', form, {
          headers: { ...h, 'Content-Type': 'multipart/form-data' }
        }),
        animateSteps()
      ])
      setResult(res.data)
    } catch (err) {
      if (!err.response) {
        setError('Backend not connected. Start your Flask server on port 5000.')
      } else {
        setError(err.response?.data?.message || 'Upload failed. Try again.')
      }
      setStepIdx(-1); setDoneSteps([])
    } finally {
      setLoading(false)
    }
  }

  function clearAll() {
    setFile(null); setResult(null); setError('')
    setStepIdx(-1); setDoneSteps([])
    if (fileRef.current) fileRef.current.value = ''
  }

  function scoreClass(s) {
    if (s >= 75) return 'score-high'
    if (s >= 50) return 'score-mid'
    return 'score-low'
  }

  function recColor(r) {
    if (r === 'Shortlist') return 'var(--green)'
    if (r === 'Consider')  return 'var(--amber)'
    return 'var(--red)'
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-heading">Upload Resume</h1>
        <p className="page-sub">Upload your resume and get an instant AI match score.</p>
      </div>

      <div style={{ maxWidth: 680 }}>

        {/* Job Selection */}
        <div className="card">
          <h2 className="card-title">Select Job</h2>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Applying for</label>
            <select
              className="form-select"
              value={jobId}
              onChange={e => setJobId(e.target.value)}
            >
              {jobs.map(j => (
                <option key={j.jd_id} value={j.jd_id}>
                  {j.role_title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* File Upload */}
        <div className="card">
          <h2 className="card-title">Your Resume</h2>

          {!file ? (
            <div
              className={`upload-area${dragOver ? ' drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={e => e.target.files[0] && validate(e.target.files[0])}
              />
              <div className="upload-icon">📄</div>
              <div className="upload-title">Drop your resume here</div>
              <div className="upload-hint">
                Supports <strong>PDF</strong>, <strong>DOCX</strong>, <strong>TXT</strong>
                <br />Click to browse or drag & drop
              </div>
            </div>
          ) : (
            <div className="file-preview">
              <span style={{ fontSize: '1.4rem' }}>
                {file.name.endsWith('.pdf')  ? '📕' :
                 file.name.endsWith('.docx') ? '📘' : '📄'}
              </span>
              <div style={{ flex: 1 }}>
                <div className="file-name">{file.name}</div>
                <div className="file-size">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
              <span className="file-remove" onClick={clearAll}>✕</span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" /> Analyzing...</>
              : '✦ Analyze with AI'}
          </button>
          <button className="btn btn-outline" onClick={clearAll}>
            Clear
          </button>
        </div>

        {/* Progress Steps */}
        {loading && (
          <div className="progress-box fade-up">
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--heading)', marginBottom: 12 }}>
              AI Processing Pipeline
            </div>
            {STEPS.map((step, i) => (
              <div
                key={i}
                className={`progress-step${
                  doneSteps.includes(i) ? ' done' :
                  stepIdx === i ? ' active' : ''
                }`}
              >
                <span style={{ width: 18, fontSize: '0.85rem' }}>
                  {doneSteps.includes(i) ? '✓' : stepIdx === i ? '…' : '○'}
                </span>
                {step}
              </div>
            ))}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="result-card fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                AI Analysis Complete
              </span>
              <span style={{
                fontSize: '0.82rem', fontWeight: 600,
                color: recColor(result.recommendation),
                padding: '4px 12px', borderRadius: 20,
                background:
                  result.recommendation === 'Shortlist' ? 'var(--green-soft)' :
                  result.recommendation === 'Consider'  ? 'var(--amber-soft)' :
                  'var(--red-soft)',
              }}>
                {result.recommendation}
              </span>
            </div>

            {/* Score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 18 }}>
              <div className={`score-circle ${scoreClass(result.score)}`}>
                {result.score}%
              </div>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: 'var(--heading)', marginBottom: 6 }}>
                  Your Match Score
                </div>
                <span className={
                  result.verdict === 'Strong Match'   ? 'badge badge-strong'   :
                  result.verdict === 'Moderate Match' ? 'badge badge-moderate' :
                  'badge badge-weak'
                }>
                  {result.verdict}
                </span>
              </div>
            </div>

            {/* Skills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Matched Skills ({result.matchedSkills?.length || 0})
                </div>
                <div className="skill-tags">
                  {(result.matchedSkills || []).map((s, i) => (
                    <span key={i} className="skill-tag skill-match">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Missing Skills ({result.missingSkills?.length || 0})
                </div>
                <div className="skill-tags">
                  {(result.missingSkills || []).map((s, i) => (
                    <span key={i} className="skill-tag skill-miss">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="analysis-text">{result.summary}</div>

            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate('/candidate/dashboard')}
              >
                View Dashboard →
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate('/candidate/jobs')}
              >
                Browse More Jobs
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }
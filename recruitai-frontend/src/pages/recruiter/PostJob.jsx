import { useState } from 'react'
import axios from 'axios'

export default function PostJob() {
  const [roleTitle,   setRoleTitle]   = useState('')
  const [description, setDescription] = useState('')
  const [skills,      setSkills]      = useState('')
  const [loading,     setLoading]     = useState(false)
  const [success,     setSuccess]     = useState(false)
  const [error,       setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true); setSuccess(false)

    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/recruiter/job', {
        role_title:      roleTitle,
        description,
        required_skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccess(true)
      setRoleTitle(''); setDescription(''); setSkills('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-heading">Post a Job</h1>
        <p className="page-sub">Create a job description for candidates to apply against.</p>
      </div>

      <div style={{ maxWidth: 680 }}>
        <div className="card">

          {success && (
            <div style={{
              background: 'var(--green-soft)', border: '1px solid #b7e0c9',
              borderRadius: 'var(--radius-sm)', padding: '12px 16px',
              fontSize: '0.88rem', color: 'var(--green)', marginBottom: 20,
            }}>
              ✓ Job posted successfully! Candidates can now apply.
            </div>
          )}

          {error && (
            <div className="login-error">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Job Title *</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Machine Learning Engineer"
                value={roleTitle}
                onChange={e => setRoleTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Job Description *</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: 180 }}
                placeholder={`Describe the role, responsibilities, and requirements...\n\nExample:\nWe are looking for a Machine Learning Engineer to join our team.\n\nResponsibilities:\n- Build and deploy ML models\n- Work with large datasets\n\nRequirements:\n- 1-3 years experience\n- Strong Python skills`}
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Required Skills</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Python, TensorFlow, SQL, Flask (comma separated)"
                value={skills}
                onChange={e => setSkills(e.target.value)}
              />
              <p className="form-hint">Separate skills with commas — used for AI matching</p>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" /> Posting...</> : '✦ Post Job'}
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => { setRoleTitle(''); setDescription(''); setSkills(''); setError(''); setSuccess(false) }}
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Tips */}
        <div className="card" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-mid)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent)', marginBottom: 10 }}>
            💡 Tips for better AI matching
          </h3>
          <ul style={{ paddingLeft: 18, fontSize: '0.83rem', color: 'var(--text-light)', lineHeight: 2 }}>
            <li>Be specific about required skills — the AI uses these to score candidates</li>
            <li>Mention years of experience clearly in the description</li>
            <li>List both technical and soft skills for better coverage</li>
            <li>The more detailed your JD, the more accurate the AI scoring</li>
          </ul>
        </div>
      </div>
    </>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import RecruiterLayout from './components/RecruiterLayout.jsx'
import CandidateLayout from './components/CandidateLayout.jsx'
import RecruiterDashboard from './pages/recruiter/Dashboard.jsx'
import PostJob from './pages/recruiter/PostJob.jsx'
import CandidateList from './pages/recruiter/CandidateList.jsx'
import CandidateDashboard from './pages/candidate/Dashboard.jsx'
import UploadResume from './pages/candidate/UploadResume.jsx'
import MyJobs from './pages/recruiter/MyJobs.jsx'
import BrowseJobs from './pages/candidate/BrowseJobs.jsx'
import Settings from './pages/Settings.jsx'

function RequireRole({ role, children }) {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (!token) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/recruiter" element={
          <RequireRole role="recruiter"><RecruiterLayout /></RequireRole>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<RecruiterDashboard />} />
          <Route path="post-job" element={<PostJob />} />
          <Route path="candidates" element={<CandidateList />} />
          <Route path="my-jobs" element={<MyJobs />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/candidate" element={
          <RequireRole role="candidate"><CandidateLayout /></RequireRole>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CandidateDashboard />} />
          <Route path="upload" element={<UploadResume />} />
          <Route path="jobs" element={<BrowseJobs />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
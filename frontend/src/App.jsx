import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import Workers from './pages/admin/Workers.jsx'
import WorkerDetail from './pages/admin/WorkerDetail.jsx'
import Reports from './pages/admin/Reports.jsx'
import Settings from './pages/admin/Settings.jsx'
import WorkerDashboard from './pages/worker/Dashboard.jsx'
import LogHours from './pages/worker/LogHours.jsx'
import Resources from './pages/worker/Resources.jsx'
import LoginInfo from './pages/worker/LoginInfo.jsx'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin routes */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route element={<Layout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/workers" element={<Workers />} />
              <Route path="/admin/workers/:id" element={<WorkerDetail />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Worker routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/worker/dashboard" element={<WorkerDashboard />} />
              <Route path="/worker/log-hours" element={<LogHours />} />
              <Route path="/worker/resources" element={<Resources />} />
              <Route path="/worker/login-info" element={<LoginInfo />} />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

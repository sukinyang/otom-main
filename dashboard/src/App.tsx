import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Overview from './pages/Overview'
import Sessions from './pages/Sessions'
import Consultations from './pages/Consultations'
import ProcessMaps from './pages/ProcessMaps'
import Reports from './pages/Reports'
import Processes from './pages/Processes'
import Insights from './pages/Insights'
import Employees from './pages/Employees'
import Messages from './pages/Messages'
import Settings from './pages/Settings'

function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="consultations" element={<Consultations />} />
        <Route path="process-maps" element={<ProcessMaps />} />
        <Route path="reports" element={<Reports />} />
        <Route path="processes" element={<Processes />} />
        <Route path="insights" element={<Insights />} />
        <Route path="employees" element={<Employees />} />
        <Route path="messages" element={<Messages />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App

// src/App.jsx
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import Logout from './components/Logout';
import ScrollToTop from './components/ScrollToTop';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFound from './pages/NotFound';
import Home from './pages/Home';
import UserDashboard from './pages/UserDashboard';
import AdminPortal from './pages/AdminPortal';
import Direct from './pages/Direct';
import Broadcast from './pages/Broadcast';

import SystemBanner from './components/SystemBanner';
import AudioCall from './components/AudioCall';
import VideoCall from './components/VideoCall';

import { CallProvider } from './context/CallContext';
import IncomingCallToast from './components/IncomingCallToast';
import Profile from './pages/Profile';

function GlobalIncomingToast() {
  const navigate = useNavigate();
  return <IncomingCallToast onNavigate={navigate} />;
}

const App = () => {
  return (
    <Router>
      <CallProvider>
        <ScrollToTop />
        <SystemBanner />

        {/* Global incoming-call popup, visible on every route */}
        <GlobalIncomingToast />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/profile" element={<Profile />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRole="user">
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/broadcast"
            element={
              <ProtectedRoute allowedRole="user">
                <Broadcast />
              </ProtectedRoute>
            }
          />

          {/* Call UIs */}
          <Route path="/call/audio/:id" element={<AudioCall />} />
          <Route path="/call/video/:id" element={<VideoCall />} />

          <Route
            path="/chat/:id"
            element={
              <ProtectedRoute allowedRole="user">
                <Direct />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminPortal />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </CallProvider>
    </Router>
  );
};

export default App;

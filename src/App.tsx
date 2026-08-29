import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PhoneWrapper } from './components/PhoneWrapper';
import { BottomNavigation } from './components/BottomNavigation';
import { Splash } from './pages/Splash';
import { GaneshaLoader } from './components/GaneshaLoader';

// Pages imports
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { Finance } from './pages/Finance';
import { Expenses } from './pages/Expenses';
import { AdminSettings } from './pages/AdminSettings';

const ScreenTransitionContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
      {children}
    </div>
  );
};

const AppContent: React.FC = () => {
  const { role, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('tg_splash_shown');
  });

  const handleSplashFinish = () => {
    sessionStorage.setItem('tg_splash_shown', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <Splash onFinish={handleSplashFinish} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg flex flex-col justify-center items-center">
        <GaneshaLoader message="TEAM GARUDA" subMessage="Loading..." isFullPage={true} />
      </div>
    );
  }

  return (
    <Router>
      <PhoneWrapper>
        <ScreenTransitionContainer>
          <Routes>
            {!role || role === 'PUBLIC' ? (
              // Not logged in -> Directly show Login page
              <>
                <Route path="/" element={<Login />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              // Committee / Admin Management Routes
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/members" element={<Members />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/media-management" element={<Navigate to="/expenses" replace />} />
                <Route path="/more" element={<AdminSettings />} />
                {/* Fallback to Dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            )}
          </Routes>
        </ScreenTransitionContainer>

        {/* Sticky bottom navigation bar */}
        <BottomNavigation />
      </PhoneWrapper>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

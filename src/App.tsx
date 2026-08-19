import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PhoneWrapper } from './components/PhoneWrapper';
import { BottomNavigation } from './components/BottomNavigation';
import { Splash } from './pages/Splash';
import { GaneshaLoader } from './components/GaneshaLoader';

// Pages imports
import { Home } from './pages/Home';
import { Events } from './pages/Events';
import { EventDetails } from './pages/EventDetails';
import { Gallery } from './pages/Gallery';
import { MemberLookup } from './pages/MemberLookup';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { Finance } from './pages/Finance';
import { MediaManagement } from './pages/MediaManagement';
import { AdminSettings } from './pages/AdminSettings';

const ScreenTransitionContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname;
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 1100); // 1.1s smooth screen transition loader
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
      {isTransitioning && (
        <div className="absolute inset-0 z-50 animate-fade-in">
          <GaneshaLoader 
            message="TEAM GARUDA" 
            subMessage="Sri Ganesha Krupa" 
            isFullPage={false} 
          />
        </div>
      )}
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

  const isPublicOrMember = role === 'PUBLIC' || role === 'MEMBER';

  return (
    <Router>
      <PhoneWrapper>
        <ScreenTransitionContainer>
          <Routes>
            {isPublicOrMember ? (
              // Public / Member Portal Routes
              <>
                <Route path="/" element={<Home />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetails />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/my-contribution" element={<MemberLookup />} />
                <Route path="/login" element={<Login />} />
                {/* Fallback to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              // Committee / Admin Management Routes
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/members" element={<Members />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/media-management" element={<MediaManagement />} />
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

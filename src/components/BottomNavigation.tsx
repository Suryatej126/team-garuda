import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Calendar, 
  Image as ImageIcon, 
  Wallet, 
  LayoutDashboard, 
  Users, 
  Landmark, 
  Film, 
  Menu 
} from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isPublicOrMember = role === 'PUBLIC' || role === 'MEMBER';

  const handleTabClick = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  if (isPublicOrMember) {
    const tabs = [
      { id: 'home', label: 'Home', icon: Home, path: '/' },
      { id: 'events', label: 'Events', icon: Calendar, path: '/events' },
      { id: 'gallery', label: 'Gallery', icon: ImageIcon, path: '/gallery' },
      { id: 'contribution', label: 'My Contribution', icon: Wallet, path: '/my-contribution' },
    ];

    return (
      <div className="h-16 bg-white border-t border-border-custom flex items-center justify-around px-2 pb-safe select-none shrink-0 z-40">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-extrabold transition-all duration-200 ${
                active ? 'text-primary-maroon scale-105' : 'text-secondary-text hover:text-primary-text'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 stroke-[2.2] transition-colors ${active ? 'text-primary-maroon' : 'text-secondary-text'}`} />
              <span className="relative">
                {tab.label}
                {active && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-antique-gold" />}
              </span>
            </button>
          );
        })}
      </div>
    );
  } else {
    // Committee / Admin tabs
    const tabs = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { id: 'members', label: 'Members', icon: Users, path: '/members' },
      { id: 'finance', label: 'Finance', icon: Landmark, path: '/finance' },
      { id: 'media', label: 'Media', icon: Film, path: '/media-management' },
      { id: 'more', label: 'More', icon: Menu, path: '/more' },
    ];

    return (
      <div className="h-16 bg-white border-t border-border-custom flex items-center justify-around px-2 pb-safe select-none shrink-0 z-40">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path) || (tab.id === 'more' && ['/settings', '/events-management', '/add-event', '/add-member'].some(p => location.pathname.startsWith(p)));
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-extrabold transition-all duration-200 ${
                active ? 'text-primary-maroon scale-105' : 'text-secondary-text hover:text-primary-text'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 stroke-[2.2] transition-colors ${active ? 'text-primary-maroon' : 'text-secondary-text'}`} />
              <span className="relative">
                {tab.label}
                {active && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-antique-gold" />}
              </span>
            </button>
          );
        })}
      </div>
    );
  }
};

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'PUBLIC' | 'MEMBER' | 'USER' | 'COMMITTEE' | 'ADMIN';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'COMMITTEE' | 'ADMIN';
}

export interface VerifiedMember {
  id: number;
  member_id: string;
  name: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface AuthContextType {
  role: UserRole;
  user: User | null;
  verifiedMember: VerifiedMember | null;
  token: string | null;
  login: (user: User, token: string) => void;
  verifyMember: (member: VerifiedMember) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('PUBLIC');
  const [user, setUser] = useState<User | null>(null);
  const [verifiedMember, setVerifiedMember] = useState<VerifiedMember | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load credentials from localStorage
    const savedToken = localStorage.getItem('tg_token');
    const savedUser = localStorage.getItem('tg_user');
    const savedMember = localStorage.getItem('tg_member');
    const savedRole = localStorage.getItem('tg_role') as UserRole;

    if (savedToken && savedUser) {
      setToken(savedToken);
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setRole((savedRole as UserRole) || parsedUser.role || 'USER');
    } else if (savedMember) {
      setVerifiedMember(JSON.parse(savedMember));
      setRole('MEMBER');
    } else {
      setRole('PUBLIC');
    }
    setLoading(false);
  }, []);

  const login = (userData: User, userToken: string) => {
    setToken(userToken);
    setUser(userData);
    setRole(userData.role as UserRole);
    setVerifiedMember(null);
    localStorage.setItem('tg_token', userToken);
    localStorage.setItem('tg_user', JSON.stringify(userData));
    localStorage.setItem('tg_role', userData.role);
    localStorage.removeItem('tg_member');
  };

  const verifyMember = (memberData: VerifiedMember) => {
    setVerifiedMember(memberData);
    setRole('MEMBER');
    setUser(null);
    setToken(null);
    localStorage.setItem('tg_member', JSON.stringify(memberData));
    localStorage.setItem('tg_role', 'MEMBER');
    localStorage.removeItem('tg_token');
    localStorage.removeItem('tg_user');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setVerifiedMember(null);
    setRole('PUBLIC');
    localStorage.removeItem('tg_token');
    localStorage.removeItem('tg_user');
    localStorage.removeItem('tg_member');
    localStorage.removeItem('tg_role');
  };

  // 30-Minute Inactivity Session Timeout
  useEffect(() => {
    if (role === 'PUBLIC') return; // Don't timeout if they are already logged out

    let timeoutId: number;
    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

    const resetTimeout = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        logout();
        alert('Your session has expired due to inactivity.');
      }, INACTIVITY_LIMIT_MS);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, { passive: true });
    });

    resetTimeout();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout);
      });
    };
  }, [role]); // Re-run when role changes so we can attach/detach based on login state

  return (
    <AuthContext.Provider value={{ role, user, verifiedMember, token, login, verifyMember, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

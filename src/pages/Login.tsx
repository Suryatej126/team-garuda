import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User as UserIcon, AlertCircle, Bird } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      });
      if (res.ok) {
        const data = await res.json(); // { access_token, token_type, role, username }
        const userData = {
          id: 1, // Placeholder backend user ID, retrieved from sub token payload or default
          username: data.username,
          email: `${data.username}@teamgaruda.in`,
          role: data.role,
        };
        login(userData, data.access_token);
        navigate('/dashboard');
      } else {
        const errData = await res.json();
        setErrorMsg(errData.detail || 'Authentication failed.');
      }
    } catch (err) {
      setErrorMsg('Network error. Check backend server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-primary-bg text-primary-text overflow-y-auto no-scrollbar justify-center px-6 py-10 relative">
      <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          {/* Logo Badge with visual absolute fallback */}
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary-maroon to-[#410609] border-2 border-antique-gold flex items-center justify-center shadow-xl mb-4 overflow-hidden">
            <img 
              src="/logo.png" 
              className="w-full h-full object-cover z-10" 
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
              alt="Team Garuda Logo" 
            />
            {/* Fallback Lucide Icon behind the image */}
            <div className="absolute inset-0 flex items-center justify-center text-light-gold z-0">
              <Bird className="w-8 h-8 stroke-[1.8]" />
            </div>
          </div>
          
          <h1 className="text-2xl font-serif font-black tracking-[0.2em] text-primary-maroon uppercase drop-shadow-xs">
            Team Garuda
          </h1>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-antique-gold block mt-1 animate-pulse">
            Sri Ganesha Krupa
          </span>
          <p className="text-[11px] text-secondary-text mt-3 max-w-[260px] leading-relaxed font-semibold">
            Committee Portal
          </p>
        </div>

        {/* Input Form Card */}
        <form onSubmit={handleSubmit} className="bg-white border border-border-custom/80 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-secondary-text/80">
                <UserIcon className="w-4 h-4 text-antique-gold" />
              </span>
              <input 
                type="text" 
                placeholder="Enter username" 
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                className="w-full bg-secondary-bg/30 border border-border-custom rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text placeholder:text-secondary-text/50 font-semibold"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-secondary-text/80">
                <Lock className="w-4 h-4 text-antique-gold" />
              </span>
              <input 
                type="password" 
                placeholder="Enter password" 
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full bg-secondary-bg/30 border border-border-custom rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text placeholder:text-secondary-text/50"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="bg-error/10 border border-error/20 text-error text-[10px] px-3 py-2.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-maroon text-white font-extrabold text-xs py-3.5 rounded-xl mt-1 active:scale-98 hover:bg-dark-maroon transition-all flex justify-center items-center shadow-md cursor-pointer"
          >
            {submitting ? (
              <div className="w-4.5 h-4.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

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
    <div className="flex-1 flex flex-col justify-center items-center px-6 min-h-screen relative overflow-hidden select-none bg-black">
      {/* Background Video */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover opacity-60 z-0 pointer-events-none filter blur-sm scale-105"
      >
        <source src="/login_video.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/45 z-10 pointer-events-none" />

      {/* Elegant Shimmer sweep */}
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(0,0,0,0)_0%,rgba(255,215,0,0.03)_45%,rgba(255,215,0,0.08)_50%,rgba(255,215,0,0.03)_55%,rgba(0,0,0,0)_100%)] bg-[length:200%_100%] animate-shimmer pointer-events-none z-10" />

      {/* Login Card wrapper */}
      <div className="w-full max-w-sm z-20 flex flex-col gap-6 animate-fade-in px-4">
        
        {/* Glass Card Container */}
        <div className="backdrop-blur-xl bg-black/60 border border-white/10 p-7 rounded-[32px] shadow-2xl flex flex-col gap-5 relative overflow-hidden">
          
          {/* Top Gold accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-antique-gold/60 to-transparent" />

          {/* Logo Badge */}
          <div className="flex flex-col items-center text-center -mt-2">
            <div className="relative w-18 h-18 rounded-full bg-gradient-to-br from-primary-maroon to-[#1f0204] border border-antique-gold/40 flex items-center justify-center shadow-lg overflow-hidden mb-3">
              <img 
                src="/logo.png" 
                className="w-full h-full object-cover z-10" 
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
                alt="Logo" 
              />
              <div className="absolute inset-0 flex items-center justify-center text-antique-gold z-0">
                <Bird className="w-7 h-7 stroke-[1.8]" />
              </div>
            </div>
            
            <h1 className="text-xl font-serif font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-[#fff6c5] via-antique-gold to-[#f5d078] uppercase drop-shadow-md">
              Team Garuda
            </h1>
            <span className="text-[8px] font-extrabold uppercase tracking-[0.25em] text-white/50 block mt-0.5">
              Sri Ganesha Krupa
            </span>
          </div>

          {/* Login Fields */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-white/60 uppercase tracking-widest pl-1">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center">
                  <UserIcon className="w-4 h-4 text-antique-gold/80" />
                </span>
                <input 
                  type="text" 
                  placeholder="Enter Username" 
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-antique-gold/60 focus:bg-white/10 transition-all font-semibold tracking-wide"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-white/60 uppercase tracking-widest pl-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center">
                  <Lock className="w-4 h-4 text-antique-gold/80" />
                </span>
                <input 
                  type="password" 
                  placeholder="Enter Password" 
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-antique-gold/60 focus:bg-white/10 transition-all tracking-wide"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="bg-error/10 border border-error/20 text-error text-[10px] px-3.5 py-2.5 rounded-2xl flex items-center gap-2 mt-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-primary-maroon to-[#4b070b] hover:from-[#82191f] hover:to-[#5c0b10] border border-antique-gold/20 text-white font-extrabold text-xs py-3.5 rounded-2xl mt-2 active:scale-95 transition-all flex justify-center items-center shadow-lg cursor-pointer"
            >
              {submitting ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <span className="tracking-widest uppercase">Sign In</span>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

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
    <div className="flex-1 flex flex-col bg-primary-bg text-primary-text overflow-y-auto no-scrollbar justify-center px-6 py-12 relative">
      {/* Back to Hub public link */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 text-xs font-bold text-secondary-text hover:text-primary-maroon transition-colors"
      >
        ← Back to Hub
      </button>

      <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-3xl bg-primary-maroon flex items-center justify-center text-light-gold mb-4 shadow-lg border border-border-custom">
            <Bird className="w-7 h-7 stroke-[1.8]" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-primary-maroon font-serif">Committee Sign In</h3>
          <p className="text-xs text-secondary-text mt-2 max-w-[260px] leading-relaxed">
            Enter admin or committee credentials to manage community members, contributions, and expenses.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-secondary-text/80">
                <UserIcon className="w-4 h-4 text-antique-gold" />
              </span>
              <input 
                type="text" 
                placeholder="e.g. suriya" 
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                className="w-full bg-white border border-border-custom rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary-maroon text-primary-text placeholder:text-secondary-text/60 font-semibold"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-secondary-text/80">
                <Lock className="w-4 h-4 text-antique-gold" />
              </span>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full bg-white border border-border-custom rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary-maroon text-primary-text placeholder:text-secondary-text/60"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="bg-error/10 border border-error/20 text-error text-xs px-3.5 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-maroon text-white font-extrabold text-xs py-3.5 rounded-xl mt-2 active:scale-98 hover:bg-dark-maroon transition-all flex justify-center items-center shadow-lg shadow-primary-maroon/10 cursor-pointer"
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

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { Phone, Lock, ChevronLeft, ShieldCheck, Mail, Eye, EyeOff } from 'lucide-react';


export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Number/Username and Password are required.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          email: email || undefined
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Use the role returned by the server (e.g. 'USER', 'COMMITTEE', 'ADMIN')
        const userData = {
          id: data.id || Date.now(),
          username: data.username,
          email: email || `${data.username}@teamgaruda.in`,
          role: data.role as 'USER' | 'COMMITTEE' | 'ADMIN',
        };
        login(userData, data.access_token);
        // Navigate to home — no need to login again
        navigate('/', { replace: true });
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Registration Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#FAF7F2] text-[#292522]">
      <header className="h-16 px-4 shrink-0 flex items-center justify-between border-b border-[#E5DDD2] bg-white sticky top-0 z-10 shadow-sm">
        <button 
          onClick={() => navigate('/')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F3EEE6] text-[#756D65] hover:bg-[#E5DDD2] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-bold text-[#6E1F24] tracking-wide">Register</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto pb-safe relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF7F2] to-[#E5C77D]/10 pointer-events-none" />

        <div className="w-full max-w-sm flex flex-col items-center z-10">
          <div className="w-20 h-20 rounded-full bg-white shadow-md border border-[#E5DDD2] flex items-center justify-center mb-6 overflow-hidden p-1 relative">
            <img 
              src="/logo.png" 
              alt="Team Garuda" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-black font-serif text-[#6E1F24] mb-2 tracking-tight">Create an Account</h2>
            <p className="text-sm text-[#756D65]">Join the community to stay updated</p>
          </div>

          <form onSubmit={handleRegister} className="w-full bg-white p-6 rounded-3xl shadow-sm border border-[#E5DDD2] flex flex-col gap-5">
            {error && (
              <div className="bg-[#A33A32]/10 text-[#A33A32] p-3 rounded-xl text-sm font-semibold text-center border border-[#A33A32]/20">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#756D65] uppercase tracking-wider pl-1">Number or Username</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C99A4A]">
                  <Phone className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-[#FAF7F2] border border-[#E5DDD2] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C99A4A]/50 focus:border-[#C99A4A] transition-all font-medium text-[#292522]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#756D65] uppercase tracking-wider pl-1">Email (Optional)</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C99A4A]">
                  <Mail className="w-4 h-4" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#FAF7F2] border border-[#E5DDD2] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C99A4A]/50 focus:border-[#C99A4A] transition-all font-medium text-[#292522]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#756D65] uppercase tracking-wider pl-1">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C99A4A]">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full bg-[#FAF7F2] border border-[#E5DDD2] rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C99A4A]/50 focus:border-[#C99A4A] transition-all font-medium text-[#292522]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8E80] hover:text-[#6E1F24] transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-2 cursor-pointer w-full bg-gradient-to-r from-[#6E1F24] to-[#52171B] text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center items-center h-12"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Register Account"
              )}
            </button>
            
            <div className="mt-2 text-center text-sm font-medium text-[#756D65]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#6E1F24] hover:underline font-bold">
                Login here
              </Link>
            </div>
          </form>

          <div className="mt-8 flex items-center justify-center gap-1.5 text-[10px] text-[#756D65] font-medium bg-white px-3 py-1.5 rounded-full border border-[#E5DDD2] shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-[#247A5A]" />
            <span>Secure Registration</span>
          </div>
        </div>
      </main>
    </div>
  );
};

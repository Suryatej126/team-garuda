import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DonutChart, ExpenseByCategoryChart } from '../components/Charts';
import { 
  Landmark, 
  Calendar, 
  Menu, 
  Bell, 
  Plus, 
  Users, 
  TrendingUp, 
  ChevronRight,
  Receipt
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface FinanceSummary {
  total_contributions: number;
  total_sponsorships: number;
  total_chandhalu: number;
  total_funds: number;
  total_expenses: number;
  current_balance: number;
  expense_by_category: Record<string, number>;
}

interface ContributionFeedItem {
  id: number;
  amount: number;
  date: string;
  payment_method: string;
  status: string;
  member?: {
    name: string;
    member_id: string;
  } | null;
  contributor?: {
    name: string;
    phone: string | null;
  } | null;
  collected_by?: string | null;
}

export const Dashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [recentFeed, setRecentFeed] = useState<ContributionFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [videoError, setVideoError] = useState(false);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const todayDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const summaryUrl = selectedYear > 0 
          ? `${API_BASE_URL}/api/finance/summary?year=${selectedYear}`
          : `${API_BASE_URL}/api/finance/summary?year=-1`;

        // Fetch metrics in parallel using Promise.all
        const [summaryRes, feedRes] = await Promise.all([
          fetch(summaryUrl, { headers }),
          fetch(`${API_BASE_URL}/api/committee/contributions`, { headers })
        ]);

        if (summaryRes.status === 401 || feedRes.status === 401) {
          logout();
          return;
        }

        if (summaryRes.ok && feedRes.ok) {
          const summaryData = await summaryRes.json();
          const feedData = await feedRes.json();
          setSummary(summaryData);
          
          // Filter recent feed to only show public contributions (where member_id is null) for the selected year
          const filteredFeed = feedData.filter((c: any) => {
            const matchesYear = selectedYear > 0 ? new Date(c.date).getFullYear() === selectedYear : true;
            return matchesYear && !c.member_id;
          });
          setRecentFeed(filteredFeed.slice(0, 4));

          setError(null);
        } else {
          setError('Failed to fetch dashboard data. Please try again.');
        }
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
        setError('A network error occurred. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [token, selectedYear, retryTrigger, logout]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-primary-bg overflow-y-auto no-scrollbar pb-6">
        {/* Header Skeleton */}
        <div className="h-20 px-5 shrink-0 flex items-center justify-between border-b border-border-custom bg-white">
          <div className="flex flex-col gap-2">
            <div className="w-24 h-4 bg-secondary-bg rounded skeleton-shimmer" />
            <div className="w-32 h-6 bg-secondary-bg rounded skeleton-shimmer" />
          </div>
          <div className="w-8 h-8 bg-secondary-bg rounded-full skeleton-shimmer" />
        </div>

        {/* Body Skeletons */}
        <div className="flex-1 px-5 pt-4 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="w-40 h-5 bg-secondary-bg rounded skeleton-shimmer" />
            <div className="w-full h-3 bg-secondary-bg rounded skeleton-shimmer" />
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-secondary-bg skeleton-shimmer" />
                <div className="w-14 h-3 bg-secondary-bg rounded skeleton-shimmer" />
              </div>
            ))}
          </div>

          <div className="h-40 bg-white border border-border-custom rounded-3xl p-5 flex flex-col justify-between">
            <div className="w-24 h-4 bg-secondary-bg rounded skeleton-shimmer" />
            <div className="w-36 h-8 bg-secondary-bg rounded skeleton-shimmer" />
            <div className="w-full h-8 bg-secondary-bg rounded-xl skeleton-shimmer" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-white border border-border-custom rounded-2xl p-4 flex flex-col justify-between">
                <div className="w-16 h-3 bg-secondary-bg rounded skeleton-shimmer" />
                <div className="w-12 h-6 bg-secondary-bg rounded skeleton-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-primary-bg p-6 text-center">
        <Landmark className="w-12 h-12 text-primary-maroon mb-3 opacity-80" />
        <h3 className="text-sm font-bold text-primary-maroon font-serif">Unable to Load Dashboard</h3>
        <p className="text-xs text-secondary-text mt-1 max-w-xs">{error || 'Dashboard summary data is unavailable.'}</p>
        <button 
          onClick={() => {
            setError(null);
            setLoading(true);
            setRetryTrigger(prev => prev + 1);
          }}
          className="mt-4 bg-primary-maroon hover:bg-dark-maroon text-white font-bold text-[11px] px-4 py-2 rounded-xl active:scale-95 transition-all cursor-pointer shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-primary-bg text-primary-text overflow-y-auto no-scrollbar pb-28 relative">
      {/* Header Bar */}
      <div className="h-20 px-5 shrink-0 flex items-center justify-between border-b border-border-custom bg-white/90 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/more')}
            className="p-1 rounded-full text-secondary-text hover:text-primary-maroon active:scale-90 transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] text-secondary-text font-bold uppercase tracking-wider">{getGreeting()}</span>
            <h2 className="text-xl font-bold tracking-wide text-primary-maroon font-serif mt-0.5 truncate max-w-[200px]">
              {user?.username?.toUpperCase() || 'TEAM GARUDA'}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[10px] font-bold text-secondary-text/80 tracking-wide mr-1">{todayDate}</span>
          <button className="w-9 h-9 rounded-full bg-secondary-bg border border-border-custom flex items-center justify-center text-secondary-text hover:text-primary-maroon active:scale-90 transition-all relative">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-antique-gold border border-white" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 px-5 pt-4 flex flex-col gap-6">
        
        {/* Date Display for mobile layout */}
        <div className="sm:hidden block -mb-2">
          <span className="text-[10px] text-secondary-text font-bold tracking-wide">{todayDate}</span>
        </div>

        {/* Luxury Animated TEAM GARUDA Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-maroon via-[#3d0303] to-[#120000] border-2 border-antique-gold/30 rounded-3xl p-6 shadow-xl flex flex-col justify-center items-center text-center group min-h-[120px]">
          {/* Background Video (Falls back to gradient overlay if video fails or not provided) */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
            onError={() => {
              setVideoError(true);
            }}
            onPlay={() => {
              setVideoError(false);
            }}
          >
            <source src="/video.mp4" type="video/mp4" />
          </video>

          {/* Shimmer / Glow Animation overlays */}
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0)_0%,rgba(255,215,0,0.1)_45%,rgba(255,215,0,0.2)_50%,rgba(255,215,0,0.1)_55%,rgba(255,255,255,0)_100%)] bg-[length:200%_100%] animate-shimmer pointer-events-none z-10" />
          
          {/* Subtle elegant design accents */}
          <div className="absolute top-2 left-2 right-2 bottom-2 border border-antique-gold/10 rounded-2xl pointer-events-none z-10" />
          
          {/* Show gold text overlay only if the video fails to load (fallback) to prevent double/overlapping text */}
          {videoError && (
            <div className="z-10 relative">
              <h1 className="text-xl sm:text-2xl font-serif font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-light-gold via-antique-gold to-[#fff6c5] drop-shadow-md uppercase animate-pulse">
                Team Garuda
              </h1>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="h-[1px] w-8 bg-antique-gold/40"></span>
                <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-antique-gold animate-glow">
                  Sri Ganesha Krupa
                </span>
                <span className="h-[1px] w-8 bg-antique-gold/40"></span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions - horizontal scroll list */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[9px] font-bold text-secondary-text uppercase tracking-widest">Quick Operations</span>
          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={() => navigate('/members?add=true')}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-primary-maroon text-white flex items-center justify-center shadow-md border-2 border-light-gold">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-primary-text font-extrabold text-center leading-tight">Add Contrib</span>
            </button>
            
            <button 
              onClick={() => navigate('/more?addMember=true')}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-white border border-border-custom text-primary-maroon flex items-center justify-center shadow-sm">
                <Users className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] text-secondary-text font-bold text-center leading-tight">Add Member</span>
            </button>
            
            <button 
              onClick={() => navigate('/expenses')}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-white border border-border-custom text-error flex items-center justify-center shadow-sm">
                <Receipt className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] text-secondary-text font-bold text-center leading-tight">Add Expense</span>
            </button>
            
            <button 
              onClick={() => navigate('/finance')}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-white border border-border-custom text-primary-maroon flex items-center justify-center shadow-sm">
                <Landmark className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] text-secondary-text font-bold text-center leading-tight">View Finance</span>
            </button>
          </div>
        </div>

        {/* Statistics section - Grid of 4 premium cards */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-secondary-text uppercase tracking-widest">Financial Summary</span>
            {/* Year Selector Pills */}
            <div className="flex items-center gap-1 bg-secondary-bg p-0.5 rounded-lg border border-border-custom">
              {[2026, 2025, 0].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${
                    selectedYear === yr
                      ? 'bg-primary-maroon text-white shadow-xs'
                      : 'text-secondary-text hover:text-primary-text'
                  }`}
                >
                  {yr === 0 ? 'All Time' : yr}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* 1. TOTAL COLLECTION */}
            <div className="bg-white border border-border-custom p-4 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
              <div className="flex items-center justify-between text-antique-gold">
                <Landmark className="w-4 h-4" />
                <span className="text-[8px] font-bold uppercase tracking-wider text-secondary-text bg-secondary-bg px-1.5 py-0.5 rounded-full">Funds</span>
              </div>
              <div className="mt-2">
                <span className="text-[9px] font-bold text-secondary-text uppercase block">Total Collection</span>
                <span className="text-lg font-black text-primary-text mt-0.5 block">₹{summary.total_funds.toLocaleString()}</span>
              </div>
            </div>            {/* 2. TOTAL EXPENSES */}
            <div className="bg-white border border-border-custom p-4 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
              <div className="flex items-center justify-between text-error">
                <Receipt className="w-4.5 h-4.5" />
                <span className="text-[8px] font-bold uppercase tracking-wider text-secondary-text bg-secondary-bg px-1.5 py-0.5 rounded-full">Ledger</span>
              </div>
              <div className="mt-2">
                <span className="text-[9px] font-bold text-secondary-text uppercase block">Total Expenses</span>
                <span className="text-lg font-black text-error mt-0.5 block">₹{summary.total_expenses.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Balance Card */}
        <div className="bg-white border border-border-custom p-5 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="absolute top-5 right-5 w-10 h-10 rounded-full bg-secondary-bg flex items-center justify-center text-primary-maroon border border-border-custom">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-[9px] text-secondary-text font-bold uppercase tracking-widest">Current Balance</span>
          <h2 className="text-2xl font-black text-primary-maroon mt-1.5">₹{summary.current_balance.toLocaleString()}</h2>
          
          <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-border-custom text-xs">
            <div className="flex flex-col">
              <span className="text-[9px] text-secondary-text font-bold uppercase tracking-wider">Total Expenses</span>
              <span className="font-extrabold text-error mt-0.5">₹{summary.total_expenses.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-secondary-text font-bold uppercase tracking-wider">Net balance</span>
              <span className="font-extrabold text-success mt-0.5">₹{summary.current_balance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Donut Chart (Contributions vs Sponsorships) */}
        <div className="flex flex-col gap-3">
          <span className="text-[9px] font-bold text-secondary-text uppercase tracking-widest">Fund Sources breakdown</span>
          <DonutChart 
            contributions={summary.total_contributions} 
            sponsorships={summary.total_sponsorships} 
            chandhalu={summary.total_chandhalu} 
          />
        </div>

        {/* Expense Category Bar Chart */}
        {Object.keys(summary.expense_by_category).length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="text-[9px] font-bold text-secondary-text uppercase tracking-widest">Expense Allocation</span>
            <ExpenseByCategoryChart data={summary.expense_by_category} />
          </div>
        )}

        {/* Recent Contributions feed */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-secondary-text uppercase tracking-widest">Recent Activity</span>
            <button 
              onClick={() => navigate('/members')}
              className="text-[10px] font-bold text-primary-maroon flex items-center hover:underline cursor-pointer"
            >
              <span>View Book</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {recentFeed.length === 0 ? (
            <div className="text-center p-6 border border-dashed border-border-custom bg-white rounded-2xl text-xs text-secondary-text">
              No recent payments reported.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentFeed.map(item => (
                <div key={item.id} className="bg-white border border-border-custom p-4 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <h5 className="text-xs font-extrabold text-primary-text truncate">
                      {item.member?.name || item.contributor?.name || 'Unknown'}
                    </h5>
                    <div className="flex items-center gap-2 text-[10px] text-secondary-text font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-antique-gold" />
                        <span>{item.date}</span>
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[9px] uppercase bg-secondary-bg px-1.5 py-0.5 rounded-md text-primary-text">{item.payment_method}</span>
                    </div>
                    {item.collected_by && (
                      <span className="text-[8px] text-secondary-text font-bold bg-secondary-bg px-1.5 py-0.5 rounded w-fit block mt-1">
                        Rec By: {item.collected_by}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-black text-primary-maroon">₹{Number(item.amount).toLocaleString()}</span>
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${
                      item.status === 'PAID' ? 'bg-success/10 text-success' : 'bg-antique-gold/10 text-antique-gold'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

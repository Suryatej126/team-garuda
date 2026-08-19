import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, ShieldCheck, KeyRound, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface Contribution {
  id: number;
  amount: number;
  date: string;
  payment_method: string;
  transaction_id: string;
  status: string;
  notes: string;
  event?: {
    name: string;
  };
}

export const MemberLookup: React.FC = () => {
  const { verifiedMember, verifyMember, logout } = useAuth();
  
  // Login Form states
  const [memberIdInput, setMemberIdInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Ledger states
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  useEffect(() => {
    if (verifiedMember) {
      const fetchLedger = async () => {
        setLoadingLedger(true);
        try {
          const res = await fetch(`${API_BASE_URL}/api/member/contributions?member_id=${verifiedMember.member_id}`);
          if (res.ok) {
            const data = await res.json();
            setContributions(data);
          }
        } catch (err) {
          console.error('Error fetching member ledger:', err);
        } finally {
          setLoadingLedger(false);
        }
      };
      fetchLedger();
    }
  }, [verifiedMember]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberIdInput.trim() || !pinInput.trim()) {
      setErrorMsg('Please enter both Member ID and PIN.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberIdInput.toUpperCase(), pin: pinInput }),
      });
      if (res.ok) {
        const memberData = await res.json();
        verifyMember(memberData);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.detail || 'Verification failed.');
      }
    } catch (err) {
      setErrorMsg('Network error. Check backend connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPaid = contributions
    .filter(c => c.status === 'PAID')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const totalPending = contributions
    .filter(c => c.status === 'PENDING')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 text-neutral-100 overflow-y-auto no-scrollbar pb-6">
      {/* Header Bar */}
      <div className="h-16 px-5 shrink-0 flex items-center justify-between border-b border-neutral-900 bg-neutral-950/80 backdrop-blur sticky top-0 z-30">
        <h2 className="text-base font-extrabold tracking-tight">Member Portal</h2>
        {verifiedMember && (
          <button 
            onClick={logout}
            className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20 active:scale-95 transition-all"
          >
            Sign Out
          </button>
        )}
      </div>

      {/* Screen body */}
      <div className="flex-1 px-5 pt-5 flex flex-col gap-6">
        {!verifiedMember ? (
          /* VERIFICATION FORM */
          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-8">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-4">
                <KeyRound className="w-7 h-7 stroke-[2]" />
              </div>
              <h3 className="text-lg font-black tracking-tight text-neutral-100">Verify Identity</h3>
              <p className="text-xs text-neutral-500 mt-2 max-w-[260px] leading-relaxed">
                Enter your Team Garuda Member ID and 6-digit PIN to check your contribution ledger.
              </p>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Member ID</label>
                <input 
                  type="text" 
                  placeholder="e.g. TG001" 
                  value={memberIdInput}
                  onChange={e => setMemberIdInput(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/80 uppercase font-semibold text-neutral-100 placeholder:text-neutral-600"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">6-Digit Secure PIN</label>
                <input 
                  type="password" 
                  placeholder="••••••" 
                  maxLength={6}
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/80 tracking-widest font-mono text-neutral-100 placeholder:text-neutral-600"
                />
              </div>

              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3.5 py-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 font-extrabold text-xs py-3.5 rounded-xl mt-2 active:scale-95 transition-all shadow-[0_4px_20px_rgba(249,115,22,0.15)] flex justify-center items-center"
              >
                {submitting ? (
                  <div className="w-4.5 h-4.5 rounded-full border-2 border-neutral-950 border-t-transparent animate-spin" />
                ) : (
                  <span>Verify Account</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* MEMBER DASHBOARD */
          <div className="flex flex-col gap-6">
            {/* Member Card banner */}
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/60 border border-neutral-800 p-5 rounded-3xl relative overflow-hidden">
              <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none">
                <ShieldCheck className="w-32 h-32 text-orange-500" />
              </div>
              <span className="text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Verified Member
              </span>
              <h2 className="text-xl font-black text-neutral-100 mt-2">{verifiedMember.name}</h2>
              <p className="text-xs font-semibold text-neutral-400 font-mono mt-1">{verifiedMember.member_id}</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-900/60 border border-neutral-800/80 p-4 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Paid Ledger</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-lg font-black text-emerald-400">₹{totalPaid.toLocaleString()}</span>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-800/80 p-4 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Pending Pledges</span>
                  <Wallet className="w-4 h-4 text-orange-400" />
                </div>
                <span className="text-lg font-black text-orange-400">₹{totalPending.toLocaleString()}</span>
              </div>
            </div>

            {/* Ledger List */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-400">Ledger Statement</h3>
              {loadingLedger ? (
                <div className="py-12 flex justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-t-orange-500 border-neutral-800 animate-spin" />
                </div>
              ) : contributions.length === 0 ? (
                <div className="text-center p-6 border border-dashed border-neutral-800 rounded-2xl text-xs text-neutral-600">
                  No contributions found on this account ledger.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {contributions.map(item => (
                    <div 
                      key={item.id} 
                      className="bg-neutral-900/40 border border-neutral-850 p-4 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <h4 className="text-xs font-extrabold text-neutral-200 truncate">
                          {item.event?.name || "Garuda Community Fund"}
                        </h4>
                        
                        <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-neutral-650" />
                            <span>{item.date}</span>
                          </span>
                          <span>•</span>
                          <span className="font-mono">{item.payment_method}</span>
                          {item.transaction_id && (
                            <>
                              <span>•</span>
                              <span className="font-mono truncate max-w-[80px]">{item.transaction_id}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs font-black text-neutral-200">₹{Number(item.amount).toLocaleString()}</span>
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${
                          item.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
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
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { KeyRound, ShieldCheck, CheckCircle2, Wallet, Calendar, AlertCircle } from 'lucide-react';

interface VerifiedMember {
  member_id: string;
  name: string;
  phone: string;
}

interface MemberContribution {
  id: number;
  amount: number;
  date: string;
  payment_method: string;
  status: string;
  transaction_id: string | null;
  event?: {
    name: string;
  };
}

export const MemberLookup: React.FC = () => {
  const [memberIdInput, setMemberIdInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [verifiedMember, setVerifiedMember] = useState<VerifiedMember | null>(() => {
    const saved = localStorage.getItem('tg_verified_member');
    return saved ? JSON.parse(saved) : null;
  });

  const [contributions, setContributions] = useState<MemberContribution[]>([]);
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
        body: JSON.stringify({
          member_id: memberIdInput.trim().toUpperCase(),
          pin: pinInput.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setVerifiedMember(data);
        localStorage.setItem('tg_verified_member', JSON.stringify(data));
      } else {
        const errData = await res.json();
        setErrorMsg(errData.detail || 'Invalid Member ID or PIN.');
      }
    } catch (err) {
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('tg_verified_member');
    setVerifiedMember(null);
    setMemberIdInput('');
    setPinInput('');
  };

  const totalPaid = contributions
    .filter(c => c.status === 'PAID')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const totalPending = contributions
    .filter(c => c.status === 'PENDING')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-primary-bg text-primary-text overflow-y-auto no-scrollbar pb-10">
      {/* Header Bar */}
      <div className="h-16 px-5 shrink-0 flex items-center justify-between border-b border-border-custom bg-white/95 backdrop-blur sticky top-0 z-30">
        <div>
          <h2 className="text-base font-bold tracking-tight text-primary-maroon font-serif">Member Portal</h2>
          <span className="text-[10px] text-secondary-text font-bold uppercase tracking-wider">Contribution Ledger</span>
        </div>
        {verifiedMember && (
          <button 
            onClick={handleSignOut}
            className="text-[10px] font-bold text-error bg-error/10 px-3 py-1.5 rounded-full border border-error/20 active:scale-95 transition-all cursor-pointer"
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
              <div className="w-14 h-14 rounded-2xl bg-antique-gold/15 border border-antique-gold/30 flex items-center justify-center text-antique-gold mb-4 shadow-sm">
                <KeyRound className="w-7 h-7 stroke-[2]" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-primary-maroon font-serif">Verify Identity</h3>
              <p className="text-xs text-secondary-text mt-2 max-w-[260px] leading-relaxed">
                Enter your Team Garuda Member ID and 6-digit PIN to check your personal contribution ledger.
              </p>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Member ID</label>
                <input 
                  type="text" 
                  placeholder="e.g. TG001" 
                  value={memberIdInput}
                  onChange={e => setMemberIdInput(e.target.value)}
                  className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-maroon/80 uppercase font-semibold text-primary-text placeholder:text-secondary-text/50 shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">6-Digit Secure PIN</label>
                <input 
                  type="password" 
                  placeholder="••••••" 
                  maxLength={6}
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-maroon/80 tracking-widest font-mono text-primary-text placeholder:text-secondary-text/50 shadow-sm"
                />
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
                className="w-full bg-primary-maroon hover:bg-dark-maroon text-white font-extrabold text-xs py-3.5 rounded-xl mt-2 active:scale-95 transition-all shadow-md flex justify-center items-center cursor-pointer"
              >
                {submitting ? (
                  <div className="w-4.5 h-4.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
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
            <div className="bg-white border border-border-custom p-5 rounded-3xl relative overflow-hidden shadow-sm">
              <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none text-antique-gold">
                <ShieldCheck className="w-32 h-32" />
              </div>
              <span className="text-[9px] font-extrabold bg-success/10 text-success border border-success/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Verified Member
              </span>
              <h2 className="text-xl font-bold text-primary-maroon font-serif mt-2">{verifiedMember.name}</h2>
              <p className="text-xs font-semibold text-secondary-text font-mono mt-1">{verifiedMember.member_id}</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-border-custom p-4 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-1 text-success">
                  <span className="text-[10px] text-secondary-text font-bold uppercase tracking-wider">Paid Ledger</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-lg font-black text-success">₹{totalPaid.toLocaleString()}</span>
              </div>

              <div className="bg-white border border-border-custom p-4 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-1 text-antique-gold">
                  <span className="text-[10px] text-secondary-text font-bold uppercase tracking-wider">Pending Pledges</span>
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-lg font-black text-antique-gold">₹{totalPending.toLocaleString()}</span>
              </div>
            </div>

            {/* Ledger List */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-secondary-text">Ledger Statement</h3>
              {loadingLedger ? (
                <div className="py-12 flex justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-t-primary-maroon border-border-custom animate-spin" />
                </div>
              ) : contributions.length === 0 ? (
                <div className="text-center p-6 border border-dashed border-border-custom rounded-2xl text-xs text-secondary-text bg-white">
                  No contributions found on this account ledger.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {contributions.map(item => (
                    <div 
                      key={item.id} 
                      className="bg-white border border-border-custom p-4 rounded-2xl flex items-center justify-between shadow-sm"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <h4 className="text-xs font-extrabold text-primary-text truncate">
                          {item.event?.name || "Garuda Community Fund"}
                        </h4>
                        
                        <div className="flex items-center gap-3 text-[10px] text-secondary-text font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-antique-gold" />
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
                        <span className="text-xs font-black text-primary-text">₹{Number(item.amount).toLocaleString()}</span>
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
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BottomSheet } from '../components/BottomSheet';
import { Trash2, Plus } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface Member {
  id: number;
  member_id: string;
  name: string;
}

interface Contribution {
  id: number;
  amount: number;
  date: string;
  payment_method: string;
  transaction_id: string;
  status: string;
  notes: string;
  member_id?: number | null;
  member?: { id: number; name: string; member_id: string } | null;
  event?: { name: string };
}

interface Sponsorship {
  id: number;
  amount: number;
  date: string;
  payment_method: string;
  transaction_id: string;
  status: string;
  notes: string;
  sponsor: { id: number; username: string };
  event?: { name: string };
}

interface Chandha {
  id: number;
  donor_name: string;
  donor_phone?: string;
  amount: number;
  date: string;
  payment_method: string;
  notes: string;
}

export const Finance: React.FC = () => {
  const { token, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'CONTRIBUTIONS' | 'SPONSORSHIPS' | 'CHANDHALU'>('CONTRIBUTIONS');
  const [loading, setLoading] = useState(true);

  // Data lists
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [chandhalu, setChandhalu] = useState<Chandha[]>([]);

  // Metadata for forms
  const [members, setMembers] = useState<Member[]>([]);

  // Year Filter
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Form Bottom Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // --- Contribution Form states ---
  const [cMemberId, setCMemberId] = useState('');
  const [cAmount, setCAmount] = useState('');
  const [cDate, setCDate] = useState(new Date().toISOString().split('T')[0]);
  const [cMethod, setCMethod] = useState('UPI');
  const [cTxnId, setCTxnId] = useState('');
  const [cNotes, setCNotes] = useState('');

  // --- Sponsorship Form states ---
  const [sAmount, setSAmount] = useState('');
  const [sDate, setSDate] = useState(new Date().toISOString().split('T')[0]);
  const [sMethod, setSMethod] = useState('UPI');
  const [sTxnId, setSTxnId] = useState('');
  const [sNotes, setSNotes] = useState('');

  // --- Public Donation (Chandhalu) Form states ---
  const [chName, setChName] = useState('');
  const [chPhone, setChPhone] = useState('');
  const [chAmount, setChAmount] = useState('');
  const [chDate, setChDate] = useState(new Date().toISOString().split('T')[0]);
  const [chMethod, setChMethod] = useState('UPI');
  const [chNotes, setChNotes] = useState('');

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const contribsRes = await fetch(`${API_BASE_URL}/api/committee/contributions`, { headers });
      const sponsRes = await fetch(`${API_BASE_URL}/api/committee/sponsorships`, { headers });
      const chandhaRes = await fetch(`${API_BASE_URL}/api/committee/chandhalu`, { headers });

      if (contribsRes.status === 401 || sponsRes.status === 401 || chandhaRes.status === 401) {
        logout();
        return;
      }

      if (contribsRes.ok) setContributions(await contribsRes.json());
      if (sponsRes.ok) setSponsorships(await sponsRes.json());
      if (chandhaRes.ok) setChandhalu(await chandhaRes.json());
    } catch (err) {
      console.error('Error fetching financial records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const mRes = await fetch(`${API_BASE_URL}/api/committee/members`, { headers });
      
      if (mRes.status === 401) {
        logout();
        return;
      }

      if (mRes.ok) setMembers(await mRes.json());
    } catch (err) {
      console.error('Error fetching forms metadata:', err);
    }
  };

  useEffect(() => {
    fetchFinanceData();
    fetchMeta();
  }, [token, activeTab]);

  const openAddSheet = () => {
    setFormError('');
    setCMemberId('');
    setCAmount('');
    setCTxnId('');
    setCNotes('');
    setSAmount('');
    setSTxnId('');
    setSNotes('');
    setChName('');
    setChPhone('');
    setChAmount('');
    setChNotes('');
    setIsSheetOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      if (activeTab === 'CONTRIBUTIONS') {
        if (!cMemberId) {
          setFormError('Please select a valid committee member.');
          setSaving(false);
          return;
        }
        if (!cAmount || isNaN(Number(cAmount)) || Number(cAmount) <= 0) {
          setFormError('Please enter a valid amount.');
          setSaving(false);
          return;
        }

        const payload = {
          member_id: Number(cMemberId),
          amount: Number(cAmount),
          date: cDate,
          payment_method: cMethod,
          transaction_id: cTxnId.trim() || null,
          status: 'PAID',
          notes: cNotes.trim() || null
        };

        const res = await fetch(`${API_BASE_URL}/api/committee/contributions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          setIsSheetOpen(false);
          fetchFinanceData();
        } else {
          const errData = await res.json();
          setFormError(errData.detail || 'Failed to save contribution.');
        }
      } else if (activeTab === 'SPONSORSHIPS') {
        if (!sAmount || isNaN(Number(sAmount)) || Number(sAmount) <= 0) {
          setFormError('Please enter a valid sponsorship amount.');
          setSaving(false);
          return;
        }

        const payload = {
          user_id: user?.id,
          amount: Number(sAmount),
          date: sDate,
          payment_method: sMethod,
          transaction_id: sTxnId.trim() || null,
          status: 'PAID',
          notes: sNotes.trim() || null
        };

        const res = await fetch(`${API_BASE_URL}/api/committee/sponsorships`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          setIsSheetOpen(false);
          fetchFinanceData();
        } else {
          const errData = await res.json();
          setFormError(errData.detail || 'Failed to save sponsorship.');
        }
      } else if (activeTab === 'CHANDHALU') {
        if (!chName.trim()) {
          setFormError('Please enter donor name.');
          setSaving(false);
          return;
        }
        if (!chAmount || isNaN(Number(chAmount)) || Number(chAmount) <= 0) {
          setFormError('Please enter a valid donation amount.');
          setSaving(false);
          return;
        }

        const payload = {
          donor_name: chName.trim(),
          donor_phone: chPhone.trim() || null,
          amount: Number(chAmount),
          date: chDate,
          payment_method: chMethod,
          notes: chNotes.trim() || null
        };

        const res = await fetch(`${API_BASE_URL}/api/committee/chandhalu`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          setIsSheetOpen(false);
          fetchFinanceData();
        } else {
          const errData = await res.json();
          setFormError(errData.detail || 'Failed to save public donation.');
        }
      }
    } catch (err) {
      setFormError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type: 'CONTRIBUTION' | 'SPONSORSHIP' | 'CHANDHA', id: number) => {
    if (!window.confirm('Are you sure you want to delete this financial record?')) return;

    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      let endpoint = '';
      if (type === 'CONTRIBUTION') endpoint = `${API_BASE_URL}/api/committee/contributions/${id}`;
      else if (type === 'SPONSORSHIP') endpoint = `${API_BASE_URL}/api/committee/sponsorships/${id}`;
      else if (type === 'CHANDHA') endpoint = `${API_BASE_URL}/api/committee/chandhalu/${id}`;

      const res = await fetch(endpoint, { method: 'DELETE', headers });
      if (res.ok) {
        fetchFinanceData();
      }
    } catch (err) {
      console.error('Error deleting record:', err);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-primary-bg text-primary-text overflow-y-auto no-scrollbar pb-24 relative">
      {/* Header Bar */}
      <div className="h-16 px-5 shrink-0 flex items-center justify-between border-b border-border-custom bg-white/95 backdrop-blur sticky top-0 z-30">
        <div>
          <h2 className="text-base font-bold tracking-tight text-primary-maroon font-serif">Ledger Statement</h2>
          <span className="text-[10px] text-secondary-text font-bold uppercase tracking-wider">Community Account Registers</span>
        </div>
        
        <button 
          onClick={openAddSheet}
          className="w-9 h-9 rounded-full bg-primary-maroon text-white border border-light-gold flex items-center justify-center hover:bg-dark-maroon active:scale-95 transition-all cursor-pointer shadow-md"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Segmented Tab Controls */}
      <div className="p-4 shrink-0 bg-white/90 border-b border-border-custom flex flex-col gap-3">
        {/* Year Selector */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-secondary-text uppercase tracking-widest">Statement Year</span>
          <div className="flex items-center gap-1 bg-secondary-bg p-0.5 rounded-lg border border-border-custom">
            {[2026, 2025, 0].map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${
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

        {/* 3 Main Tabs: Committee | Item Sponsors | Public Donations */}
        <div className="flex bg-secondary-bg border border-border-custom p-0.5 rounded-xl">
          {(['CONTRIBUTIONS', 'SPONSORSHIPS', 'CHANDHALU'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-[10px] font-extrabold py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-primary-maroon shadow-sm font-extrabold'
                  : 'text-secondary-text hover:text-primary-text'
              }`}
            >
              {tab === 'CONTRIBUTIONS' ? 'Committee' : tab === 'SPONSORSHIPS' ? 'Item Sponsors' : 'Public Donations'}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger lists */}
      {loading ? (
        <div className="flex-grow flex flex-col justify-center items-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-t-primary-maroon border-border-custom animate-spin" />
        </div>
      ) : (
        <div className="px-5 pt-4 flex flex-col gap-3">
          {/* 1. COMMITTEE CONTRIBUTIONS LIST */}
          {activeTab === 'CONTRIBUTIONS' && (
            <>
              {contributions
                .filter(item => item.member_id !== null && (selectedYear > 0 ? new Date(item.date).getFullYear() === selectedYear : true)).length === 0 ? (
                  <div className="text-center p-8 bg-white border border-border-custom rounded-2xl text-xs text-secondary-text">
                    No committee contributions recorded for {selectedYear === 0 ? 'All Time' : selectedYear}.
                  </div>
                ) : (
                  contributions
                    .filter(item => item.member_id !== null && (selectedYear > 0 ? new Date(item.date).getFullYear() === selectedYear : true))
                    .map(item => (
                      <div key={item.id} className="bg-white border border-border-custom p-4 rounded-2xl flex items-center justify-between shadow-sm">
                        <div className="flex flex-col gap-1 min-w-0">
                          <h4 className="text-xs font-extrabold text-primary-text truncate">{item.member?.name || 'Unknown'}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-secondary-text font-medium">
                            {item.member?.member_id && (
                              <>
                                <span className="font-mono text-antique-gold">{item.member.member_id}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>{item.date}</span>
                            <span>•</span>
                            <span className="font-mono text-[9px] uppercase bg-secondary-bg px-1.5 py-0.5 rounded text-primary-text">{item.payment_method}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-xs font-black text-primary-text">₹{Number(item.amount).toLocaleString()}</span>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${
                              item.status === 'PAID' ? 'bg-success/10 text-success' : 'bg-antique-gold/10 text-antique-gold'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDelete('CONTRIBUTION', item.id)}
                            className="p-1 rounded-full text-secondary-text hover:text-error active:scale-90 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
            </>
          )}

          {/* 2. ITEM SPONSORSHIPS LIST */}
          {activeTab === 'SPONSORSHIPS' && (
            <>
              {sponsorships
                .filter(item => (selectedYear > 0 ? new Date(item.date).getFullYear() === selectedYear : true)).length === 0 ? (
                  <div className="text-center p-8 bg-white border border-border-custom rounded-2xl text-xs text-secondary-text">
                    No item sponsorships recorded for {selectedYear === 0 ? 'All Time' : selectedYear}.
                  </div>
                ) : (
                  sponsorships
                    .filter(item => (selectedYear > 0 ? new Date(item.date).getFullYear() === selectedYear : true))
                    .map(item => (
                      <div key={item.id} className="bg-white border border-border-custom p-4 rounded-2xl flex items-center justify-between shadow-sm">
                        <div className="flex flex-col gap-1 min-w-0">
                          <h4 className="text-xs font-extrabold text-primary-text truncate">Item Sponsor: {item.sponsor?.username || 'Sponsor'}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-secondary-text font-medium">
                            <span>{item.date}</span>
                            <span>•</span>
                            <span className="font-mono text-[9px] uppercase bg-secondary-bg px-1.5 py-0.5 rounded text-primary-text">{item.payment_method}</span>
                          </div>
                          {item.notes && (
                            <p className="text-[10px] text-secondary-text italic line-clamp-1 mt-0.5">{item.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-xs font-black text-primary-text">₹{Number(item.amount).toLocaleString()}</span>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${
                              item.status === 'PAID' ? 'bg-success/10 text-success' : 'bg-antique-gold/10 text-antique-gold'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDelete('SPONSORSHIP', item.id)}
                            className="p-1 rounded-full text-secondary-text hover:text-error active:scale-90 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
            </>
          )}

          {/* 3. PUBLIC DONATIONS (CHANDHALU) LIST */}
          {activeTab === 'CHANDHALU' && (
            <>
              {chandhalu
                .filter(item => (selectedYear > 0 ? new Date(item.date).getFullYear() === selectedYear : true)).length === 0 ? (
                  <div className="text-center p-8 bg-white border border-border-custom rounded-2xl text-xs text-secondary-text">
                    No public donations recorded for {selectedYear === 0 ? 'All Time' : selectedYear}.
                  </div>
                ) : (
                  chandhalu
                    .filter(item => (selectedYear > 0 ? new Date(item.date).getFullYear() === selectedYear : true))
                    .map(item => (
                      <div key={item.id} className="bg-white border border-border-custom p-4 rounded-2xl flex items-center justify-between shadow-sm">
                        <div className="flex flex-col gap-1 min-w-0">
                          <h4 className="text-xs font-extrabold text-primary-text truncate">{item.donor_name}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-secondary-text font-medium">
                            {item.donor_phone && <span className="font-mono text-success/80">{item.donor_phone}</span>}
                            {item.donor_phone && <span>•</span>}
                            <span>{item.date}</span>
                            <span>•</span>
                            <span className="font-mono text-[9px] uppercase bg-secondary-bg px-1.5 py-0.5 rounded text-primary-text">{item.payment_method}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-xs font-black text-primary-text">₹{Number(item.amount).toLocaleString()}</span>
                            <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase bg-success/10 text-success">
                              PAID
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDelete('CHANDHA', item.id)}
                            className="p-1 rounded-full text-secondary-text hover:text-error active:scale-90 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
            </>
          )}
        </div>
      )}

      {/* Unified Add Transaction Sheet */}
      <BottomSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={
          activeTab === 'CONTRIBUTIONS' 
            ? "Report Committee Contribution" 
            : activeTab === 'SPONSORSHIPS' 
            ? "Report Item Sponsorship" 
            : "Report Public Donation (Chandha)"
        }
      >
        <form onSubmit={handleSaveTransaction} className="flex flex-col gap-4">
          
          {/* 1. Member selection (Only for Committee Contributions) */}
          {activeTab === 'CONTRIBUTIONS' && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Select Committee Member</label>
              <select
                value={cMemberId}
                onChange={e => setCMemberId(e.target.value)}
                className="w-full bg-white border border-border-custom rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold cursor-pointer"
              >
                <option value="">-- Choose Member --</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.member_id})</option>
                ))}
              </select>
            </div>
          )}

          {/* 2. Donor Name & Phone (Only for Public Donations / Chandhalu) */}
          {activeTab === 'CHANDHALU' && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Donor Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={chName}
                  onChange={e => setChName(e.target.value)}
                  className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold placeholder:text-secondary-text/50"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Donor Phone (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={chPhone}
                  onChange={e => setChPhone(e.target.value)}
                  className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold placeholder:text-secondary-text/50"
                />
              </div>
            </>
          )}

          {/* 3. Amount */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">
              {activeTab === 'SPONSORSHIPS' ? 'Item / Sponsorship Value (₹)' : 'Amount (₹)'}
            </label>
            <input 
              type="number"
              placeholder="e.g. 5000"
              value={activeTab === 'CONTRIBUTIONS' ? cAmount : activeTab === 'SPONSORSHIPS' ? sAmount : chAmount}
              onChange={e => {
                const val = e.target.value;
                if (activeTab === 'CONTRIBUTIONS') setCAmount(val);
                else if (activeTab === 'SPONSORSHIPS') setSAmount(val);
                else setChAmount(val);
              }}
              className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-bold placeholder:text-secondary-text/50 font-mono"
            />
          </div>

          {/* 4. Date */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Date</label>
            <input 
              type="date"
              value={activeTab === 'CONTRIBUTIONS' ? cDate : activeTab === 'SPONSORSHIPS' ? sDate : chDate}
              onChange={e => {
                const val = e.target.value;
                if (activeTab === 'CONTRIBUTIONS') setCDate(val);
                else if (activeTab === 'SPONSORSHIPS') setSDate(val);
                else setChDate(val);
              }}
              className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold"
            />
          </div>

          {/* 5. Method */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Payment Method</label>
            <select
              value={activeTab === 'CONTRIBUTIONS' ? cMethod : activeTab === 'SPONSORSHIPS' ? sMethod : chMethod}
              onChange={e => {
                const val = e.target.value;
                if (activeTab === 'CONTRIBUTIONS') setCMethod(val);
                else if (activeTab === 'SPONSORSHIPS') setSMethod(val);
                else setChMethod(val);
              }}
              className="w-full bg-white border border-border-custom rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold cursor-pointer"
            >
              <option value="UPI">UPI / QR Code</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              {activeTab === 'SPONSORSHIPS' && <option value="IN_KIND">In-Kind / Item Donation</option>}
            </select>
          </div>

          {/* 6. Item / Notes for Sponsorship */}
          {activeTab === 'SPONSORSHIPS' && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Sponsored Item / Details</label>
              <input 
                type="text"
                placeholder="e.g. 25kg Rice, Idol Flowers, Sound Stage, Laddu"
                value={sNotes}
                onChange={e => setSNotes(e.target.value)}
                className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold placeholder:text-secondary-text/50"
              />
            </div>
          )}

          {formError && (
            <div className="text-xs text-error font-bold p-3 bg-error/10 border border-error/20 rounded-xl">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary-maroon hover:bg-dark-maroon text-white font-extrabold text-xs py-3.5 rounded-xl mt-2 active:scale-95 transition-all shadow-md flex justify-center items-center cursor-pointer"
          >
            {saving ? (
              <div className="w-4.5 h-4.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span>Save Record</span>
            )}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
};

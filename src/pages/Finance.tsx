import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BottomSheet } from '../components/BottomSheet';
import { Trash2, Plus, Receipt, Paperclip } from 'lucide-react';

interface Member {
  id: number;
  member_id: string;
  name: string;
}

interface Event {
  id: number;
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

interface Expense {
  id: number;
  name: string;
  amount: number;
  date: string;
  category: string;
  payment_method: string;
  receipt_url: string;
  notes: string;
  paid_by_user?: { username: string };
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
  const [activeTab, setActiveTab] = useState<'CONTRIBUTIONS' | 'SPONSORSHIPS' | 'EXPENSES' | 'CHANDHALU'>('CONTRIBUTIONS');
  const [loading, setLoading] = useState(true);

  // Data lists
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [chandhalu, setChandhalu] = useState<Chandha[]>([]);

  // Metadata for forms
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

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
  const [cEventId, setCEventId] = useState('');
  const [cStatus, setCStatus] = useState('PAID');
  const [cNotes, setCNotes] = useState('');

  // --- Sponsorship Form states ---
  const [sAmount, setSAmount] = useState('');
  const [sDate, setSDate] = useState(new Date().toISOString().split('T')[0]);
  const [sMethod, setSMethod] = useState('UPI');
  const [sTxnId, setSTxnId] = useState('');
  const [sEventId, setSEventId] = useState('');
  const [sStatus, setSStatus] = useState('PAID');
  const [sNotes, setSNotes] = useState('');

  // --- Expense Form states ---
  const [eName, setEName] = useState('');
  const [eAmount, setEAmount] = useState('');
  const [eDate, setEDate] = useState(new Date().toISOString().split('T')[0]);
  const [eCategory, setECategory] = useState('FOOD');
  const [eMethod, setEMethod] = useState('UPI');
  const [eEventId, setEEventId] = useState('');
  const [eNotes, setENotes] = useState('');
  const [eReceipt, setEReceipt] = useState<File | null>(null);

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
      
      const contribsRes = await fetch('http://localhost:8000/api/committee/contributions', { headers });
      const sponsRes = await fetch('http://localhost:8000/api/committee/sponsorships', { headers });
      const expRes = await fetch('http://localhost:8000/api/committee/expenses', { headers });
      const chandhaRes = await fetch('http://localhost:8000/api/committee/chandhalu', { headers });

      if (contribsRes.status === 401 || sponsRes.status === 401 || expRes.status === 401 || chandhaRes.status === 401) {
        logout();
        return;
      }

      if (contribsRes.ok) setContributions(await contribsRes.json());
      if (sponsRes.ok) setSponsorships(await sponsRes.json());
      if (expRes.ok) setExpenses(await expRes.json());
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
      const mRes = await fetch('http://localhost:8000/api/committee/members', { headers });
      const eRes = await fetch('http://localhost:8000/api/public/events');
      
      if (mRes.status === 401) {
        logout();
        return;
      }

      if (mRes.ok) setMembers(await mRes.json());
      if (eRes.ok) setEvents(await eRes.json());
      
      // Default forms metadata
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
    // Reset forms
    setCMemberId('');
    setCAmount('');
    setCTxnId('');
    setCEventId(events[0]?.id ? String(events[0].id) : '');
    setCNotes('');
    
    setSAmount('');
    setSTxnId('');
    setSEventId(events[0]?.id ? String(events[0].id) : '');
    setSNotes('');
    
    setEName('');
    setEAmount('');
    setEEventId(events[0]?.id ? String(events[0].id) : '');
    setENotes('');
    setEReceipt(null);

    setChName('');
    setChPhone('');
    setChAmount('');
    setChNotes('');

    setIsSheetOpen(true);
  };

  const handleDelete = async (type: string, id: number) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const endpoint = type === 'CONTRIBUTION' ? 'contributions' : type === 'SPONSORSHIP' ? 'sponsorships' : type === 'EXPENSE' ? 'expenses' : 'chandhalu';
      const res = await fetch(`http://localhost:8000/api/committee/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchFinanceData();
      }
    } catch (err) {
      console.error('Error deleting record:', err);
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };
      let url = '';
      let method = 'POST';
      let body: any = null;

      if (activeTab === 'CONTRIBUTIONS') {
        if (!cMemberId || !cAmount) {
          setFormError('Member and Amount are required.');
          setSaving(false);
          return;
        }
        url = 'http://localhost:8000/api/committee/contributions';
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          member_id: Number(cMemberId),
          amount: parseFloat(cAmount),
          date: cDate,
          payment_method: cMethod,
          transaction_id: cTxnId || null,
          event_id: cEventId ? Number(cEventId) : null,
          status: cStatus,
          notes: cNotes || null
        });
      } 
      else if (activeTab === 'SPONSORSHIPS') {
        if (!sAmount) {
          setFormError('Amount is required.');
          setSaving(false);
          return;
        }
        url = 'http://localhost:8000/api/committee/sponsorships';
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          user_id: user?.id || 1, // current user id
          amount: parseFloat(sAmount),
          date: sDate,
          payment_method: sMethod,
          transaction_id: sTxnId || null,
          event_id: sEventId ? Number(sEventId) : null,
          status: sStatus,
          notes: sNotes || null
        });
      } 
      else if (activeTab === 'EXPENSES') {
        if (!eName || !eAmount) {
          setFormError('Expense Name and Amount are required.');
          setSaving(false);
          return;
        }
        url = 'http://localhost:8000/api/committee/expenses';
        // Multipart Form Data for receipt upload
        const formData = new FormData();
        formData.append('name', eName);
        formData.append('amount', eAmount);
        formData.append('date', eDate);
        formData.append('category', eCategory);
        formData.append('payment_method', eMethod);
        if (eEventId) formData.append('event_id', eEventId);
        if (eNotes) formData.append('notes', eNotes);
        if (eReceipt) formData.append('receipt', eReceipt);
        
        body = formData;
      }
      else if (activeTab === 'CHANDHALU') {
        if (!chName || !chAmount) {
          setFormError('Donor Name and Amount are required.');
          setSaving(false);
          return;
        }
        url = 'http://localhost:8000/api/committee/chandhalu';
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          donor_name: chName,
          donor_phone: chPhone || null,
          amount: parseFloat(chAmount),
          date: chDate,
          payment_method: chMethod,
          notes: chNotes || null
        });
      }

      const res = await fetch(url, {
        method,
        headers: activeTab === 'EXPENSES' ? { 'Authorization': `Bearer ${token}` } : headers,
        body
      });

      if (res.ok) {
        setIsSheetOpen(false);
        fetchFinanceData();
      } else {
        const errData = await res.json();
        setFormError(errData.detail || 'Failed to report transaction.');
      }
    } catch (err) {
      setFormError('Network error. Check backend connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-primary-bg text-primary-text overflow-y-auto no-scrollbar pb-6 relative">
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
      <div className="p-4 shrink-0 bg-white/90 border-b border-border-custom">
        <div className="flex bg-secondary-bg border border-border-custom p-0.5 rounded-xl">
          {(['CONTRIBUTIONS', 'SPONSORSHIPS', 'CHANDHALU', 'EXPENSES'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-[9px] font-extrabold py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-primary-maroon shadow-sm font-extrabold'
                  : 'text-secondary-text hover:text-primary-text'
              }`}
            >
              {tab === 'CONTRIBUTIONS' ? 'Member Income' : tab === 'SPONSORSHIPS' ? 'Sponsors' : tab === 'CHANDHALU' ? 'Public Donations' : 'Expenses'}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger lists */}
      {loading ? (
        <div className="flex-grow flex flex-col justify-center items-center">
          <div className="w-8 h-8 rounded-full border-2 border-t-primary-maroon border-border-custom animate-spin" />
        </div>
      ) : (
        <div className="px-5 pt-4 flex flex-col gap-3">
          {/* 1. CONTRIBUTIONS LIST */}
          {activeTab === 'CONTRIBUTIONS' && contributions.filter(item => item.member_id !== null).map(item => (
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
          ))}

          {/* 2. SPONSORSHIPS LIST */}
          {activeTab === 'SPONSORSHIPS' && sponsorships.map(item => (
            <div key={item.id} className="bg-white border border-border-custom p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex flex-col gap-1 min-w-0">
                <h4 className="text-xs font-extrabold text-primary-text truncate">Committee: {item.sponsor.username}</h4>
                <div className="flex items-center gap-2 text-[10px] text-secondary-text font-medium">
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
                  onClick={() => handleDelete('SPONSORSHIP', item.id)}
                  className="p-1 rounded-full text-secondary-text hover:text-error active:scale-90 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* 3. EXPENSES LIST */}
          {activeTab === 'EXPENSES' && expenses.map(item => (
            <div key={item.id} className="bg-white border border-border-custom p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex flex-col gap-1 min-w-0">
                <h4 className="text-xs font-extrabold text-primary-text truncate">{item.name}</h4>
                <div className="flex items-center gap-2.5 text-[10px] text-secondary-text font-medium">
                  <span className="text-[8px] font-extrabold bg-secondary-bg text-secondary-text border border-border-custom px-1.5 py-0.5 rounded-full uppercase">
                    {item.category}
                  </span>
                  <span>{item.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs font-black text-error">₹{Number(item.amount).toLocaleString()}</span>
                  {item.receipt_url && (
                    <a 
                      href={`http://localhost:8000${item.receipt_url}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[9px] font-bold text-primary-maroon flex items-center gap-0.5 hover:underline"
                    >
                      <Receipt className="w-3 h-3 text-antique-gold" />
                      <span>Receipt</span>
                    </a>
                  )}
                </div>
                <button 
                  onClick={() => handleDelete('EXPENSE', item.id)}
                  className="p-1 rounded-full text-secondary-text hover:text-error active:scale-90 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* 4. CHANDHALU LIST */}
          {activeTab === 'CHANDHALU' && chandhalu.map(item => (
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
          ))}
        </div>
      )}

      {/* Unified Add Transaction Sheet */}
      <BottomSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={
          activeTab === 'CONTRIBUTIONS' 
            ? "Report Member Income" 
            : activeTab === 'SPONSORSHIPS' 
            ? "Report Committee Sponsorship" 
            : activeTab === 'CHANDHALU'
            ? "Report Public Donation"
            : "Record Event Expense"
        }
      >
        <form onSubmit={handleSaveTransaction} className="flex flex-col gap-4">
          
          {/* 1. Member selection (Only for Contributions) */}
          {activeTab === 'CONTRIBUTIONS' && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Select Member</label>
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

          {/* 2. Expense name (Only for Expenses) */}
          {activeTab === 'EXPENSES' && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Expense Title</label>
              <input 
                type="text"
                placeholder="e.g. Stage lighting & sound system"
                value={eName}
                onChange={e => setEName(e.target.value)}
                className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold placeholder:text-secondary-text/50"
              />
            </div>
          )}
          {/* 2.5 Donor Name & Phone (Only for Chandhalu) */}
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
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Amount (₹)</label>
            <input 
              type="number"
              placeholder="e.g. 5000"
              value={activeTab === 'CONTRIBUTIONS' ? cAmount : activeTab === 'SPONSORSHIPS' ? sAmount : activeTab === 'CHANDHALU' ? chAmount : eAmount}
              onChange={e => {
                const val = e.target.value;
                if (activeTab === 'CONTRIBUTIONS') setCAmount(val);
                else if (activeTab === 'SPONSORSHIPS') setSAmount(val);
                else if (activeTab === 'CHANDHALU') setChAmount(val);
                else setEAmount(val);
              }}
              className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-bold placeholder:text-secondary-text/50 font-mono"
            />
          </div>

          {/* 4. Date */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Date</label>
            <input 
              type="date"
              value={activeTab === 'CONTRIBUTIONS' ? cDate : activeTab === 'SPONSORSHIPS' ? sDate : activeTab === 'CHANDHALU' ? chDate : eDate}
              onChange={e => {
                const val = e.target.value;
                if (activeTab === 'CONTRIBUTIONS') setCDate(val);
                else if (activeTab === 'SPONSORSHIPS') setSDate(val);
                else if (activeTab === 'CHANDHALU') setChDate(val);
                else setEDate(val);
              }}
              className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold"
            />
          </div>

          {/* 5. Method */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Payment Method</label>
            <select
              value={activeTab === 'CONTRIBUTIONS' ? cMethod : activeTab === 'SPONSORSHIPS' ? sMethod : activeTab === 'CHANDHALU' ? chMethod : eMethod}
              onChange={e => {
                const val = e.target.value;
                if (activeTab === 'CONTRIBUTIONS') setCMethod(val);
                else if (activeTab === 'SPONSORSHIPS') setSMethod(val);
                else if (activeTab === 'CHANDHALU') setChMethod(val);
                else setEMethod(val);
              }}
              className="w-full bg-white border border-border-custom rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold cursor-pointer"
            >
              <option value="UPI">UPI</option>
              <option value="CASH">CASH</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* 6. Txn ID (For Income / Sponsors only) */}
          {(activeTab === 'CONTRIBUTIONS' || activeTab === 'SPONSORSHIPS') && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Transaction Ref ID (Optional)</label>
              <input 
                type="text"
                placeholder="e.g. UPI Ref / IMPS number"
                value={activeTab === 'CONTRIBUTIONS' ? cTxnId : sTxnId}
                onChange={e => {
                  const val = e.target.value;
                  if (activeTab === 'CONTRIBUTIONS') setCTxnId(val);
                  else setSTxnId(val);
                }}
                className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold placeholder:text-secondary-text/50"
              />
            </div>
          )}

          {/* 7. Category (For Expenses only) */}
          {activeTab === 'EXPENSES' && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Category</label>
              <select
                value={eCategory}
                onChange={e => setECategory(e.target.value)}
                className="w-full bg-white border border-border-custom rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold cursor-pointer"
              >
                <option value="DECORATION">Decoration & Lighting</option>
                <option value="FOOD">Food & Prasadam</option>
                <option value="TRANSPORT">Transport</option>
                <option value="PRINTING">Printing & banners</option>
                <option value="EQUIPMENT">Equipment hire</option>
                <option value="VENUE">Venue rent</option>
                <option value="POOJA">Pooja materials</option>
                <option value="MEDIA">Photoshoot / videography</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          )}

          {/* 8. Event reference selector */}
          {activeTab !== 'CHANDHALU' && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Event Reference (Optional)</label>
              <select
                value={activeTab === 'CONTRIBUTIONS' ? cEventId : activeTab === 'SPONSORSHIPS' ? sEventId : eEventId}
                onChange={e => {
                  const val = e.target.value;
                  if (activeTab === 'CONTRIBUTIONS') setCEventId(val);
                  else if (activeTab === 'SPONSORSHIPS') setSEventId(val);
                  else setEEventId(val);
                }}
                className="w-full bg-white border border-border-custom rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold cursor-pointer"
              >
                <option value="">-- Choose Event --</option>
                {events.map(evt => (
                  <option key={evt.id} value={evt.id}>{evt.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* 9. Status (Paid/Pending - Income / Sponsors only) */}
          {(activeTab === 'CONTRIBUTIONS' || activeTab === 'SPONSORSHIPS') && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Receipt Status</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => activeTab === 'CONTRIBUTIONS' ? setCStatus('PAID') : setSStatus('PAID')}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    (activeTab === 'CONTRIBUTIONS' ? cStatus : sStatus) === 'PAID'
                      ? 'bg-primary-maroon text-white border-primary-maroon shadow-sm shadow-primary-maroon/10'
                      : 'bg-white border-border-custom text-secondary-text hover:bg-secondary-bg/50'
                  }`}
                >
                  Paid
                </button>
                <button
                  type="button"
                  onClick={() => activeTab === 'CONTRIBUTIONS' ? setCStatus('PENDING') : setSStatus('PENDING')}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    (activeTab === 'CONTRIBUTIONS' ? cStatus : sStatus) === 'PENDING'
                      ? 'bg-antique-gold text-white border-antique-gold shadow-sm shadow-antique-gold/10'
                      : 'bg-white border-border-custom text-secondary-text hover:bg-secondary-bg/50'
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>
          )}

          {/* 10. Receipt upload (For Expenses only) */}
          {activeTab === 'EXPENSES' && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Attach Receipt Image</label>
              <label className="w-full bg-white border border-border-custom border-dashed rounded-xl px-4 py-6 text-center cursor-pointer hover:border-primary-maroon transition-all flex flex-col items-center justify-center gap-2 shadow-sm">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setEReceipt(e.target.files ? e.target.files[0] : null)}
                  className="hidden" 
                />
                <Paperclip className="w-6 h-6 text-antique-gold" />
                <span className="text-xs font-semibold text-primary-text">
                  {eReceipt ? eReceipt.name : "Select or drag files here"}
                </span>
                <span className="text-[9px] text-secondary-text">JPG, PNG up to 5MB</span>
              </label>
            </div>
          )}

          {/* 11. Notes */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Notes / Remarks</label>
            <textarea 
              rows={2}
              placeholder="Provide context or remarks..."
              value={activeTab === 'CONTRIBUTIONS' ? cNotes : activeTab === 'SPONSORSHIPS' ? sNotes : activeTab === 'CHANDHALU' ? chNotes : eNotes}
              onChange={e => {
                const val = e.target.value;
                if (activeTab === 'CONTRIBUTIONS') setCNotes(val);
                else if (activeTab === 'SPONSORSHIPS') setSNotes(val);
                else if (activeTab === 'CHANDHALU') setChNotes(val);
                else setENotes(val);
              }}
              className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text placeholder:text-secondary-text/50 font-medium resize-none"
            />
          </div>

          {formError && (
            <div className="bg-error/10 border border-error/20 text-error text-[10px] px-3.5 py-3 rounded-xl">
              {formError}
            </div>
          )}

          <button 
            type="submit"
            disabled={saving}
            className="w-full bg-primary-maroon text-white font-extrabold text-xs py-3.5 rounded-xl mt-4 active:scale-95 transition-all hover:bg-dark-maroon flex justify-center items-center shadow-lg shadow-primary-maroon/10 cursor-pointer"
          >
            {saving ? (
              <div className="w-4.5 h-4.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span>Report Transaction</span>
            )}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
};

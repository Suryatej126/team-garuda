import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BottomSheet } from '../components/BottomSheet';
import { Trash2, Plus, Gift, Edit2, CheckCircle2, Clock, Search } from 'lucide-react';
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
  collected_by?: string | null;
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
  collected_by?: string | null;
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

  // Stats and Search/Filter States
  const [summary, setSummary] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [amountRange, setAmountRange] = useState<'ALL' | 'UNDER_500' | '500_1000' | '1000_5000' | 'OVER_5000'>('ALL');

  // Form Bottom Sheet state (Add / Edit)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // --- Committee Contribution Form states ---
  const [cMemberId, setCMemberId] = useState('');
  const [cGivenAmount, setCGivenAmount] = useState('');
  const [cPendingAmount, setCPendingAmount] = useState('0');
  const [cDate, setCDate] = useState(new Date().toISOString().split('T')[0]);
  const [cMethod, setCMethod] = useState('UPI');
  const [cTxnId, setCTxnId] = useState('');
  const [cNotes, setCNotes] = useState('');

  // --- Item Sponsorship Form states ---
  const [sSponsorName, setSSponsorName] = useState('');
  const [sSponsorPhone, setSSponsorPhone] = useState('');
  const [sItemName, setSItemName] = useState('');
  const [sAmount, setSAmount] = useState('');
  const [sDate, setSDate] = useState(new Date().toISOString().split('T')[0]);
  const [sMethod, setSMethod] = useState('IN_KIND');
  const [sTxnId, setSTxnId] = useState('');
  const [sNotes, setSNotes] = useState('');

  // --- Public Donation (Chandhalu) Form states ---
  const [chName, setChName] = useState('');
  const [chPhone, setChPhone] = useState('');
  const [chAmount, setChAmount] = useState('');
  const [chDate, setChDate] = useState(new Date().toISOString().split('T')[0]);
  const [chMethod, setChMethod] = useState('UPI');
  const [chNotes, setChNotes] = useState('');
  const [chCollectedBy, setChCollectedBy] = useState('');

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const summaryUrl = selectedYear > 0 
        ? `${API_BASE_URL}/api/finance/summary?year=${selectedYear}`
        : `${API_BASE_URL}/api/finance/summary?year=-1`;

      // Fetch all financial records in parallel using Promise.all for 4x speed improvement
      const [contribsRes, sponsRes, chandhaRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/committee/contributions`, { headers }),
        fetch(`${API_BASE_URL}/api/committee/sponsorships`, { headers }),
        fetch(`${API_BASE_URL}/api/committee/chandhalu`, { headers }),
        fetch(summaryUrl, { headers })
      ]);

      if (contribsRes.status === 401 || sponsRes.status === 401 || chandhaRes.status === 401) {
        logout();
        return;
      }

      if (contribsRes.ok) setContributions(await contribsRes.json());
      if (sponsRes.ok) setSponsorships(await sponsRes.json());
      if (chandhaRes.ok) setChandhalu(await chandhaRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
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
  }, [token, activeTab, selectedYear]);

  // Reset filters on tab switch
  useEffect(() => {
    setSearchQuery('');
    setPaymentMethodFilter('ALL');
    setAmountRange('ALL');
  }, [activeTab]);

  // Open Sheet for CREATE
  const openAddSheet = () => {
    setEditingId(null);
    setFormError('');
    setCMemberId('');
    setCGivenAmount('');
    setCPendingAmount('0');
    setCTxnId('');
    setCNotes('');
    setSSponsorName('');
    setSSponsorPhone('');
    setSItemName('');
    setSAmount('');
    setSTxnId('');
    setSNotes('');
    setChName('');
    setChPhone('');
    setChAmount('');
    setChNotes('');
    setChCollectedBy('');
    setIsSheetOpen(true);
  };

  // Open Sheet for EDIT Committee Contribution
  const openEditCommittee = (item: Contribution) => {
    setEditingId(item.id);
    setFormError('');
    setCMemberId(item.member_id ? String(item.member_id) : '');
    setCGivenAmount(String(item.amount));
    
    // Parse pending amount from notes if present
    let pending = '0';
    let rawNotes = item.notes || '';
    if (rawNotes.includes('[Pending:')) {
      const match = rawNotes.match(/\[Pending:\s*(\d+)\]/i);
      if (match) pending = match[1];
      rawNotes = rawNotes.replace(/\[Pending:\s*\d+\]/gi, '').trim();
    }
    setCPendingAmount(pending);
    setCDate(item.date);
    setCMethod(item.payment_method);
    setCTxnId(item.transaction_id || '');
    setCNotes(rawNotes);
    setIsSheetOpen(true);
  };

  // Open Sheet for EDIT Item Sponsor
  const openEditSponsorship = (item: Sponsorship) => {
    setEditingId(item.id);
    setFormError('');
    const parsed = parseSponsorDetails(item);
    setSSponsorName(parsed.sponsorName);
    setSSponsorPhone(parsed.sponsorPhone);
    setSItemName(parsed.itemName);
    setSAmount(Number(item.amount) > 0 ? String(item.amount) : '');
    setSDate(item.date);
    setSMethod(item.payment_method);
    setSTxnId(item.transaction_id || '');
    setSNotes(parsed.extraNotes);
    setIsSheetOpen(true);
  };

  // Helper to extract parsed details for Committee Contributions
  const parseCommitteeDetails = (item: Contribution) => {
    let pendingAmount = 0;
    let cleanNotes = item.notes || '';

    if (cleanNotes.includes('[Pending:')) {
      const match = cleanNotes.match(/\[Pending:\s*(\d+)\]/i);
      if (match) pendingAmount = Number(match[1]);
      cleanNotes = cleanNotes.replace(/\[Pending:\s*\d+\]/gi, '').trim();
    }

    const givenAmount = Number(item.amount) || 0;
    const totalPledge = givenAmount + pendingAmount;

    return { givenAmount, pendingAmount, totalPledge, cleanNotes };
  };

  // Helper to extract parsed details for Item Sponsors
  const parseSponsorDetails = (item: Sponsorship) => {
    let sponsorName = item.sponsor?.username || 'Item Sponsor';
    let sponsorPhone = '';
    let itemName = 'Item Sponsorship';
    let extraNotes = item.notes || '';

    if (item.notes) {
      try {
        if (item.notes.startsWith('{')) {
          const parsed = JSON.parse(item.notes);
          sponsorName = parsed.sponsor_name || sponsorName;
          sponsorPhone = parsed.sponsor_phone || '';
          itemName = parsed.item_name || itemName;
          extraNotes = parsed.notes || '';
        } else {
          const itemMatch = item.notes.match(/\[Item:\s*([^\]]+)\]/i);
          const nameMatch = item.notes.match(/\[Sponsor:\s*([^\]]+)\]/i);
          const phoneMatch = item.notes.match(/\[Phone:\s*([^\]]+)\]/i);
          
          if (itemMatch) itemName = itemMatch[1].trim();
          if (nameMatch) sponsorName = nameMatch[1].trim();
          if (phoneMatch) sponsorPhone = phoneMatch[1].trim();
          extraNotes = item.notes
            .replace(/\[Item:[^\]]+\]/gi, '')
            .replace(/\[Sponsor:[^\]]+\]/gi, '')
            .replace(/\[Phone:[^\]]+\]/gi, '')
            .trim();
        }
      } catch {
        // fallback
      }
    }

    return { sponsorName, sponsorPhone, itemName, extraNotes };
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
          setFormError('Please select a committee member.');
          setSaving(false);
          return;
        }
        if (!cGivenAmount || isNaN(Number(cGivenAmount)) || Number(cGivenAmount) < 0) {
          setFormError('Please enter a valid given amount.');
          setSaving(false);
          return;
        }

        const pendingNum = Number(cPendingAmount) || 0;
        const statusVal = pendingNum > 0 ? (Number(cGivenAmount) > 0 ? 'PARTIAL' : 'PENDING') : 'PAID';
        const formattedNotes = pendingNum > 0 
          ? `[Pending: ${pendingNum}] ${cNotes.trim()}`.trim() 
          : cNotes.trim() || null;

        const payload = {
          member_id: Number(cMemberId),
          amount: Number(cGivenAmount),
          date: cDate,
          payment_method: cMethod,
          transaction_id: cTxnId.trim() || null,
          status: statusVal,
          notes: formattedNotes
        };

        const url = editingId 
          ? `${API_BASE_URL}/api/committee/contributions/${editingId}`
          : `${API_BASE_URL}/api/committee/contributions`;
        
        const method = editingId ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers,
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          setIsSheetOpen(false);
          fetchFinanceData();
        } else {
          const errData = await res.json();
          setFormError(errData.detail || 'Failed to save committee record.');
        }
      } else if (activeTab === 'SPONSORSHIPS') {
        if (!sSponsorName.trim()) {
          setFormError('Please enter the Sponsor Name.');
          setSaving(false);
          return;
        }
        if (!sItemName.trim()) {
          setFormError('Please enter the Sponsored Item name.');
          setSaving(false);
          return;
        }

        const sponsorDetails = {
          sponsor_name: sSponsorName.trim(),
          sponsor_phone: sSponsorPhone.trim() || null,
          item_name: sItemName.trim(),
          notes: sNotes.trim() || null
        };

        const payload = {
          user_id: user?.id,
          amount: sAmount && !isNaN(Number(sAmount)) ? Number(sAmount) : 0,
          date: sDate,
          payment_method: sMethod,
          transaction_id: sTxnId.trim() || null,
          status: 'PAID',
          notes: JSON.stringify(sponsorDetails)
        };

        const url = editingId 
          ? `${API_BASE_URL}/api/committee/sponsorships/${editingId}`
          : `${API_BASE_URL}/api/committee/sponsorships`;
        
        const method = editingId ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers,
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          setIsSheetOpen(false);
          fetchFinanceData();
        } else {
          const errData = await res.json();
          setFormError(errData.detail || 'Failed to save item sponsorship.');
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
          notes: chNotes.trim() || null,
          collected_by: chCollectedBy || null
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
    if (!window.confirm('Are you sure you want to delete this record?')) return;

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
    <div className="flex-1 min-h-0 flex flex-col bg-primary-bg text-primary-text overflow-y-auto no-scrollbar pb-28 relative">
      {/* Header Bar */}
      <div className="h-16 px-5 shrink-0 flex items-center justify-between border-b border-border-custom bg-white/95 backdrop-blur sticky top-0 z-30">
        <div className="min-w-0 flex-1 mr-2">
          <h2 className="text-sm xs:text-base font-bold tracking-tight text-primary-maroon font-serif truncate">Finance Ledger</h2>
          <span className="text-[8px] xs:text-[10px] text-secondary-text font-bold uppercase tracking-wider block truncate">Account Registers</span>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {/* Search Input in Header */}
          <div className="relative w-24 xs:w-32 sm:w-48">
            <input 
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-secondary-bg border border-border-custom rounded-xl pl-8 pr-2 py-1.5 text-[11px] focus:outline-none focus:border-primary-maroon font-semibold text-primary-text placeholder:text-secondary-text/50"
            />
            <Search className="w-3.5 h-3.5 text-secondary-text absolute left-2.5 top-2" />
          </div>

          <button 
            onClick={openAddSheet}
            className="w-9 h-9 rounded-full bg-primary-maroon text-white border border-light-gold flex items-center justify-center hover:bg-dark-maroon active:scale-95 transition-all cursor-pointer shadow-md shrink-0"
            title="Add New Entry"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
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

      {/* 4. MINI DASHBOARD WIDGET */}
      {summary && (
        <div className="px-5 py-3 shrink-0 flex flex-col gap-3">
          <span className="text-[9px] font-bold text-secondary-text uppercase tracking-widest block -mb-1">
            Ledger Overview ({selectedYear === 0 ? 'All Time' : selectedYear})
          </span>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Total Income */}
            <div className="bg-white border border-border-custom rounded-2xl p-3 shadow-sm flex flex-col justify-between h-[74px]">
              <span className="text-[8px] font-bold uppercase tracking-wider text-secondary-text bg-secondary-bg px-1.5 py-0.5 rounded-md self-start">Total Income</span>
              <div className="mt-1">
                <span className="text-[10px] font-black text-primary-text block">
                  ₹{summary.total_funds.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Current Balance */}
            <div className="bg-white border border-border-custom rounded-2xl p-3 shadow-sm flex flex-col justify-between h-[74px]">
              <span className="text-[8px] font-bold uppercase tracking-wider text-secondary-text bg-secondary-bg px-1.5 py-0.5 rounded-md self-start">Balance</span>
              <div className="mt-1">
                <span className="text-[10px] font-black text-primary-text block">
                  ₹{summary.current_balance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border-custom rounded-2xl p-3 shadow-sm flex items-center justify-between text-center divide-x divide-border-custom/50">
            {activeTab === 'CONTRIBUTIONS' && (() => {
              const activeYrContribs = contributions.filter(item => item.member_id !== null && (selectedYear > 0 ? new Date(item.date).getFullYear() === selectedYear : true));
              const totalPledge = activeYrContribs.reduce((sum, item) => sum + parseCommitteeDetails(item).totalPledge, 0);
              const totalGiven = activeYrContribs.reduce((sum, item) => sum + parseCommitteeDetails(item).givenAmount, 0);
              const totalPending = activeYrContribs.reduce((sum, item) => sum + parseCommitteeDetails(item).pendingAmount, 0);
              return (
                <>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-[8px] font-bold text-secondary-text uppercase tracking-wider">Total Pledge</span>
                    <span className="text-xs font-black text-primary-text">₹{totalPledge.toLocaleString()}</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-[8px] font-bold text-secondary-text uppercase tracking-wider">Collected</span>
                    <span className="text-xs font-black text-success">₹{totalGiven.toLocaleString()}</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-[8px] font-bold text-secondary-text uppercase tracking-wider">Pending</span>
                    <span className="text-xs font-black text-error">₹{totalPending.toLocaleString()}</span>
                  </div>
                </>
              );
            })()}

            {activeTab === 'SPONSORSHIPS' && (() => {
              const activeYrSpons = sponsorships.filter(item => (selectedYear > 0 ? new Date(item.date).getFullYear() === selectedYear : true));
              const totalSponsors = activeYrSpons.length;
              const totalValue = activeYrSpons.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
              return (
                <>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-[8px] font-bold text-secondary-text uppercase tracking-wider">Total Sponsors</span>
                    <span className="text-xs font-black text-primary-text">{totalSponsors}</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-[8px] font-bold text-secondary-text uppercase tracking-wider">Total Value</span>
                    <span className="text-xs font-black text-antique-gold">₹{totalValue.toLocaleString()}</span>
                  </div>
                </>
              );
            })()}

            {activeTab === 'CHANDHALU' && (() => {
              const activeYrChandha = chandhalu.filter(item => (selectedYear > 0 ? new Date(item.date).getFullYear() === selectedYear : true));
              const totalDonors = activeYrChandha.length;
              const totalCollected = activeYrChandha.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
              return (
                <>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-[8px] font-bold text-secondary-text uppercase tracking-wider">Total Donors</span>
                    <span className="text-xs font-black text-primary-text">{totalDonors}</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-[8px] font-bold text-secondary-text uppercase tracking-wider">Total Collected</span>
                    <span className="text-xs font-black text-success">₹{totalCollected.toLocaleString()}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* 5. SEARCH & FILTER CONTROLS */}
      <div className="px-5 py-2.5 shrink-0 bg-white border-b border-border-custom flex flex-col gap-2">

        {/* Filter Pills Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-[8px] font-bold text-secondary-text uppercase tracking-wider shrink-0 mr-1">Method:</span>
          {['ALL', 'UPI', 'CASH', 'BANK_TRANSFER', 'IN_KIND'].map(method => {
            // Hide IN_KIND for contributions/chandhalu as it's typically only sponsorships
            if (method === 'IN_KIND' && activeTab !== 'SPONSORSHIPS') return null;
            return (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethodFilter(method)}
                className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border shrink-0 cursor-pointer transition-all ${
                  paymentMethodFilter === method
                    ? 'bg-primary-maroon text-white border-primary-maroon'
                    : 'bg-white border-border-custom text-secondary-text hover:bg-secondary-bg/50'
                }`}
              >
                {method === 'ALL' ? 'All' : method.replace('_', ' ')}
              </button>
            );
          })}
        </div>

        {/* Amount filter pills specifically for Public Donations (CHANDHALU) */}
        {activeTab === 'CHANDHALU' && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            <span className="text-[8px] font-bold text-secondary-text uppercase tracking-wider shrink-0 mr-1">Amount:</span>
            {([
              { id: 'ALL', label: 'All' },
              { id: 'UNDER_500', label: 'Under ₹500' },
              { id: '500_1000', label: '₹500 - ₹1K' },
              { id: '1000_5000', label: '₹1K - ₹5K' },
              { id: 'OVER_5000', label: '₹5K+' }
            ] as const).map(range => (
              <button
                key={range.id}
                type="button"
                onClick={() => setAmountRange(range.id)}
                className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border shrink-0 cursor-pointer transition-all ${
                  amountRange === range.id
                    ? 'bg-antique-gold text-white border-antique-gold'
                    : 'bg-white border-border-custom text-secondary-text hover:bg-secondary-bg/50'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ledger lists */}
      {loading ? (
        <div className="flex-grow flex flex-col justify-center items-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-t-primary-maroon border-border-custom animate-spin" />
        </div>
      ) : (
        <div className="px-5 pt-4 flex flex-col gap-3">
          
          {/* 1. COMMITTEE CONTRIBUTIONS LIST with Given & Pending tracking and CRUD */}
          {activeTab === 'CONTRIBUTIONS' && (() => {
            const filtered = contributions
              .filter(item => item.member_id !== null && (selectedYear > 0 ? new Date(item.date).getFullYear() === selectedYear : true))
              .filter(item => {
                const query = searchQuery.toLowerCase().trim();
                const matchesSearch = !query || 
                  item.member?.name?.toLowerCase().includes(query) ||
                  item.member?.member_id?.toLowerCase().includes(query) ||
                  (item.notes && item.notes.toLowerCase().includes(query));
                
                const matchesPayment = paymentMethodFilter === 'ALL' || item.payment_method === paymentMethodFilter;
                return matchesSearch && matchesPayment;
              });
            return (
              <>
                {filtered.length === 0 ? (
                  <div className="text-center p-8 bg-white border border-border-custom rounded-2xl text-xs text-secondary-text">
                    No matching committee contributions found.
                  </div>
                ) : (
                  filtered.map(item => {
                    const { givenAmount, pendingAmount, totalPledge, cleanNotes } = parseCommitteeDetails(item);
                    return (
                      <div key={item.id} className="bg-white border border-border-custom p-4 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                        
                        {/* Top Row: Member Name, ID, Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-primary-maroon/10 text-primary-maroon flex items-center justify-center font-bold text-xs">
                              {item.member?.name?.charAt(0) || 'M'}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-primary-text truncate">{item.member?.name || 'Unknown Member'}</h4>
                              <div className="flex items-center gap-2 text-[10px] text-secondary-text font-medium flex-wrap">
                                <span className="font-mono text-antique-gold font-bold">{item.member?.member_id}</span>
                                <span>•</span>
                                <span>Pledge: ₹{totalPledge.toLocaleString()}</span>
                                <span>•</span>
                                <span>{item.date}</span>
                                <span>•</span>
                                <span className="font-mono text-[8px] uppercase bg-secondary-bg px-1.5 py-0.5 rounded text-primary-text font-extrabold">{item.payment_method}</span>
                              </div>
                            </div>
                          </div>

                          {/* CRUD Action Buttons */}
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => openEditCommittee(item)}
                              className="p-1.5 rounded-lg text-secondary-text hover:text-primary-maroon hover:bg-secondary-bg active:scale-90 cursor-pointer transition-colors"
                              title="Edit Contribution"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete('CONTRIBUTION', item.id)}
                              className="p-1.5 rounded-lg text-secondary-text hover:text-error hover:bg-error/10 active:scale-90 cursor-pointer transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Middle Row: Given Amount vs Pending Amount Grid */}
                        <div className="grid grid-cols-2 gap-2 bg-secondary-bg/50 p-2.5 rounded-xl border border-border-custom/60">
                          {/* Given / Paid */}
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-secondary-text uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-success" />
                              <span>Given Amount</span>
                            </span>
                            <span className="text-sm font-black text-success mt-0.5">₹{givenAmount.toLocaleString()}</span>
                          </div>

                          {/* Pending Amount */}
                          <div className="flex flex-col border-l border-border-custom/80 pl-3">
                            <span className="text-[9px] font-bold text-secondary-text uppercase tracking-wider flex items-center gap-1">
                              <Clock className="w-3 h-3 text-warning" />
                              <span>Pending Amount</span>
                            </span>
                            {pendingAmount > 0 ? (
                              <span className="text-sm font-black text-error mt-0.5">₹{pendingAmount.toLocaleString()}</span>
                            ) : (
                              <span className="text-xs font-bold text-success mt-0.5">✓ Cleared (₹0)</span>
                            )}
                          </div>
                        </div>

                        {/* Notes if any */}
                        {cleanNotes && (
                          <p className="text-[10px] text-secondary-text italic line-clamp-1 -mt-1">{cleanNotes}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            );
          })()}

          {/* 2. ITEM SPONSORSHIPS LIST - Item Name & Sponsor Highlighted, Price Minimized */}
          {activeTab === 'SPONSORSHIPS' && (() => {
            const filtered = sponsorships
              .filter(item => (selectedYear > 0 ? new Date(item.date).getFullYear() === selectedYear : true))
              .filter(item => {
                const query = searchQuery.toLowerCase().trim();
                const { sponsorName, itemName, extraNotes } = parseSponsorDetails(item);
                const matchesSearch = !query || 
                  sponsorName.toLowerCase().includes(query) ||
                  itemName.toLowerCase().includes(query) ||
                  extraNotes.toLowerCase().includes(query);
                
                const matchesPayment = paymentMethodFilter === 'ALL' || item.payment_method === paymentMethodFilter;
                return matchesSearch && matchesPayment;
              });
            return (
              <>
                {filtered.length === 0 ? (
                  <div className="text-center p-8 bg-white border border-border-custom rounded-2xl text-xs text-secondary-text">
                    No matching item sponsorships found.
                  </div>
                ) : (
                  filtered.map(item => {
                    const { sponsorName, sponsorPhone, itemName, extraNotes } = parseSponsorDetails(item);
                    return (
                      <div key={item.id} className="bg-white border border-border-custom p-4 rounded-2xl flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow">
                        
                        {/* Top Header: HIGHLIGHTED ITEM NAME with Gift Icon */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-antique-gold/15 text-antique-gold flex items-center justify-center shrink-0">
                              <Gift className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-black text-primary-maroon tracking-wide truncate uppercase font-serif">
                                {itemName}
                              </h3>
                              <span className="text-[9px] font-bold text-secondary-text uppercase">Item Sponsored</span>
                            </div>
                          </div>

                          {/* Actions (Edit & Delete) */}
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => openEditSponsorship(item)}
                              className="p-1.5 rounded-lg text-secondary-text hover:text-primary-maroon hover:bg-secondary-bg active:scale-90 cursor-pointer transition-colors"
                              title="Edit Sponsorship"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete('SPONSORSHIP', item.id)}
                              className="p-1.5 rounded-lg text-secondary-text hover:text-error hover:bg-error/10 active:scale-90 cursor-pointer transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Sponsor Info (Prominent Name) */}
                        <div className="flex items-center justify-between bg-secondary-bg/50 p-2.5 rounded-xl border border-border-custom/50 flex-wrap gap-2">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-secondary-text uppercase tracking-wider">Sponsor Name</span>
                            <span className="text-xs font-black text-primary-text mt-0.5">{sponsorName}</span>
                            {sponsorPhone && (
                              <span className="text-[10px] font-mono text-success font-bold mt-0.5">{sponsorPhone}</span>
                            )}
                          </div>

                          {/* Compact Minimized Price & Mode */}
                          <div className="flex items-col items-end">
                            <span className="text-[9px] font-bold text-secondary-text uppercase tracking-wider">Est. Value</span>
                            {Number(item.amount) > 0 ? (
                              <span className="text-xs font-bold text-secondary-text font-mono mt-0.5">₹{Number(item.amount).toLocaleString()}</span>
                            ) : (
                              <span className="text-[10px] font-bold text-antique-gold mt-0.5">In-Kind Material</span>
                            )}
                            <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-md bg-white border border-border-custom text-primary-maroon uppercase mt-1">
                              {item.payment_method === 'IN_KIND' ? 'In-Kind Item' : item.payment_method}
                            </span>
                          </div>
                        </div>

                        {/* Notes / Remarks */}
                        {extraNotes && (
                          <p className="text-[10px] text-secondary-text italic line-clamp-1">{extraNotes}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            );
          })()}

          {/* 3. PUBLIC DONATIONS (CHANDHALU) LIST */}
          {activeTab === 'CHANDHALU' && (() => {
            const filtered = chandhalu
              .filter(item => (selectedYear > 0 ? new Date(item.date).getFullYear() === selectedYear : true))
              .filter(item => {
                const query = searchQuery.toLowerCase().trim();
                const matchesSearch = !query || 
                  item.donor_name?.toLowerCase().includes(query) ||
                  item.donor_phone?.includes(query) ||
                  (item.notes && item.notes.toLowerCase().includes(query));
                
                const matchesPayment = paymentMethodFilter === 'ALL' || item.payment_method === paymentMethodFilter;
                
                let matchesAmount = true;
                const amt = Number(item.amount) || 0;
                if (amountRange === 'UNDER_500') matchesAmount = amt < 500;
                else if (amountRange === '500_1000') matchesAmount = amt >= 500 && amt <= 1000;
                else if (amountRange === '1000_5000') matchesAmount = amt > 1000 && amt <= 5000;
                else if (amountRange === 'OVER_5000') matchesAmount = amt > 5000;
                
                return matchesSearch && matchesPayment && matchesAmount;
              });
            return (
              <>
                {filtered.length === 0 ? (
                  <div className="text-center p-8 bg-white border border-border-custom rounded-2xl text-xs text-secondary-text">
                    No matching public donations found.
                  </div>
                ) : (
                  filtered.map(item => (
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
                        {item.collected_by && (
                          <span className="text-[8px] text-secondary-text font-bold bg-secondary-bg px-1.5 py-0.5 rounded w-fit block mt-1">
                            Rec By: {item.collected_by}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
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
                    </div>
                  ))
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Unified Add / Edit Transaction Sheet */}
      <BottomSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={
          activeTab === 'CONTRIBUTIONS' 
            ? (editingId ? "Edit Committee Contribution" : "Record Committee Contribution")
            : activeTab === 'SPONSORSHIPS' 
            ? (editingId ? "Edit Item Sponsorship" : "Record Item Sponsorship")
            : "Report Public Donation (Chandha)"
        }
      >
        <form onSubmit={handleSaveTransaction} className="flex flex-col gap-4">
          
          {/* 1. Committee Member Selection with Given & Pending inputs */}
          {activeTab === 'CONTRIBUTIONS' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Select Committee Member</label>
                <select
                  value={cMemberId}
                  onChange={e => setCMemberId(e.target.value)}
                  className="w-full bg-white border border-border-custom rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold cursor-pointer"
                >
                  <option value="">-- Choose Member --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.member_id})</option>
                  ))}
                </select>
              </div>

              {/* Given & Pending Amount Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-success uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Given / Paid (₹)</span>
                  </label>
                  <input 
                    type="number"
                    placeholder="e.g. 5000"
                    value={cGivenAmount}
                    onChange={e => setCGivenAmount(e.target.value)}
                    className="w-full bg-white border border-border-custom rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-success text-success font-black placeholder:text-secondary-text/50 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-antique-gold uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Pending / Due (₹)</span>
                  </label>
                  <input 
                    type="number"
                    placeholder="0"
                    value={cPendingAmount}
                    onChange={e => setCPendingAmount(e.target.value)}
                    className="w-full bg-white border border-border-custom rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-antique-gold text-error font-black placeholder:text-secondary-text/50 font-mono"
                  />
                </div>
              </div>

              {/* Payment Mode & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Payment Mode</label>
                  <select
                    value={cMethod}
                    onChange={e => setCMethod(e.target.value)}
                    className="w-full bg-white border border-border-custom rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold cursor-pointer"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Date</label>
                  <input 
                    type="date"
                    value={cDate}
                    onChange={e => setCDate(e.target.value)}
                    className="w-full bg-white border border-border-custom rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Remarks / Notes (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. Paid 1st installment, balance on Chavithi"
                  value={cNotes}
                  onChange={e => setCNotes(e.target.value)}
                  className="w-full bg-white border border-border-custom rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold placeholder:text-secondary-text/50"
                />
              </div>
            </>
          )}

          {/* 2. Item Sponsorship Detailed Inputs */}
          {activeTab === 'SPONSORSHIPS' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-primary-maroon uppercase tracking-widest">Sponsored Item Name / Description</label>
                <input 
                  type="text"
                  placeholder="e.g. 25kg Rice Bags, Laddu Prasadam, Flower Garlands"
                  value={sItemName}
                  onChange={e => setSItemName(e.target.value)}
                  className="w-full bg-white border border-primary-maroon/30 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-maroon text-primary-maroon font-bold placeholder:text-secondary-text/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Sponsor Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. T.V.S Murthy, Ramesh"
                    value={sSponsorName}
                    onChange={e => setSSponsorName(e.target.value)}
                    className="w-full bg-white border border-border-custom rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold placeholder:text-secondary-text/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Sponsor Phone (Optional)</label>
                  <input 
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={sSponsorPhone}
                    onChange={e => setSSponsorPhone(e.target.value)}
                    className="w-full bg-white border border-border-custom rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold placeholder:text-secondary-text/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Estimated Value / ₹ (Optional)</label>
                  <input 
                    type="number"
                    placeholder="₹ 0 or Value"
                    value={sAmount}
                    onChange={e => setSAmount(e.target.value)}
                    className="w-full bg-white border border-border-custom rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold placeholder:text-secondary-text/50 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Contribution Mode</label>
                  <select
                    value={sMethod}
                    onChange={e => setSMethod(e.target.value)}
                    className="w-full bg-white border border-border-custom rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold cursor-pointer"
                  >
                    <option value="IN_KIND">In-Kind (Item / Material)</option>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / Online</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Date</label>
                  <input 
                    type="date"
                    value={sDate}
                    onChange={e => setSDate(e.target.value)}
                    className="w-full bg-white border border-border-custom rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Delivery / Remarks</label>
                  <input 
                    type="text"
                    placeholder="e.g. Delivered on Day 1"
                    value={sNotes}
                    onChange={e => setSNotes(e.target.value)}
                    className="w-full bg-white border border-border-custom rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold placeholder:text-secondary-text/50"
                  />
                </div>
              </div>
            </>
          )}

          {/* 3. Donor Name & Phone (Only for Public Donations / Chandhalu) */}
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

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Amount (₹)</label>
                  <input 
                    type="number"
                    placeholder="e.g. 5000"
                    value={chAmount}
                    onChange={e => setChAmount(e.target.value)}
                    className="w-full bg-white border border-border-custom rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-bold placeholder:text-secondary-text/50 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Payment Mode</label>
                  <select
                    value={chMethod}
                    onChange={e => setChMethod(e.target.value)}
                    className="w-full bg-white border border-border-custom rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold cursor-pointer"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Date</label>
                <input 
                  type="date"
                  value={chDate}
                  onChange={e => setChDate(e.target.value)}
                  className="w-full bg-white border border-border-custom rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Collected By</label>
                <select
                  value={chCollectedBy}
                  onChange={e => setChCollectedBy(e.target.value)}
                  className="w-full bg-white border border-border-custom rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold cursor-pointer"
                >
                  <option value="">Select Committee Member...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {formError && (
            <div className="text-xs text-error font-bold p-3 bg-error/10 border border-error/20 rounded-xl">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary-maroon hover:bg-dark-maroon text-white font-extrabold text-xs py-3.5 rounded-xl mt-1 active:scale-95 transition-all shadow-md flex justify-center items-center cursor-pointer"
          >
            {saving ? (
              <div className="w-4.5 h-4.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span>{editingId ? "Update Record" : "Save Record"}</span>
            )}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
};

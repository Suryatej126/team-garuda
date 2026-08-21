import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { BottomSheet } from '../components/BottomSheet';
import { 
  Plus, 
  Receipt, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Tag, 
  Sparkles,
  Utensils,
  Lightbulb,
  Music,
  Truck,
  Flower2,
  HelpCircle,
  TrendingDown,
  Search
} from 'lucide-react';

interface ExpenseItem {
  id: number;
  name: string;
  amount: number;
  date: string;
  category: string;
  payment_method: string;
  receipt_url: string | null;
  event_id: number | null;
  notes: string | null;
  event?: {
    id: number;
    name: string;
  };
}

interface EventItem {
  id: number;
  name: string;
}

const CATEGORIES = [
  { id: 'FOOD', label: 'Prasadam & Food', icon: Utensils },
  { id: 'IDOL', label: 'Idol & Vigraham', icon: Sparkles },
  { id: 'DECORATION', label: 'Tent & Decoration', icon: Flower2 },
  { id: 'SOUND_LIGHTING', label: 'Sound & Lighting', icon: Lightbulb },
  { id: 'POOJA', label: 'Pooja Samagri', icon: Tag },
  { id: 'BAND_MUSIC', label: 'Band & Music', icon: Music },
  { id: 'LOGISTICS', label: 'Transport & Logistics', icon: Truck },
  { id: 'MISC', label: 'Miscellaneous', icon: HelpCircle },
];

export const Expenses: React.FC = () => {
  const { token, logout } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Sheet & Form States
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState<{ name: string; amount: number } | null>(null);

  // Form Fields
  const [eName, setEName] = useState('');
  const [eAmount, setEAmount] = useState('');
  const [eDate, setEDate] = useState(new Date().toISOString().split('T')[0]);
  const [eCategory, setECategory] = useState('FOOD');
  const [eMethod, setEMethod] = useState('UPI');
  const [eEventId, setEEventId] = useState('');
  const [eNotes, setENotes] = useState('');
  const [eReceipt, setEReceipt] = useState<File | null>(null);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch expenses and events in parallel using Promise.all for 2x speed improvement
      const [res, eventsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/committee/expenses`, { headers }),
        fetch(`${API_BASE_URL}/api/public/events`)
      ]);

      if (res.status === 401) {
        logout();
        return;
      }

      if (res.ok) {
        setExpenses(await res.json());
      }
      if (eventsRes.ok) {
        setEvents(await eventsRes.json());
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [token]);

  const openAddSheet = () => {
    setFormError('');
    setEName('');
    setEAmount('');
    setEDate(new Date().toISOString().split('T')[0]);
    setECategory('FOOD');
    setEMethod('UPI');
    setEEventId(events.length > 0 ? String(events[0].id) : '');
    setENotes('');
    setEReceipt(null);
    setIsSheetOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eName.trim()) {
      setFormError('Please enter expense purpose/item name.');
      return;
    }
    if (!eAmount || isNaN(Number(eAmount)) || Number(eAmount) <= 0) {
      setFormError('Please enter a valid expense amount.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('name', eName.trim());
      formData.append('amount', eAmount);
      formData.append('date', eDate);
      formData.append('category', eCategory);
      formData.append('payment_method', eMethod);
      if (eEventId) formData.append('event_id', eEventId);
      if (eNotes.trim()) formData.append('notes', eNotes.trim());
      if (eReceipt) formData.append('receipt', eReceipt);

      const res = await fetch(`${API_BASE_URL}/api/committee/expenses`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const newExp = await res.json();
        setExpenses(prev => [newExp, ...prev]);
        setIsSheetOpen(false);
        setSuccessToast({ name: eName.trim(), amount: Number(eAmount) });
        setTimeout(() => setSuccessToast(null), 3500);
      } else {
        const errData = await res.json();
        setFormError(errData.detail || 'Failed to save expense.');
      }
    } catch (err) {
      setFormError('Network error while saving expense.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/committee/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setExpenses(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  // Filtered by year, category and search query
  const filteredExpenses = expenses.filter(item => {
    const itemYear = new Date(item.date).getFullYear();
    const matchesYear = selectedYear > 0 ? itemYear === selectedYear : true;
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      item.name?.toLowerCase().includes(query) ||
      (item.notes && item.notes.toLowerCase().includes(query)) ||
      item.payment_method?.toLowerCase().includes(query) ||
      (item.event?.name && item.event.name.toLowerCase().includes(query));
      
    return matchesYear && matchesCat && matchesSearch;
  });

  const totalSpent = filteredExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

  // Group by category for metric breakdown
  const categoryTotals: Record<string, number> = {};
  filteredExpenses.forEach(item => {
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + Number(item.amount);
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-primary-bg text-primary-text overflow-y-auto no-scrollbar pb-24 relative">
      
      {/* Header Bar */}
      <div className="h-16 px-5 shrink-0 flex items-center justify-between border-b border-border-custom bg-white/95 backdrop-blur sticky top-0 z-30">
        <div className="min-w-0 flex-1 mr-2">
          <h2 className="text-sm xs:text-base font-bold tracking-tight text-primary-maroon font-serif truncate">Event Expenses</h2>
          <span className="text-[8px] xs:text-[10px] text-secondary-text font-bold uppercase tracking-wider block truncate">Committee Cost Ledger</span>
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
            title="Add Expense"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white border border-success/30 text-primary-text p-4 rounded-2xl flex items-center gap-3 shadow-xl animate-bounce">
          <CheckCircle className="w-6 h-6 text-success shrink-0" />
          <div>
            <h4 className="text-xs font-black text-primary-maroon">✓ Expense Recorded</h4>
            <p className="text-[10px] font-bold text-primary-text mt-0.5">{successToast.name} • <span className="text-error">₹{successToast.amount.toLocaleString()}</span></p>
          </div>
        </div>
      )}

      {/* Year Selector & Overview Section */}
      <div className="p-4 shrink-0 bg-white/90 border-b border-border-custom flex flex-col gap-3">
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

        {/* Expense Total Overview Card */}
        <div className="bg-white border border-border-custom rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Total Spent ({selectedYear === 0 ? 'All Time' : selectedYear})</span>
            <span className="text-2xl font-black text-error mt-0.5">₹{totalSpent.toLocaleString()}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center text-error">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Category Horizontal Scroll Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-primary-maroon text-white shadow-xs'
                : 'bg-secondary-bg text-secondary-text border border-border-custom hover:text-primary-text'
            }`}
          >
            All ({expenses.filter(i => selectedYear > 0 ? new Date(i.date).getFullYear() === selectedYear : true).length})
          </button>
          {CATEGORIES.map(cat => {
            const count = expenses.filter(i => (selectedYear > 0 ? new Date(i.date).getFullYear() === selectedYear : true) && i.category === cat.id).length;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-primary-maroon text-white shadow-xs'
                    : 'bg-secondary-bg text-secondary-text border border-border-custom hover:text-primary-text'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{cat.label}</span>
                {count > 0 && <span className="opacity-75">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expenses List */}
      {loading ? (
        <div className="flex-1 flex flex-col justify-center items-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-t-primary-maroon border-border-custom animate-spin" />
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center p-8 m-5 text-center bg-white border border-border-custom rounded-3xl shadow-sm py-16">
          <Receipt className="w-12 h-12 text-antique-gold stroke-[1.5] mb-3" />
          <h3 className="text-sm font-bold text-primary-maroon font-serif">No Expenses Recorded</h3>
          <p className="text-[10px] text-secondary-text mt-1 max-w-xs">
            Tap the button above to record any expenses incurred during the event.
          </p>
          <button 
            onClick={openAddSheet}
            className="mt-4 bg-primary-maroon hover:bg-dark-maroon text-white font-extrabold text-[11px] px-4 py-2 rounded-xl active:scale-95 transition-all cursor-pointer shadow-md"
          >
            + Record First Expense
          </button>
        </div>
      ) : (
        <div className="px-5 pt-4 flex flex-col gap-3">
          {filteredExpenses.map(item => (
            <div key={item.id} className="bg-white border border-border-custom p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex flex-col gap-1 min-w-0">
                <h4 className="text-xs font-extrabold text-primary-text truncate">{item.name}</h4>
                <div className="flex items-center gap-2 text-[10px] text-secondary-text font-medium flex-wrap">
                  <span className="text-[8px] font-extrabold bg-secondary-bg text-primary-maroon border border-border-custom px-1.5 py-0.5 rounded-full uppercase">
                    {item.category.replace('_', ' ')}
                  </span>
                  <span>•</span>
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
                  <span className="text-sm font-black text-error">₹{Number(item.amount).toLocaleString()}</span>
                  {item.receipt_url && (
                    <a 
                      href={`${API_BASE_URL}${item.receipt_url}`} 
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
                  onClick={() => handleDeleteExpense(item.id)}
                  className="p-1.5 rounded-full text-secondary-text hover:text-error active:scale-90 cursor-pointer"
                  title="Delete Expense"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Expense BottomSheet */}
      <BottomSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Record Event Expense"
      >
        <form onSubmit={handleSaveExpense} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Expense Title / Item Name</label>
            <input 
              type="text" 
              placeholder="e.g. Tent & Lightings, Laddu Prasadam, Band"
              value={eName}
              onChange={e => setEName(e.target.value)}
              className="w-full bg-secondary-bg/60 border border-border-custom rounded-xl px-4 py-2.5 text-xs text-primary-text focus:outline-none focus:border-primary-maroon font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Amount (₹)</label>
              <input 
                type="number" 
                placeholder="₹ 5000"
                value={eAmount}
                onChange={e => setEAmount(e.target.value)}
                className="w-full bg-secondary-bg/60 border border-border-custom rounded-xl px-4 py-2.5 text-xs text-primary-text font-black focus:outline-none focus:border-primary-maroon"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Category</label>
              <select 
                value={eCategory}
                onChange={e => setECategory(e.target.value)}
                className="w-full bg-secondary-bg/60 border border-border-custom rounded-xl px-3 py-2.5 text-xs text-primary-text font-semibold focus:outline-none focus:border-primary-maroon"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Date</label>
              <input 
                type="date" 
                value={eDate}
                onChange={e => setEDate(e.target.value)}
                className="w-full bg-secondary-bg/60 border border-border-custom rounded-xl px-3 py-2 text-xs text-primary-text font-semibold focus:outline-none focus:border-primary-maroon"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Payment Mode</label>
              <select 
                value={eMethod}
                onChange={e => setEMethod(e.target.value)}
                className="w-full bg-secondary-bg/60 border border-border-custom rounded-xl px-3 py-2.5 text-xs text-primary-text font-semibold focus:outline-none focus:border-primary-maroon"
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
          </div>

          {events.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Linked Event</label>
              <select 
                value={eEventId}
                onChange={e => setEEventId(e.target.value)}
                className="w-full bg-secondary-bg/60 border border-border-custom rounded-xl px-3 py-2.5 text-xs text-primary-text font-semibold focus:outline-none focus:border-primary-maroon"
              >
                <option value="">-- General Committee Fund --</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Bill / Receipt Photo (Optional)</label>
            <input 
              type="file" 
              accept="image/*,.pdf"
              onChange={e => setEReceipt(e.target.files ? e.target.files[0] : null)}
              className="w-full text-xs text-secondary-text file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-extrabold file:bg-primary-maroon file:text-white hover:file:bg-dark-maroon cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Notes / Vendor Details (Optional)</label>
            <textarea 
              placeholder="e.g. Paid to Sri Ram Tent House for 3 days"
              value={eNotes}
              onChange={e => setENotes(e.target.value)}
              rows={2}
              className="w-full bg-secondary-bg/60 border border-border-custom rounded-xl px-4 py-2.5 text-xs text-primary-text focus:outline-none focus:border-primary-maroon font-medium"
            />
          </div>

          {formError && (
            <div className="bg-error/10 border border-error/20 text-error text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={saving}
            className="w-full bg-primary-maroon hover:bg-dark-maroon text-white font-extrabold text-xs py-3.5 rounded-xl mt-1 active:scale-95 transition-all shadow-md flex justify-center items-center cursor-pointer"
          >
            {saving ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span>Save & Record Expense</span>
            )}
          </button>
        </form>
      </BottomSheet>

    </div>
  );
};

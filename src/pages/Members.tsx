import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { BottomSheet } from '../components/BottomSheet';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  Calendar, 
  Upload, 
  Download,
  Printer,
  FileText
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Contributor {
  id: number;
  name: string;
  phone: string | null;
}

interface Member {
  id: number;
  member_id: string;
  name: string;
  phone: string;
}

interface Event {
  id: number;
  name: string;
}

interface Contribution {
  id: number;
  contributor_id: number;
  contributor: Contributor;
  member_id: number | null;
  member?: Member | null;
  amount: number;
  date: string;
  payment_method: string;
  transaction_id: string | null;
  event_id: number | null;
  event?: Event | null;
  purpose: string | null;
  status: string;
  notes: string | null;
}

export const Members: React.FC = () => {
  const { token, logout } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [eventFilter, setEventFilter] = useState<string>('ALL');

  // Expanded Contributor State
  const [expandedContributorId, setExpandedContributorId] = useState<number | null>(null);

  // Sheets and Dialogs State
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [contributionToDelete, setContributionToDelete] = useState<Contribution | null>(null);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);

  // Form Fields State
  const [contributorName, setContributorName] = useState('');
  const [contributorPhone, setContributorPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [eventId, setEventId] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedContributorId, setSelectedContributorId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  // Autocomplete Suggestions State
  const [nameSuggestions, setNameSuggestions] = useState<Array<{
    type: 'member' | 'contributor';
    id: number;
    name: string;
    phone: string | null;
    tag?: string;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Success Confirmation State
  const [successToast, setSuccessToast] = useState<{
    name: string;
    amount: number;
    year: number;
  } | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const contribsRes = await fetch(`${API_BASE_URL}/api/committee/contributions`, { headers });
      const contributorsRes = await fetch(`${API_BASE_URL}/api/committee/contributors`, { headers });
      const membersRes = await fetch(`${API_BASE_URL}/api/committee/members`, { headers });
      const eventsRes = await fetch(`${API_BASE_URL}/api/public/events`);

      if (contribsRes.status === 401 || contributorsRes.status === 401 || membersRes.status === 401) {
        logout();
        return;
      }

      if (contribsRes.ok) setContributions(await contribsRes.json());
      if (contributorsRes.ok) setContributors(await contributorsRes.json());
      if (membersRes.ok) setMembers(await membersRes.json());
      if (eventsRes.ok) setEvents(await eventsRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  // Click outside suggestions handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Autocomplete Suggestions
  const handleNameChange = (val: string) => {
    setContributorName(val);
    setSelectedContributorId(null);

    if (val.trim().length < 2) {
      setNameSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filteredSuggestions: typeof nameSuggestions = [];

    // Search contributors (excluding those associated with committee members)
    contributors.forEach(c => {
      const isMember = members.some(m => m.name.toLowerCase() === c.name.toLowerCase() || (c.phone && m.phone === c.phone));
      if (!isMember && c.name.toLowerCase().includes(val.toLowerCase())) {
        filteredSuggestions.push({
          type: 'contributor',
          id: c.id,
          name: c.name,
          phone: c.phone
        });
      }
    });

    setNameSuggestions(filteredSuggestions.slice(0, 5));
    setShowSuggestions(filteredSuggestions.length > 0);
  };

  const selectSuggestion = (s: typeof nameSuggestions[0]) => {
    setContributorName(s.name);
    setContributorPhone(s.phone || '');
    setSelectedContributorId(s.id);
    setShowSuggestions(false);
  };

  // Open forms
  const openAddContribution = () => {
    setEditingContribution(null);
    setContributorName('');
    setContributorPhone('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('CASH');
    setTransactionId('');
    setEventId('');
    setNotes('');
    setSelectedContributorId(null);
    setFormError('');
    setIsFormSheetOpen(true);
  };

  const openEditContribution = (c: Contribution) => {
    setEditingContribution(c);
    setContributorName(c.contributor.name);
    setContributorPhone(c.contributor.phone || '');
    setAmount(c.amount.toString());
    setDate(c.date);
    setPaymentMethod(c.payment_method);
    setTransactionId(c.transaction_id || '');
    setEventId(c.event_id?.toString() || '');
    setNotes(c.notes || '');
    setSelectedContributorId(c.contributor_id);
    setFormError('');
    setIsFormSheetOpen(true);
  };

  // Save Contribution Action
  const handleSaveContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributorName.trim() || !amount.trim()) {
      setFormError('Contributor Name and Amount are required.');
      return;
    }

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setFormError('Amount must be a positive number.');
      return;
    }

    setFormError('');
    setSaving(true);

    try {
      const url = editingContribution 
        ? `${API_BASE_URL}/api/committee/contributions/${editingContribution.id}`
        : `${API_BASE_URL}/api/committee/contributions`;
      
      const method = editingContribution ? 'PUT' : 'POST';
      const bodyPayload = {
        member_id: null, // Forces this as a public donation (Chandha)
        contributor_id: selectedContributorId,
        contributor_name: contributorName.trim(),
        contributor_phone: contributorPhone.trim() || null,
        amount: amtNum,
        date: date,
        payment_method: paymentMethod,
        transaction_id: transactionId.trim() || null,
        event_id: eventId ? Number(eventId) : null,
        status: 'PAID', // Contribution book defaults to PAID
        notes: notes.trim() || null
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });

      if (res.ok) {
        setIsFormSheetOpen(false);
        // Show success toast
        setSuccessToast({
          name: contributorName,
          amount: amtNum,
          year: new Date(date).getFullYear()
        });
        setTimeout(() => setSuccessToast(null), 3500);

        fetchAllData();
      } else {
        const errData = await res.json();
        setFormError(errData.detail || 'Failed to save contribution.');
      }
    } catch (err) {
      setFormError('Network error. Check server backend.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Contribution Action
  const triggerDelete = (c: Contribution) => {
    setContributionToDelete(c);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!contributionToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/committee/contributions/${contributionToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setIsDeleteConfirmOpen(false);
        setContributionToDelete(null);
        fetchAllData();
      }
    } catch (err) {
      console.error('Error deleting record:', err);
    }
  };

  // CSV Import Validation & Action
  const handleCSVImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    setImporting(true);
    setImportLogs([]);
    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    if (lines.length < 2) {
      setImportLogs(['Error: CSV must include a header line and at least one data row.']);
      setImporting(false);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const yearIdx = headers.indexOf('year');
    const nameIdx = headers.indexOf('name');
    const amountIdx = headers.indexOf('amount');
    const dateIdx = headers.indexOf('date');
    const payMethodIdx = headers.indexOf('payment_method');
    const eventIdx = headers.indexOf('event');
    const notesIdx = headers.indexOf('notes');

    if (yearIdx === -1 || nameIdx === -1 || amountIdx === -1 || dateIdx === -1 || payMethodIdx === -1) {
      setImportLogs(['Error: Missing required headers. Columns must contain: year, name, amount, date, payment_method']);
      setImporting(false);
      return;
    }

    const logs: string[] = [];
    let successCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim());
      if (row.length < headers.length) {
        logs.push(`Row ${i}: Skipped (incomplete columns)`);
        continue;
      }

      const year = row[yearIdx];
      const name = row[nameIdx];
      const amountStr = row[amountIdx];
      const dateStr = row[dateIdx];
      const payMethod = row[payMethodIdx].toUpperCase();
      const eventName = eventIdx !== -1 ? row[eventIdx] : '';
      const rowNotes = notesIdx !== -1 ? row[notesIdx] : '';

      // Validation
      if (!name || !amountStr || !dateStr) {
        logs.push(`Row ${i}: Skipped (missing Name, Amount, or Date)`);
        continue;
      }

      const amountVal = parseFloat(amountStr);
      if (isNaN(amountVal) || amountVal <= 0) {
        logs.push(`Row ${i}: Skipped (invalid Amount: ${amountStr})`);
        continue;
      }

      // Check payment method
      const validMethods = ['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'];
      const methodVal = validMethods.includes(payMethod) ? payMethod : 'CASH';

      // Match event from events list
      let matchedEventId: number | null = null;
      if (eventName) {
        const foundEvent = events.find(e => e.name.toLowerCase().includes(eventName.toLowerCase()));
        if (foundEvent) matchedEventId = foundEvent.id;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/committee/contributions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            contributor_name: name,
            amount: amountVal,
            date: dateStr,
            payment_method: methodVal,
            event_id: matchedEventId,
            status: 'PAID',
            notes: rowNotes || `Imported ${year} record`
          })
        });

        if (res.ok) {
          successCount++;
        } else {
          const errBody = await res.json();
          logs.push(`Row ${i} (${name}): Failed - ${errBody.detail || 'Server rejected request'}`);
        }
      } catch (err) {
        logs.push(`Row ${i} (${name}): Network Error`);
      }
    }

    logs.push(`Import completed. Successfully loaded ${successCount} of ${lines.length - 1} records.`);
    setImportLogs(logs);
    setImporting(false);
    setCsvText('');
    fetchAllData();
  };

  const handleExportCSV = () => {
    // Generate CSV headers
    const headers = ['year', 'name', 'phone', 'amount', 'date', 'payment_method', 'event', 'transaction_id', 'notes'];
    
    // Map contributions to rows
    const rows = filteredContributions.map(c => [
      selectedYear,
      c.contributor.name,
      c.contributor.phone || '',
      c.amount,
      c.date,
      c.payment_method,
      c.event?.name || '',
      c.transaction_id || '',
      c.notes || ''
    ]);

    // Construct CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => {
        const strVal = String(val).replace(/"/g, '""');
        return strVal.includes(',') || strVal.includes('\n') || strVal.includes('"') ? `"${strVal}"` : strVal;
      }).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `garuda_contributions_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();

      // Title & Header (Divine Minimal Palette)
      doc.setFontSize(18);
      doc.setTextColor(110, 31, 36); // Primary Maroon (#6E1F24)
      doc.text('TEAM GARUDA COMMITTEE', 105, 18, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Digital Contribution Book • Statement of Accounts (${selectedYear})`, 105, 25, { align: 'center' });

      // Summary Card
      doc.setDrawColor(201, 154, 74); // Antique Gold (#C99A4A)
      doc.setFillColor(250, 247, 242); // Ivory (#FAF7F2)
      doc.roundedRect(14, 30, 182, 18, 3, 3, 'FD');

      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('STATEMENT YEAR', 35, 37, { align: 'center' });
      doc.text('TOTAL CONTRIBUTORS', 105, 37, { align: 'center' });
      doc.text('TOTAL FUNDS COLLECTED', 165, 37, { align: 'center' });

      doc.setFontSize(11);
      doc.setTextColor(110, 31, 36);
      doc.setFont('helvetica', 'bold');
      doc.text(String(selectedYear), 35, 44, { align: 'center' });
      doc.text(String(rankedContributors.length), 105, 44, { align: 'center' });
      doc.text(`Rs. ${totalAmountSum.toLocaleString()}`, 165, 44, { align: 'center' });

      // Table Rows
      const tableData = rankedContributors.map((cGroup, index) => [
        index + 1,
        cGroup.name,
        cGroup.phone || 'N/A',
        `Rs. ${cGroup.totalAmount.toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: 54,
        head: [['Rank', 'Contributor Name', 'Phone Number', 'Total Contribution']],
        body: tableData,
        headStyles: {
          fillColor: [110, 31, 36],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 20 },
          1: { halign: 'left', cellWidth: 'auto' },
          2: { halign: 'left', cellWidth: 45 },
          3: { halign: 'right', cellWidth: 45 }
        },
        alternateRowStyles: {
          fillColor: [250, 247, 242]
        },
        margin: { left: 14, right: 14 },
        theme: 'grid'
      });

      // Footer on every page
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Generated on ${new Date().toLocaleDateString('en-IN')} • Team Garuda Official Contribution Statement • Page ${i} of ${pageCount}`,
          105,
          doc.internal.pageSize.height - 8,
          { align: 'center' }
        );
      }

      // Trigger instant direct download on Android & iOS
      doc.save(`garuda_contributions_${selectedYear}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Group and Aggregate Contributions for the Current Year Ranking
  const contributorGroups: Record<number, {
    id: number;
    name: string;
    phone: string | null;
    totalAmount: number;
    contributions: Contribution[];
  }> = {};

  // Filter contributions by selected year, search, event, payment method
  const filteredContributions = contributions.filter(c => {
    // Exclude committee member contributions (only show general public donations)
    if (c.member_id !== null) return false;

    // Year filter (from Contribution.date)
    const cYear = new Date(c.date).getFullYear();
    const matchesYear = cYear === selectedYear;

    // Search query matches contributor name, phone, transaction ID
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      c.contributor.name.toLowerCase().includes(searchLower) ||
      (c.contributor.phone && c.contributor.phone.includes(searchLower)) ||
      (c.transaction_id && c.transaction_id.toLowerCase().includes(searchLower));

    // Payment Method filter
    const matchesPayment = paymentMethodFilter === 'ALL' || c.payment_method === paymentMethodFilter;

    // Event filter
    const matchesEvent = eventFilter === 'ALL' || c.event_id?.toString() === eventFilter;

    return matchesYear && matchesSearch && matchesPayment && matchesEvent;
  });

  // Calculate year totals and rankings
  filteredContributions.forEach(c => {
    if (c.status !== 'PAID') return;
    const cid = c.contributor_id;
    if (!contributorGroups[cid]) {
      contributorGroups[cid] = {
        id: cid,
        name: c.contributor.name,
        phone: c.contributor.phone,
        totalAmount: 0,
        contributions: []
      };
    }
    contributorGroups[cid].totalAmount += parseFloat(c.amount as any);
    contributorGroups[cid].contributions.push(c);
  });

  const rankedContributors = Object.values(contributorGroups)
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const totalAmountSum = rankedContributors.reduce((sum, item) => sum + item.totalAmount, 0);
  const highestContributor = rankedContributors.length > 0 ? rankedContributors[0] : null;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-primary-bg text-primary-text overflow-y-auto no-scrollbar pb-10 relative">
      
      {/* Header Bar */}
      <div className="h-16 px-5 shrink-0 flex items-center justify-between border-b border-border-custom bg-white/95 backdrop-blur sticky top-0 z-30">
        <div>
          <h2 className="text-base font-bold tracking-tight text-primary-maroon font-serif">Yearly Contributors</h2>
          <span className="text-[10px] text-secondary-text font-bold uppercase tracking-wider">Digital Contribution Book</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Search Input in Header */}
          <div className="relative w-32 sm:w-48">
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
            onClick={openAddContribution}
            className="w-9 h-9 rounded-full bg-primary-maroon text-white border border-light-gold flex items-center justify-center hover:bg-dark-maroon active:scale-95 transition-all cursor-pointer shadow-md shrink-0"
            title="Add Contribution"
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
            <h4 className="text-xs font-black text-primary-maroon">✓ Contribution Recorded</h4>
            <p className="text-[10px] font-bold text-primary-text mt-0.5">{successToast.name} • <span className="text-success">₹{successToast.amount.toLocaleString()}</span></p>
            <span className="text-[8px] font-bold text-secondary-text uppercase tracking-wider">{successToast.year} Contribution Book</span>
          </div>
        </div>
      )}

      {/* Body Summary Card & Button */}
      <div className="p-5 flex flex-col gap-4">
        
        {/* Contribution Summary stats */}
        <div className="bg-white border border-border-custom p-5 rounded-3xl flex flex-col gap-4 shadow-sm relative">
          {/* Decorative Lotus silhouette */}
          <div className="absolute right-4 bottom-2 opacity-[0.03] pointer-events-none text-antique-gold">
            <svg width="90" height="90" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21a9 9 0 0 1-9-9 9 9 0 0 1 9-9 9 9 0 0 1 9 9 9 9 0 0 1-9 9z"/>
            </svg>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[9px] text-secondary-text font-bold uppercase tracking-widest">{selectedYear} Contribution Ledger</span>
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] text-secondary-text font-bold uppercase tracking-wider">Total Contributors</span>
              <span className="text-xl font-black text-primary-text mt-0.5">{rankedContributors.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-secondary-text font-bold uppercase tracking-wider">Total Collected</span>
              <span className="text-xl font-black text-primary-maroon mt-0.5">₹{totalAmountSum.toLocaleString()}</span>
            </div>
          </div>

          {highestContributor && (
            <div className="pt-3.5 border-t border-border-custom flex items-center justify-between text-[10px]">
              <span className="text-secondary-text font-bold uppercase tracking-wider">Highest Contributor</span>
              <span className="text-antique-gold font-extrabold">{highestContributor.name} (₹{highestContributor.totalAmount.toLocaleString()})</span>
            </div>
          )}
        </div>

        {/* Actions Row (Year, Import, Export, Print) */}
        <div className="flex items-center justify-between gap-2.5 bg-white border border-border-custom p-3 rounded-2xl shadow-sm mt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-secondary-text font-bold uppercase tracking-wider">Year:</span>
            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-secondary-bg border border-border-custom rounded-xl px-2 py-1 text-[11px] text-primary-maroon font-extrabold focus:outline-none focus:border-primary-maroon/50 cursor-pointer"
            >
              {[2026, 2025, 2024, 2023].map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setIsImportSheetOpen(true)}
              className="w-7 h-7 rounded-lg bg-secondary-bg border border-border-custom flex items-center justify-center text-secondary-text hover:text-primary-maroon active:scale-95 transition-all cursor-pointer"
              title="Import Historical CSV"
            >
              <Upload className="w-3.5 h-3.5 text-antique-gold" />
            </button>

            <button 
              onClick={handleExportCSV}
              className="w-7 h-7 rounded-lg bg-secondary-bg border border-border-custom flex items-center justify-center text-secondary-text hover:text-primary-maroon active:scale-95 transition-all cursor-pointer"
              title="Export to Excel/CSV"
            >
              <Download className="w-3.5 h-3.5 text-antique-gold" />
            </button>

            <button 
              onClick={handleExportPDF}
              className="w-7 h-7 rounded-lg bg-secondary-bg border border-border-custom flex items-center justify-center text-secondary-text hover:text-primary-maroon active:scale-95 transition-all cursor-pointer"
              title="Export to PDF Statement"
            >
              <Printer className="w-3.5 h-3.5 text-antique-gold" />
            </button>
          </div>
        </div>

      </div>

      {/* Filters */}
      <div className="px-5 pb-3 flex gap-2">
        {/* Method Filter */}
        <select
          value={paymentMethodFilter}
          onChange={e => setPaymentMethodFilter(e.target.value)}
          className="flex-1 bg-white border border-border-custom rounded-xl p-2.5 text-[10px] font-extrabold text-secondary-text focus:outline-none focus:border-primary-maroon/50 cursor-pointer"
        >
          <option value="ALL">All Methods</option>
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="OTHER">Other</option>
        </select>

        {/* Event Filter */}
        <select
          value={eventFilter}
          onChange={e => setEventFilter(e.target.value)}
          className="flex-1 bg-white border border-border-custom rounded-xl p-2.5 text-[10px] font-extrabold text-secondary-text focus:outline-none focus:border-primary-maroon/50 cursor-pointer"
        >
          <option value="ALL">All Events</option>
          {events.map(evt => (
            <option key={evt.id} value={evt.id}>{evt.name}</option>
          ))}
        </select>
      </div>

      {/* Contributor Rankings List */}
      {loading ? (
        <div className="flex-grow flex flex-col justify-center items-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-t-primary-maroon border-border-custom animate-spin" />
        </div>
      ) : rankedContributors.length === 0 ? (
        <div className="p-12 text-center text-secondary-text flex flex-col items-center justify-center gap-4 bg-white border border-border-custom rounded-3xl m-5 shadow-sm">
          {/* Lotus outline empty state element */}
          <div className="w-14 h-14 rounded-full bg-secondary-bg flex items-center justify-center text-antique-gold/60">
            <FileText className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-primary-maroon font-serif">No Contributions Recorded</h4>
            <p className="text-xs text-secondary-text mt-1.5 leading-relaxed max-w-[240px] mx-auto">
              Start your {selectedYear} contribution book by adding the first contribution.
            </p>
          </div>
          <button 
            onClick={openAddContribution}
            className="bg-primary-maroon text-white text-[11px] font-bold px-4.5 py-2.5 rounded-xl hover:bg-dark-maroon transition-all active:scale-95 cursor-pointer shadow"
          >
            + Add Contribution
          </button>
        </div>
      ) : (
        <div className="px-5 flex flex-col gap-3">
          {rankedContributors.map((cGroup, index) => {
            const isExpanded = expandedContributorId === cGroup.id;
            return (
              <div 
                key={cGroup.id}
                className="bg-white border border-border-custom rounded-2xl overflow-hidden transition-all shadow-sm"
              >
                {/* Accordion Row Header */}
                <div 
                  onClick={() => setExpandedContributorId(isExpanded ? null : cGroup.id)}
                  className="p-4 flex items-center justify-between active:bg-secondary-bg/30 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-secondary-bg border border-border-custom flex items-center justify-center text-[10px] font-black text-antique-gold shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <h4 className="text-xs font-black text-primary-text truncate">{cGroup.name}</h4>
                      {cGroup.phone && (
                        <span className="text-[9px] text-secondary-text font-bold flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-antique-gold" />
                          <span>{cGroup.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-black text-primary-maroon">₹{cGroup.totalAmount.toLocaleString()}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-secondary-text" /> : <ChevronDown className="w-4 h-4 text-secondary-text" />}
                  </div>
                </div>

                {/* Accordion Row Body (Contribution History) */}
                {isExpanded && (
                  <div className="border-t border-border-custom bg-secondary-bg/15 p-4 flex flex-col gap-3.5">
                    <h5 className="text-[9px] font-bold text-secondary-text uppercase tracking-widest">Contribution History</h5>
                    <div className="flex flex-col gap-2.5">
                      {cGroup.contributions.map(item => (
                        <div key={item.id} className="bg-white border border-border-custom p-3.5 rounded-xl flex items-center justify-between shadow-sm">
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-primary-text">₹{parseFloat(item.amount as any).toLocaleString()}</span>
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-primary-maroon/10 text-primary-maroon uppercase tracking-wider">{item.payment_method}</span>
                            </div>
                            
                            <div className="flex flex-col gap-0.5 text-[9px] text-secondary-text font-medium">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-antique-gold" />
                                <span>{item.date}</span>
                              </span>
                              {item.event && (
                                <span className="text-primary-text font-bold mt-0.5">Event: {item.event.name}</span>
                              )}
                              {item.transaction_id && (
                                <span className="font-mono text-[8px] text-secondary-text/80 mt-0.5">TXN: {item.transaction_id}</span>
                              )}
                              {item.notes && (
                                <p className="italic text-secondary-text mt-1 text-[9px]">"{item.notes}"</p>
                              )}
                            </div>
                          </div>

                          {/* Edit / Delete buttons */}
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <button 
                              onClick={() => openEditContribution(item)}
                              className="w-7 h-7 rounded-lg bg-white border border-border-custom flex items-center justify-center text-secondary-text hover:text-primary-maroon active:scale-90 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => triggerDelete(item)}
                              className="w-7 h-7 rounded-lg bg-error/10 border border-error/20 flex items-center justify-center text-error hover:bg-error hover:text-white active:scale-90 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-primary-text/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white border border-border-custom rounded-3xl p-5 w-full max-w-sm flex flex-col gap-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-error/10 border border-error/20 text-error flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-maroon font-serif">Delete this contribution?</h3>
              <p className="text-[11px] text-secondary-text mt-2 leading-relaxed">
                This will remove the contribution of <span className="font-extrabold text-primary-text">₹{parseFloat(contributionToDelete?.amount as any).toLocaleString()}</span> from {contributionToDelete?.contributor.name}. This action will affect the yearly contributor total and financial records.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 bg-white border border-border-custom hover:bg-secondary-bg py-3 rounded-xl text-xs font-extrabold text-secondary-text cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-error hover:bg-error/90 py-3 rounded-xl text-xs font-extrabold text-white cursor-pointer shadow-md shadow-error/10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Contribution Bottom Sheet */}
      <BottomSheet
        isOpen={isFormSheetOpen}
        onClose={() => setIsFormSheetOpen(false)}
        title={editingContribution ? "Edit Contribution" : "Add Contribution"}
      >
        <form onSubmit={handleSaveContribution} className="flex flex-col gap-4 relative">
          
          {/* Contributor Name with Autocomplete Suggestions */}
          <div className="flex flex-col gap-2 relative">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Contributor Name *</label>
            <input 
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={contributorName}
              onChange={e => handleNameChange(e.target.value)}
              className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon font-semibold text-primary-text placeholder:text-secondary-text/50"
            />

            {/* Suggestions Box */}
            {showSuggestions && (
              <div 
                ref={suggestionRef}
                className="absolute top-16 left-0 right-0 z-50 bg-white border border-border-custom rounded-xl overflow-hidden shadow-2xl flex flex-col"
              >
                {nameSuggestions.map(s => (
                  <div
                    key={`${s.type}-${s.id}`}
                    onClick={() => selectSuggestion(s)}
                    className="p-3 text-xs font-semibold hover:bg-secondary-bg cursor-pointer flex items-center justify-between border-b border-border-custom last:border-b-0"
                  >
                    <div className="flex flex-col">
                      <span className="text-primary-text">{s.name}</span>
                      {s.phone && <span className="text-[10px] text-secondary-text font-medium">{s.phone}</span>}
                    </div>
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                      s.type === 'member' ? 'bg-primary-maroon/10 text-primary-maroon' : 'bg-secondary-bg text-secondary-text border border-border-custom'
                    }`}>
                      {s.type === 'member' ? `Member (${s.tag})` : 'Contributor'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Phone Number (Optional)</label>
            <input 
              type="text"
              placeholder="e.g. +91 99000 88000"
              value={contributorPhone}
              onChange={e => setContributorPhone(e.target.value)}
              className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon font-semibold text-primary-text placeholder:text-secondary-text/50"
            />
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Amount * (₹)</label>
            <input 
              type="number"
              inputMode="numeric"
              placeholder="e.g. 5000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon font-mono font-bold text-primary-text placeholder:text-secondary-text/50"
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Date *</label>
            <input 
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon font-semibold text-primary-text"
            />
          </div>

          {/* Payment Method */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Payment Method</label>
            <div className="grid grid-cols-2 gap-2.5">
              {['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'].map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2.5 rounded-xl border text-[10px] font-extrabold transition-all uppercase cursor-pointer ${
                    paymentMethod === method
                      ? 'bg-primary-maroon text-white border-primary-maroon shadow-sm shadow-primary-maroon/10'
                      : 'bg-white border-border-custom text-secondary-text hover:bg-secondary-bg/50'
                  }`}
                >
                  {method.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction ID */}
          {paymentMethod !== 'CASH' && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Transaction ID (Optional)</label>
              <input 
                type="text"
                placeholder="e.g. TXN123456"
                value={transactionId}
                onChange={e => setTransactionId(e.target.value)}
                className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon font-semibold text-primary-text placeholder:text-secondary-text/50"
              />
            </div>
          )}

          {/* Purpose / Event */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Purpose / Event (Optional)</label>
            <select
              value={eventId}
              onChange={e => setEventId(e.target.value)}
              className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon font-semibold text-primary-text cursor-pointer"
            >
              <option value="">General Contribution</option>
              {events.map(evt => (
                <option key={evt.id} value={evt.id}>{evt.name}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Notes (Optional)</label>
            <textarea 
              rows={2}
              placeholder="Any additional remarks..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon font-medium text-primary-text placeholder:text-secondary-text/50 resize-none"
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
            className="w-full bg-primary-maroon text-white font-black text-xs py-3.5 rounded-xl mt-4 active:scale-[0.98] transition-all hover:bg-dark-maroon flex justify-center items-center shadow-lg shadow-primary-maroon/10 cursor-pointer"
          >
            {saving ? (
              <div className="w-4.5 h-4.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span>Save Contribution</span>
            )}
          </button>
        </form>
      </BottomSheet>

      {/* CSV Import Bottom Sheet */}
      <BottomSheet
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
        title="Import Historical Contributions"
      >
        <form onSubmit={handleCSVImport} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">CSV Data Input</label>
              <span className="text-[9px] text-secondary-text font-bold">Headers: year,name,amount,date,payment_method,event,notes</span>
            </div>
            <textarea 
              rows={6}
              placeholder="year,name,amount,date,payment_method,event,notes&#10;2026,Ravi Kumar,25000,2026-08-20,CASH,Vinayaka Chavithi,&#10;2026,Surya Teja,20000,2026-08-18,UPI,Vinayaka Chavithi,"
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              className="w-full bg-white border border-border-custom rounded-xl p-4 text-[10px] focus:outline-none focus:border-primary-maroon font-mono text-primary-text placeholder:text-secondary-text/50"
            />
          </div>

          <button 
            type="submit"
            disabled={importing || !csvText.trim()}
            className="w-full bg-primary-maroon text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 hover:bg-dark-maroon cursor-pointer shadow-md"
          >
            {importing ? (
              <div className="w-4.5 h-4.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Validate & Import</span>
              </>
            )}
          </button>

          {importLogs.length > 0 && (
            <div className="bg-secondary-bg border border-border-custom p-4 rounded-xl flex flex-col gap-1.5 max-h-48 overflow-y-auto no-scrollbar font-mono text-[9px] text-secondary-text shadow-inner">
              <span className="font-extrabold text-primary-maroon uppercase tracking-wider mb-1">Import Audit Log:</span>
              {importLogs.map((log, idx) => (
                <div key={idx} className={log.startsWith('Error') || log.includes('Failed') ? 'text-error font-semibold' : log.includes('Successfully') ? 'text-success font-semibold' : ''}>
                  {log}
                </div>
              ))}
            </div>
          )}
        </form>
      </BottomSheet>

    </div>
  );
};

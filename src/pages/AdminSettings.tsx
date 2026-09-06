import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BottomSheet } from '../components/BottomSheet';
import { 
  Settings, 
  LogOut, 
  UserCheck, 
  PlusCircle, 
  Edit2, 
  Trash2, 
  Globe, 
  Sparkles, 
  Image as ImageIcon, 
  Upload, 
  Save, 
  Plus, 
  ChevronDown, 
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface UserRecord {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuditLog {
  id: number;
  user_id: number | null;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}

interface PoojaDay {
  day: number;
  date: string;
  title: string;
  description: string;
  special_event?: string;
  time?: string;
}

interface DonorItem {
  id: number;
  name: string;
  title: string;
  amount?: string;
  details?: string;
  year?: string;
}

export const AdminSettings: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Bottom Sheet Form state for Users
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // User form fields
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('COMMITTEE');
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  // Receipt Template Configuration states
  const [orgName, setOrgName] = useState('వినాయక చవితి');
  const [orgSubtitle, setOrgSubtitle] = useState('నవరాత్రుల మహోత్సవములు');
  const [orgAssociation, setOrgAssociation] = useState('రాజోలు - నాగార్జున స్ట్రీట్');
  const [receiptPrefix, setReceiptPrefix] = useState('TG-CH');
  const [defaultPurpose, setDefaultPurpose] = useState('Ganapathi Utsav Contributions');
  const [signatureTitle, setSignatureTitle] = useState('సంతకం.');
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Festival Landing Page Management states
  const [festivalTitle, setFestivalTitle] = useState('శ్రీ గణేష్ ఉత్సవం 2026');
  const [festivalYear, setFestivalYear] = useState(2026);
  const [tagline, setTagline] = useState('టీమ్ గరుడ');
  const [subTagline, setSubTagline] = useState('మన వీధి • మన పండుగ • మన గర్వం');
  const [datesText, setDatesText] = useState('సెప్టెంబర్ 15 – సెప్టెంబర్ 23, 2026');
  const [locationText, setLocationText] = useState('నాగార్జున స్ట్రీట్, రాజోలు');
  const [statusText, setStatusText] = useState('వైభవంగా కొనసాగుతోంది');
  const [idolImageUrl, setIdolImageUrl] = useState('/ganesh_idol_2026.jpg');
  const [poojas, setPoojas] = useState<PoojaDay[]>([]);
  const [ladduDonors, setLadduDonors] = useState<DonorItem[]>([]);
  const [idolDonors, setIdolDonors] = useState<DonorItem[]>([]);
  
  const [loadingFest, setLoadingFest] = useState(false);
  const [savingFest, setSavingFest] = useState(false);
  const [festSuccess, setFestSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Collapsible sections
  const [showPoojasSection, setShowPoojasSection] = useState(false);
  const [showDonorsSection, setShowDonorsSection] = useState(false);

  // Audit Logs State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/committee/audit-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUsersList(await res.json());
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchReceiptSettings = async () => {
    if (!token) return;
    setLoadingSettings(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/finance/receipt-settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrgName(data.org_name);
        setOrgSubtitle(data.org_subtitle);
        setOrgAssociation(data.org_association);
        setReceiptPrefix(data.receipt_prefix);
        setDefaultPurpose(data.default_purpose);
        setSignatureTitle(data.signature_title);
        setLogoUrl(data.logo_url || '/logo.png');
      }
    } catch (err) {
      console.error('Error fetching receipt settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchFestivalInfo = async () => {
    setLoadingFest(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/public/festival-info`);
      if (res.ok) {
        const data = await res.json();
        setFestivalTitle(data.festival_title);
        setFestivalYear(data.festival_year);
        setTagline(data.tagline);
        setSubTagline(data.sub_tagline);
        setDatesText(data.dates_text);
        setLocationText(data.location_text);
        setStatusText(data.status_text);
        setIdolImageUrl(data.idol_image_url || '/ganesh_idol_2026.jpg');
        try { setPoojas(JSON.parse(data.pooja_schedule)); } catch { /* ignore */ }
        try { setLadduDonors(JSON.parse(data.laddu_donors)); } catch { /* ignore */ }
        try { setIdolDonors(JSON.parse(data.idol_donors)); } catch { /* ignore */ }
      }
    } catch (err) {
      console.error('Error fetching festival info:', err);
    } finally {
      setLoadingFest(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchReceiptSettings();
    fetchFestivalInfo();
    fetchLogs();
  }, [token, isAdmin]);

  const handleSaveFestivalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFest(true);
    setFestSuccess(false);

    try {
      const payload = {
        festival_title: festivalTitle.trim(),
        festival_year: festivalYear,
        tagline: tagline.trim(),
        sub_tagline: subTagline.trim(),
        dates_text: datesText.trim(),
        location_text: locationText.trim(),
        status_text: statusText.trim(),
        idol_image_url: idolImageUrl.trim(),
        pooja_schedule: JSON.stringify(poojas),
        laddu_donors: JSON.stringify(ladduDonors),
        idol_donors: JSON.stringify(idolDonors)
      };

      const res = await fetch(`${API_BASE_URL}/api/admin/festival-info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setFestSuccess(true);
        setTimeout(() => setFestSuccess(false), 3000);
      } else {
        alert('Failed to save festival information.');
      }
    } catch (err) {
      console.error('Error saving festival info:', err);
      alert('Network error while saving festival info.');
    } finally {
      setSavingFest(false);
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingImage(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/upload-idol-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setIdolImageUrl(data.file_url);
        alert('Idol image uploaded successfully! Click Save to apply changes.');
      } else {
        alert('Image upload failed.');
      }
    } catch (err) {
      console.error('Error uploading idol image:', err);
      alert('Network error while uploading image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePoojaChange = (index: number, field: keyof PoojaDay, value: string) => {
    const updated = [...poojas];
    updated[index] = { ...updated[index], [field]: value };
    setPoojas(updated);
  };

  const handleAddLadduDonor = () => {
    const newDonor: DonorItem = {
      id: Date.now(),
      name: 'నూతన దాత',
      title: 'లడ్డు దాత',
      amount: 'లడ్డూ ప్రసాదం',
      year: String(festivalYear)
    };
    setLadduDonors([...ladduDonors, newDonor]);
  };

  const handleRemoveLadduDonor = (id: number) => {
    setLadduDonors(ladduDonors.filter(d => d.id !== id));
  };

  const handleLadduDonorChange = (index: number, field: keyof DonorItem, value: string) => {
    const updated = [...ladduDonors];
    updated[index] = { ...updated[index], [field]: value };
    setLadduDonors(updated);
  };

  const handleAddIdolDonor = () => {
    const newDonor: DonorItem = {
      id: Date.now(),
      name: 'నూతన దాత',
      title: 'విగ్రహ సమర్పణ దాత',
      details: 'మంటప సహకారం',
      year: String(festivalYear)
    };
    setIdolDonors([...idolDonors, newDonor]);
  };

  const handleRemoveIdolDonor = (id: number) => {
    setIdolDonors(idolDonors.filter(d => d.id !== id));
  };

  const handleIdolDonorChange = (index: number, field: keyof DonorItem, value: string) => {
    const updated = [...idolDonors];
    updated[index] = { ...updated[index], [field]: value };
    setIdolDonors(updated);
  };

  const handleSaveReceiptSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/receipt-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          org_name: orgName.trim(),
          org_subtitle: orgSubtitle.trim(),
          org_association: orgAssociation.trim(),
          receipt_prefix: receiptPrefix.trim(),
          default_purpose: defaultPurpose.trim(),
          signature_title: signatureTitle.trim(),
          logo_url: logoUrl.trim()
        })
      });
      if (res.ok) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      } else {
        alert('Failed to save receipt settings.');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Network error saving settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const openAddUserSheet = () => {
    setFormError('');
    setEditingUser(null);
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('COMMITTEE');
    setIsSheetOpen(true);
  };

  const openEditUserSheet = (usr: UserRecord) => {
    setFormError('');
    setEditingUser(usr);
    setNewUsername(usr.username);
    setNewEmail(usr.email);
    setNewPassword('');
    setNewRole(usr.role);
    setIsSheetOpen(true);
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const errData = await res.json();
        setFormError(errData.detail || 'Failed to delete user.');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim() || (!editingUser && !newPassword.trim())) {
      setFormError('Please fill out all required fields.');
      return;
    }
    setFormError('');
    setSaving(true);

    try {
      const url = editingUser 
        ? `${API_BASE_URL}/api/admin/users/${editingUser.id}`
        : `${API_BASE_URL}/api/admin/users`;
        
      const method = editingUser ? 'PUT' : 'POST';
      
      const payload: any = {
        username: newUsername.trim(),
        email: newEmail.trim(),
        role: newRole
      };
      if (newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsSheetOpen(false);
        fetchUsers();
      } else {
        const errData = await res.json();
        setFormError(errData.detail || 'Failed to save user.');
      }
    } catch (err) {
      setFormError('Network error. Check database backend.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-primary-bg text-primary-text overflow-y-auto no-scrollbar pb-10">
      
      {/* Header Bar */}
      <div className="h-16 px-5 shrink-0 flex items-center justify-between border-b border-border-custom bg-white/95 backdrop-blur sticky top-0 z-30">
        <div>
          <h2 className="text-base font-bold tracking-tight text-primary-maroon font-serif">More & Settings</h2>
          <span className="text-[10px] text-secondary-text font-bold uppercase tracking-wider">Committee Management Panel</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-secondary-bg border border-border-custom flex items-center justify-center">
          <Settings className="w-4 h-4 text-antique-gold" />
        </div>
      </div>

      {/* Main Settings Body */}
      <div className="px-5 pt-4 flex flex-col gap-5">
        
        {/* Quick View Public Website Banner */}
        <div 
          onClick={() => navigate('/')}
          className="bg-gradient-to-r from-[#FFF4DF] to-[#FDE8C7] border-2 border-[#E9D0A7] p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-sm cursor-pointer hover:shadow-md active:scale-98 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EA580C] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h4 className="text-xs font-black text-[#7C2D12]">ప్రజా వెబ్‌సైట్ చూడండి (Public Landing Page)</h4>
              <span className="text-[10px] font-semibold text-[#92400E]">మన వీధి గణేష్ ఉత్సవ హోంపేజీని చూడటానికి ఇక్కడ క్లిక్ చేయండి</span>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-[#EA580C] shrink-0" />
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-border-custom p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary-maroon/10 border border-primary-maroon/20 flex items-center justify-center text-primary-maroon shrink-0">
            <UserCheck className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-extrabold text-primary-text">{user?.username}</h3>
            <p className="text-[10px] text-secondary-text mt-0.5 font-medium">{user?.email}</p>
          </div>
          <span className="text-[9px] font-extrabold bg-primary-maroon/10 border border-primary-maroon/20 text-primary-maroon px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
            {user?.role}
          </span>
        </div>

        {/* ========================================================= */}
        {/* FESTIVAL LANDING PAGE SETTINGS (Admin & Committee) */}
        {/* ========================================================= */}
        <div className="bg-white border border-border-custom rounded-2xl p-4 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border-custom/60 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#EA580C]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-primary-text">
                గణేష్ ఉత్సవ వివరాలు & విగ్రహ ఫోటో (Landing Page)
              </h4>
            </div>
          </div>

          {loadingFest ? (
            <div className="py-8 flex justify-center items-center">
              <div className="w-6 h-6 rounded-full border-2 border-t-[#EA580C] border-[#F2E8D5] animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSaveFestivalInfo} className="flex flex-col gap-4 text-left">
              
              {/* Idol Photo Upload & Preview */}
              <div className="flex flex-col gap-2 bg-[#FFFDF8] border border-[#F2E8D5] p-3 rounded-2xl">
                <label className="text-[10px] font-bold text-[#7C2D12] uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>ఈ సంవత్సరం స్వామివారి విగ్రహ ఫోటో (Ganesh Idol Image)</span>
                </label>

                <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#2D1609] border border-[#E9D0A7] shrink-0 shadow-inner">
                  <img 
                    src={idolImageUrl || '/ganesh_idol_2026.jpg'} 
                    alt="Current Idol" 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/ganesh_idol_2026.jpg'; }}
                  />
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <label className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#EA580C] bg-[#EA580C]/10 hover:bg-[#EA580C]/20 border border-[#EA580C]/30 px-3 py-2 rounded-xl cursor-pointer transition-all active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'అప్‌లోడ్ అవుతోంది...' : 'కొత్త ఫోటో అప్‌లోడ్ చేయండి'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageFileUpload}
                      disabled={uploadingImage}
                      className="hidden" 
                    />
                  </label>
                  
                  <input 
                    type="text" 
                    value={idolImageUrl}
                    onChange={e => setIdolImageUrl(e.target.value)}
                    placeholder="లేదా ఫోటో URL ఎంటర్ చేయండి"
                    className="w-full bg-secondary-bg border border-border-custom rounded-xl px-2.5 py-1.5 text-[10px] font-mono focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              </div>
            </div>

            {/* Basic Festival Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-secondary-text uppercase">Festival Title</label>
                <input 
                  type="text"
                  value={festivalTitle}
                  onChange={e => setFestivalTitle(e.target.value)}
                  className="bg-secondary-bg border border-border-custom rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary-maroon"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-secondary-text uppercase">Festival Year</label>
                <input 
                  type="number"
                  value={festivalYear}
                  onChange={e => setFestivalYear(Number(e.target.value))}
                  className="bg-secondary-bg border border-border-custom rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary-maroon font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-secondary-text uppercase">Tagline</label>
                <input 
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  className="bg-secondary-bg border border-border-custom rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary-maroon"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-secondary-text uppercase">Status Badge</label>
                <input 
                  type="text"
                  value={statusText}
                  onChange={e => setStatusText(e.target.value)}
                  className="bg-secondary-bg border border-border-custom rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary-maroon"
                />
              </div>

              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-[9px] font-bold text-secondary-text uppercase">Sub-Tagline</label>
                <input 
                  type="text"
                  value={subTagline}
                  onChange={e => setSubTagline(e.target.value)}
                  className="bg-secondary-bg border border-border-custom rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary-maroon"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-secondary-text uppercase">Festival Dates</label>
                <input 
                  type="text"
                  value={datesText}
                  onChange={e => setDatesText(e.target.value)}
                  className="bg-secondary-bg border border-border-custom rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary-maroon"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-secondary-text uppercase">Location</label>
                <input 
                  type="text"
                  value={locationText}
                  onChange={e => setLocationText(e.target.value)}
                  className="bg-secondary-bg border border-border-custom rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary-maroon"
                />
              </div>
            </div>

            {/* 9 Days Pooja Schedule Collapsible Editor */}
            <div className="border border-border-custom rounded-2xl overflow-hidden">
              <div 
                onClick={() => setShowPoojasSection(!showPoojasSection)}
                className="p-3 bg-[#FAF3E2] flex items-center justify-between cursor-pointer"
              >
                <span className="text-xs font-black text-[#7C2D12]">
                  🪔 9 రోజుల పూజా కార్యక్రమాలు ({poojas.length} Days)
                </span>
                {showPoojasSection ? <ChevronUp className="w-4 h-4 text-[#7C2D12]" /> : <ChevronDown className="w-4 h-4 text-[#7C2D12]" />}
              </div>

              {showPoojasSection && (
                <div className="p-3 flex flex-col gap-3 max-h-72 overflow-y-auto no-scrollbar">
                  {poojas.map((p, idx) => (
                    <div key={p.day} className="bg-[#FFFDF8] border border-[#F0DFC6] p-2.5 rounded-xl flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-[#EA580C]">Day {p.day}</span>
                        <input 
                          type="text"
                          value={p.date}
                          onChange={e => handlePoojaChange(idx, 'date', e.target.value)}
                          placeholder="Date"
                          className="bg-secondary-bg border border-border-custom rounded-lg px-2 py-0.5 text-[10px] w-28"
                        />
                      </div>
                      <input 
                        type="text"
                        value={p.title}
                        onChange={e => handlePoojaChange(idx, 'title', e.target.value)}
                        placeholder="Pooja Title"
                        className="bg-secondary-bg border border-border-custom rounded-lg px-2 py-1 text-xs font-bold"
                      />
                      <textarea 
                        value={p.description}
                        onChange={e => handlePoojaChange(idx, 'description', e.target.value)}
                        placeholder="Description & Rituals"
                        rows={2}
                        className="bg-secondary-bg border border-border-custom rounded-lg px-2 py-1 text-[11px]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text"
                          value={p.special_event || ''}
                          onChange={e => handlePoojaChange(idx, 'special_event', e.target.value)}
                          placeholder="Special Event (Optional)"
                          className="bg-secondary-bg border border-border-custom rounded-lg px-2 py-1 text-[10px]"
                        />
                        <input 
                          type="text"
                          value={p.time || ''}
                          onChange={e => handlePoojaChange(idx, 'time', e.target.value)}
                          placeholder="Time (e.g. 7:00 PM)"
                          className="bg-secondary-bg border border-border-custom rounded-lg px-2 py-1 text-[10px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Laddu & Idol Donors Manager */}
            <div className="border border-border-custom rounded-2xl overflow-hidden">
              <div 
                onClick={() => setShowDonorsSection(!showDonorsSection)}
                className="p-3 bg-[#FAF3E2] flex items-center justify-between cursor-pointer"
              >
                <span className="text-xs font-black text-[#7C2D12]">
                  🥥 లడ్డు & విగ్రహ దాతల నిర్వహణ
                </span>
                {showDonorsSection ? <ChevronUp className="w-4 h-4 text-[#7C2D12]" /> : <ChevronDown className="w-4 h-4 text-[#7C2D12]" />}
              </div>

              {showDonorsSection && (
                <div className="p-3 flex flex-col gap-4">
                  
                  {/* Laddu Donors */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#EA580C]">లడ్డు దాతలు ({ladduDonors.length})</span>
                      <button 
                        type="button"
                        onClick={handleAddLadduDonor}
                        className="text-[10px] font-bold text-[#EA580C] flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>దాతను జోడించండి</span>
                      </button>
                    </div>

                    {ladduDonors.map((d, idx) => (
                      <div key={d.id} className="bg-secondary-bg p-2.5 rounded-xl border border-border-custom flex items-center gap-2">
                        <input 
                          type="text"
                          value={d.name}
                          onChange={e => handleLadduDonorChange(idx, 'name', e.target.value)}
                          placeholder="దాత పేరు"
                          className="flex-1 bg-white border border-border-custom rounded-lg px-2 py-1 text-xs font-semibold"
                        />
                        <input 
                          type="text"
                          value={d.amount || ''}
                          onChange={e => handleLadduDonorChange(idx, 'amount', e.target.value)}
                          placeholder="వివరాలు/నైవేద్యం"
                          className="w-32 bg-white border border-border-custom rounded-lg px-2 py-1 text-[10px]"
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveLadduDonor(d.id)}
                          className="p-1 text-error hover:bg-error/10 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Idol Donors */}
                  <div className="flex flex-col gap-2 border-t border-border-custom pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#7C2D12]">వినాయక విగ్రహ దాతలు ({idolDonors.length})</span>
                      <button 
                        type="button"
                        onClick={handleAddIdolDonor}
                        className="text-[10px] font-bold text-[#7C2D12] flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>దాతను జోడించండి</span>
                      </button>
                    </div>

                    {idolDonors.map((d, idx) => (
                      <div key={d.id} className="bg-secondary-bg p-2.5 rounded-xl border border-border-custom flex items-center gap-2">
                        <input 
                          type="text"
                          value={d.name}
                          onChange={e => handleIdolDonorChange(idx, 'name', e.target.value)}
                          placeholder="దాత పేరు"
                          className="flex-1 bg-white border border-border-custom rounded-lg px-2 py-1 text-xs font-semibold"
                        />
                        <input 
                          type="text"
                          value={d.details || ''}
                          onChange={e => handleIdolDonorChange(idx, 'details', e.target.value)}
                          placeholder="వివరాలు"
                          className="w-32 bg-white border border-border-custom rounded-lg px-2 py-1 text-[10px]"
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveIdolDonor(d.id)}
                          className="p-1 text-error hover:bg-error/10 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={savingFest}
              className="w-full bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-xs py-3 rounded-xl active:scale-95 transition-all shadow-md flex justify-center items-center gap-1.5 cursor-pointer"
            >
              {savingFest ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : festSuccess ? (
                <span className="text-white font-black flex items-center gap-1">✓ వివరాలు విజయవంతంగా సేవ్ అయ్యాయి</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>ఉత్సవ సమాచారాన్ని సేవ్ చేయండి (Save Landing Page)</span>
                </>
              )}
            </button>
          </form>
          )}
        </div>

        {/* Users & Committee Management Section */}
        {isAdmin && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-secondary-text">Users & Committee</h4>
              <button 
                onClick={openAddUserSheet}
                className="text-[10px] font-bold text-primary-maroon flex items-center gap-1 hover:underline cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create User</span>
              </button>
            </div>

            {loadingUsers ? (
              <div className="py-6 flex justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-t-primary-maroon border-border-custom animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {usersList.map(usr => (
                  <div key={usr.id} className="bg-white border border-border-custom px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-extrabold text-primary-text">{usr.username}</h5>
                        <span className={`text-[7px] font-extrabold px-1.5 py-0.2 rounded uppercase border ${
                          usr.role === 'ADMIN' 
                            ? 'bg-primary-maroon/10 border-primary-maroon/20 text-primary-maroon' 
                            : 'bg-secondary-bg border-border-custom text-secondary-text'
                        }`}>
                          {usr.role}
                        </span>
                      </div>
                      <span className="text-[9px] text-secondary-text font-medium font-mono block mt-0.5 truncate">{usr.email}</span>
                    </div>
                    
                    {/* User Edit/Delete Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openEditUserSheet(usr)}
                        className="p-1.5 rounded-lg bg-secondary-bg border border-border-custom text-secondary-text hover:text-primary-maroon active:scale-90 transition-all cursor-pointer"
                        title="Edit Credentials"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      
                      {usr.username !== 'admin' && usr.id !== user?.id && (
                        <button
                          onClick={() => handleDeleteUser(usr.id)}
                          className="p-1.5 rounded-lg bg-secondary-bg border border-border-custom text-secondary-text hover:text-error active:scale-90 transition-all cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Receipt Settings Section (Only visible to Admin) */}
        {isAdmin && (
          <div className="flex flex-col gap-3">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-secondary-text">Receipt Template Settings</h4>
            {loadingSettings ? (
              <div className="py-4 flex justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-t-primary-maroon border-border-custom animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSaveReceiptSettings} className="bg-white border border-border-custom p-4 rounded-2xl flex flex-col gap-3.5 shadow-sm text-left">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-secondary-text uppercase tracking-wider">Receipt Main Header (Telugu)</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    className="w-full bg-secondary-bg border border-border-custom rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-secondary-text uppercase tracking-wider">Receipt Sub-Header (Telugu)</label>
                  <input
                    type="text"
                    value={orgSubtitle}
                    onChange={e => setOrgSubtitle(e.target.value)}
                    className="w-full bg-secondary-bg border border-border-custom rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-secondary-text uppercase tracking-wider">Association Name (Telugu Yellow Text)</label>
                  <input
                    type="text"
                    value={orgAssociation}
                    onChange={e => setOrgAssociation(e.target.value)}
                    className="w-full bg-secondary-bg border border-border-custom rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-secondary-text uppercase tracking-wider">Receipt ID Prefix</label>
                    <input
                      type="text"
                      value={receiptPrefix}
                      onChange={e => setReceiptPrefix(e.target.value)}
                      className="w-full bg-secondary-bg border border-border-custom rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-secondary-text uppercase tracking-wider">Default Purpose</label>
                    <input
                      type="text"
                      value={defaultPurpose}
                      onChange={e => setDefaultPurpose(e.target.value)}
                      className="w-full bg-secondary-bg border border-border-custom rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-secondary-text uppercase tracking-wider">Signature / Seal Title</label>
                  <input
                    type="text"
                    value={signatureTitle}
                    onChange={e => setSignatureTitle(e.target.value)}
                    className="w-full bg-secondary-bg border border-border-custom rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-secondary-text uppercase tracking-wider">Logo URL / Path</label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={e => setLogoUrl(e.target.value)}
                    className="w-full bg-secondary-bg border border-border-custom rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full bg-primary-maroon hover:bg-dark-maroon text-white font-extrabold text-xs py-2.5 rounded-xl mt-1 active:scale-95 transition-all shadow-md flex justify-center items-center cursor-pointer"
                >
                  {savingSettings ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : settingsSuccess ? (
                    <span className="text-success font-black flex items-center gap-1">✓ Settings Saved Successfully</span>
                  ) : (
                    <span>Save Receipt Settings</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* System Activity History Section */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-secondary-text">System Activity History</h4>
            <button 
              onClick={fetchLogs}
              disabled={loadingLogs}
              className="text-[9px] font-black text-primary-maroon uppercase tracking-wider hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Refresh</span>
            </button>
          </div>

          <div className="bg-white border border-border-custom rounded-2xl p-4 shadow-sm max-h-[300px] overflow-y-auto flex flex-col gap-3 scrollbar-thin">
            {loadingLogs && logs.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-t-primary-maroon border-border-custom animate-spin" />
                <span className="text-[9px] text-secondary-text font-bold uppercase tracking-wider">Loading history logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-8 text-center text-secondary-text font-semibold text-xs">
                No activity history records found.
              </div>
            ) : (
              logs.map((log) => {
                const logTime = new Date(log.timestamp).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                return (
                  <div key={log.id} className="flex flex-col gap-1 border-b border-border-custom/50 pb-2.5 last:border-b-0 last:pb-0 text-left">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-extrabold text-primary-text">
                        {log.username}
                      </span>
                      <span className="text-[8px] font-bold text-secondary-text uppercase tracking-wider shrink-0">
                        {logTime}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 items-center mt-0.5">
                      <span className="text-[8px] font-black uppercase tracking-widest bg-primary-maroon/10 border border-primary-maroon/20 text-primary-maroon px-1.5 py-0.2 rounded shrink-0">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <p className="text-[11px] font-medium text-secondary-text leading-tight flex-1">
                        {log.details}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Configuration list options */}
        <div className="flex flex-col gap-2.5">
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-secondary-text">Account Settings</h4>

          <div className="bg-white border border-border-custom rounded-2xl overflow-hidden shadow-sm">
            <button 
              onClick={logout}
              className="w-full px-5 py-4 flex items-center gap-4 text-error hover:bg-error/5 active:bg-error/10 transition-all text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-extrabold">Sign Out / Clear Session</span>
            </button>
          </div>
        </div>

      </div>

      {/* Add User Sheet Drawer */}
      <BottomSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingUser ? "Edit User Credentials" : "Register New User"}
      >
        <form onSubmit={handleAddUser} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Username</label>
            <input 
              type="text" 
              required
              placeholder="e.g. 9398255539 or member name"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              className="w-full bg-secondary-bg border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="e.g. member@teamgaruda.in"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="w-full bg-secondary-bg border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold font-mono"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">
              {editingUser ? "New Password (Leave empty to keep existing)" : "Password"}
            </label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-secondary-bg border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Role Assignment</label>
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              className="w-full bg-secondary-bg border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold"
            >
              <option value="COMMITTEE">COMMITTEE (Standard Member)</option>
              <option value="ADMIN">ADMIN (Full Privileges)</option>
            </select>
          </div>

          {formError && (
            <div className="bg-error/10 border border-error/20 text-error text-[10px] p-3 rounded-xl font-semibold">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary-maroon hover:bg-dark-maroon text-white font-extrabold text-xs py-3.5 rounded-xl mt-2 active:scale-95 transition-all shadow-md flex justify-center items-center cursor-pointer"
          >
            {saving ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span>{editingUser ? "Update User" : "Create User"}</span>
            )}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
};

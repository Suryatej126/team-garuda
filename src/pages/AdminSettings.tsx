import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BottomSheet } from '../components/BottomSheet';
import { Settings, LogOut, UserCheck, PlusCircle, Edit2, Trash2 } from 'lucide-react';
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

export const AdminSettings: React.FC = () => {
  const { user, token, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Bottom Sheet Form state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form fields
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

  const handleSaveSettings = async (e: React.FormEvent) => {
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

  useEffect(() => {
    fetchUsers();
    fetchReceiptSettings();
    fetchLogs();
  }, [token, isAdmin]);


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
      <div className="px-5 pt-5 flex flex-col gap-6">
        
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

        {/* Admin Management Section */}
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
              <form onSubmit={handleSaveSettings} className="bg-white border border-border-custom p-4 rounded-2xl flex flex-col gap-3.5 shadow-sm text-left">
                
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
              placeholder="e.g. naveen" 
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold placeholder:text-secondary-text/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Email Address</label>
            <input 
              type="email" 
              placeholder="e.g. naveen@teamgaruda.in" 
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold placeholder:text-secondary-text/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">
              {editingUser ? "New Password (Optional)" : "Initial Password"}
            </label>
            <input 
              type="password" 
              placeholder={editingUser ? "Leave empty to keep current password" : "••••••••"} 
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text placeholder:text-secondary-text/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Authority Role</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setNewRole('COMMITTEE')}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  newRole === 'COMMITTEE' 
                    ? 'bg-primary-maroon text-white border-primary-maroon shadow-sm' 
                    : 'bg-white border-border-custom text-secondary-text hover:bg-secondary-bg/50'
                }`}
              >
                Committee
              </button>
              
              <button
                type="button"
                onClick={() => setNewRole('ADMIN')}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  newRole === 'ADMIN' 
                    ? 'bg-dark-maroon text-white border-dark-maroon shadow-sm' 
                    : 'bg-white border-border-custom text-secondary-text hover:bg-secondary-bg/50'
                }`}
              >
                Administrator
              </button>
            </div>
          </div>

          {formError && (
            <div className="bg-error/10 border border-error/20 text-error text-[10px] px-3.5 py-3 rounded-xl">
              {formError}
            </div>
          )}

          <button 
            type="submit"
            disabled={saving}
            className="w-full bg-primary-maroon text-white font-extrabold text-xs py-3.5 rounded-xl mt-4 active:scale-[0.98] transition-all hover:bg-dark-maroon flex justify-center items-center shadow-lg shadow-primary-maroon/10 cursor-pointer"
          >
            {saving ? (
              <div className="w-4.5 h-4.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span>{editingUser ? "Save Changes" : "Create User"}</span>
            )}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BottomSheet } from '../components/BottomSheet';
import { Settings, LogOut, UserCheck, PlusCircle } from 'lucide-react';

interface UserRecord {
  id: number;
  username: string;
  email: string;
  role: string;
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

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    try {
      const res = await fetch('http://localhost:8000/api/admin/users', {
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

  useEffect(() => {
    fetchUsers();
  }, [token, isAdmin]);

  const openAddUserSheet = () => {
    setFormError('');
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('COMMITTEE');
    setIsSheetOpen(true);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      setFormError('Please fill out all fields.');
      return;
    }
    setFormError('');
    setSaving(true);

    try {
      const res = await fetch('http://localhost:8000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUsername,
          email: newEmail,
          password: newPassword,
          role: newRole
        })
      });

      if (res.ok) {
        setIsSheetOpen(false);
        fetchUsers();
      } else {
        const errData = await res.json();
        setFormError(errData.detail || 'Failed to create user.');
      }
    } catch (err) {
      setFormError('Network error. Check database backend.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-primary-bg text-primary-text overflow-y-auto no-scrollbar pb-6">
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
                    <div className="min-w-0">
                      <h5 className="text-xs font-extrabold text-primary-text">{usr.username}</h5>
                      <span className="text-[9px] text-secondary-text font-medium font-mono">{usr.email}</span>
                    </div>
                    <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded uppercase border ${
                      usr.role === 'ADMIN' 
                        ? 'bg-primary-maroon/10 border-primary-maroon/20 text-primary-maroon' 
                        : 'bg-secondary-bg border-border-custom text-secondary-text'
                    }`}>
                      {usr.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
        title="Register New User"
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
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Initial Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
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
              <span>Create User</span>
            )}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
};

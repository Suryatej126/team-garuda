import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BottomSheet } from '../components/BottomSheet';
import { Film, Image as ImageIcon, Plus, Trash2, Paperclip } from 'lucide-react';

interface Event {
  id: number;
  name: string;
}

interface MediaItem {
  id: number;
  event_id: number;
  type: string;
  file_url: string;
  caption: string;
  event?: { name: string };
}

export const MediaManagement: React.FC = () => {
  const { token } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form fields
  const [mEventId, setMEventId] = useState('');
  const [mType, setMType] = useState('PHOTO');
  const [mCaption, setMCaption] = useState('');
  const [mFile, setMFile] = useState<File | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/public/media');
      if (res.ok) {
        setMedia(await res.json());
      }
    } catch (err) {
      console.error('Error fetching media:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/public/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        if (data.length > 0) {
          setMEventId(String(data[0].id));
        }
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  useEffect(() => {
    fetchMedia();
    fetchEvents();
  }, [token]);

  const openUploadSheet = () => {
    setFormError('');
    setMCaption('');
    setMFile(null);
    setIsSheetOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this media item from the public gallery?')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/committee/media/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchMedia();
      }
    } catch (err) {
      console.error('Error deleting media:', err);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mEventId || !mFile) {
      setFormError('Please select an event and choose a file to upload.');
      return;
    }
    setFormError('');
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('event_id', mEventId);
      formData.append('type', mType);
      formData.append('caption', mCaption);
      formData.append('file', mFile);

      const res = await fetch('http://localhost:8000/api/committee/media', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setIsSheetOpen(false);
        fetchMedia();
      } else {
        const errData = await res.json();
        setFormError(errData.detail || 'Upload failed.');
      }
    } catch (err) {
      setFormError('Network error. Check server upload settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-primary-bg text-primary-text overflow-y-auto no-scrollbar pb-6 relative">
      {/* Header Bar */}
      <div className="h-16 px-5 shrink-0 flex items-center justify-between border-b border-border-custom bg-white/95 backdrop-blur sticky top-0 z-30">
        <div>
          <h2 className="text-base font-bold tracking-tight text-primary-maroon font-serif">Gallery Management</h2>
          <span className="text-[10px] text-secondary-text font-bold uppercase tracking-wider">Manage Public Photos & Videos</span>
        </div>
        <button 
          onClick={openUploadSheet}
          className="w-9 h-9 rounded-full bg-primary-maroon text-white border border-light-gold flex items-center justify-center hover:bg-dark-maroon active:scale-95 transition-all cursor-pointer shadow-md"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Grid view */}
      {loading ? (
        <div className="flex-grow flex flex-col justify-center items-center py-10">
          <div className="w-8 h-8 rounded-full border-2 border-t-primary-maroon border-border-custom animate-spin" />
        </div>
      ) : media.length === 0 ? (
        <div className="flex-grow flex flex-col justify-center items-center p-6 m-5 text-center text-secondary-text bg-white border border-border-custom rounded-3xl shadow-sm py-16">
          <ImageIcon className="w-12 h-12 text-antique-gold stroke-[1.5] mb-3" />
          <p className="text-xs font-bold text-primary-maroon font-serif">No Media Uploaded</p>
          <span className="text-[10px] text-secondary-text mt-1">Upload your first event photo or video.</span>
        </div>
      ) : (
        <div className="px-5 pt-4 grid grid-cols-2 gap-4">
          {media.map(item => (
            <div 
              key={item.id} 
              className="relative aspect-square rounded-2xl overflow-hidden border border-border-custom bg-secondary-bg group shadow-sm"
            >
              <img 
                src={item.file_url} 
                alt={item.caption}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-maroon/85 via-primary-maroon/20 to-transparent" />
              
              {/* Type overlay */}
              <div className="absolute top-2.5 left-2.5 bg-white/85 backdrop-blur px-2 py-0.5 rounded-full text-[8px] font-extrabold text-primary-maroon uppercase tracking-wider border border-border-custom/30">
                {item.type}
              </div>

              {/* Action delete button */}
              <button 
                onClick={() => handleDelete(item.id)}
                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 border border-border-custom flex items-center justify-center text-error active:scale-90 shadow-md cursor-pointer hover:bg-error hover:text-white transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Caption details */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-col gap-0.5 min-w-0">
                <span className="text-[9px] text-antique-gold font-extrabold truncate">
                  {item.event?.name || "Garuda Event"}
                </span>
                <span className="text-[9px] font-semibold text-white truncate">
                  {item.caption || "Community Moment"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Media Bottom Sheet */}
      <BottomSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Upload Media Moment"
      >
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Select Event Reference</label>
            <select
              value={mEventId}
              onChange={e => setMEventId(e.target.value)}
              className="w-full bg-white border border-border-custom rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold cursor-pointer"
            >
              <option value="">-- Choose Event --</option>
              {events.map(evt => (
                <option key={evt.id} value={evt.id}>{evt.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Media File Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMType('PHOTO')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  mType === 'PHOTO' 
                    ? 'bg-primary-maroon text-white border-primary-maroon shadow-sm' 
                    : 'bg-white border-border-custom text-secondary-text hover:bg-secondary-bg/50'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Photo</span>
              </button>
              
              <button
                type="button"
                onClick={() => setMType('VIDEO')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  mType === 'VIDEO' 
                    ? 'bg-primary-maroon text-white border-primary-maroon shadow-sm' 
                    : 'bg-white border-border-custom text-secondary-text hover:bg-secondary-bg/50'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>Video</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Choose File</label>
            <label className="w-full bg-white border border-border-custom border-dashed rounded-xl px-4 py-8 text-center cursor-pointer hover:border-primary-maroon transition-all flex flex-col items-center justify-center gap-2 shadow-sm">
              <input 
                type="file" 
                accept={mType === 'PHOTO' ? "image/*" : "video/*"}
                onChange={e => setMFile(e.target.files ? e.target.files[0] : null)}
                className="hidden" 
              />
              <Paperclip className="w-6 h-6 text-antique-gold" />
              <span className="text-xs font-semibold text-primary-text">
                {mFile ? mFile.name : "Tap to select photo or video"}
              </span>
              <span className="text-[9px] text-secondary-text">Up to 20MB supported</span>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Caption / Description</label>
            <input 
              type="text"
              placeholder="e.g. Traditional Aarti Ceremony..."
              value={mCaption}
              onChange={e => setMCaption(e.target.value)}
              className="w-full bg-white border border-border-custom rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-maroon text-primary-text font-semibold placeholder:text-secondary-text/50"
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
            className="w-full bg-primary-maroon text-white font-extrabold text-xs py-3.5 rounded-xl mt-4 active:scale-[0.98] transition-all hover:bg-dark-maroon flex justify-center items-center shadow-lg shadow-primary-maroon/10 cursor-pointer"
          >
            {saving ? (
              <div className="w-4.5 h-4.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span>Upload Media File</span>
            )}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
};

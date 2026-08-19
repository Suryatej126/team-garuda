import React, { useEffect, useState } from 'react';
import { Film, Image as ImageIcon, X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface MediaItem {
  id: number;
  event_id: number;
  type: string;
  file_url: string;
  thumbnail_url: string;
  caption: string;
}

export const Gallery: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PHOTO' | 'VIDEO'>('ALL');
  const [loading, setLoading] = useState(true);
  
  // Fullscreen Viewer State
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/public/media`);
        if (res.ok) {
          const data = await res.json();
          setMedia(data);
        }
      } catch (err) {
        console.error('Error fetching gallery:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, []);

  const filteredMedia = media.filter(item => {
    if (filter === 'ALL') return true;
    return item.type === filter;
  });

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewerIndex !== null && viewerIndex > 0) {
      setViewerIndex(viewerIndex - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewerIndex !== null && viewerIndex < filteredMedia.length - 1) {
      setViewerIndex(viewerIndex + 1);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-primary-bg text-primary-text overflow-y-auto no-scrollbar pb-6 relative">
      {/* Header Bar */}
      <div className="h-16 px-5 shrink-0 flex items-center justify-between border-b border-border-custom bg-white/95 backdrop-blur sticky top-0 z-30">
        <h2 className="text-base font-bold text-primary-maroon font-serif">Gallery & Media</h2>
        <span className="text-[9px] text-secondary-text font-black bg-secondary-bg border border-border-custom px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          {media.length} Items
        </span>
      </div>

      {/* Media Type Filters */}
      <div className="p-4 shrink-0 flex gap-2">
        {(['ALL', 'PHOTO', 'VIDEO'] as const).map(f => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setViewerIndex(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer uppercase tracking-wider ${
              filter === f
                ? 'bg-primary-maroon text-white border-primary-maroon shadow-sm font-black'
                : 'bg-white border-border-custom text-secondary-text hover:bg-secondary-bg/50'
            }`}
          >
            {f === 'PHOTO' ? (
              <ImageIcon className="w-3.5 h-3.5" />
            ) : f === 'VIDEO' ? (
              <Film className="w-3.5 h-3.5" />
            ) : null}
            <span>{f === 'ALL' ? 'All Files' : f === 'PHOTO' ? 'Photos' : 'Videos'}</span>
          </button>
        ))}
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="flex-grow flex flex-col justify-center items-center py-10">
          <div className="w-8 h-8 rounded-full border-2 border-t-primary-maroon border-border-custom animate-spin" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="flex-grow flex flex-col justify-center items-center p-6 text-center text-secondary-text bg-white border border-border-custom rounded-3xl m-5 shadow-sm py-16">
          <ImageIcon className="w-12 h-12 text-antique-gold stroke-[1.5] mb-3" />
          <p className="text-xs font-bold text-primary-maroon font-serif">No Media Uploaded</p>
          <span className="text-[10px] text-secondary-text mt-1 max-w-[200px]">Keep checking back for new event coverage.</span>
        </div>
      ) : (
        <div className="px-5 grid grid-cols-2 gap-3.5">
          {filteredMedia.map((item, index) => (
            <div
              key={item.id}
              onClick={() => setViewerIndex(index)}
              className="relative aspect-square rounded-2xl overflow-hidden border border-border-custom bg-secondary-bg group active:scale-[0.98] transition-all cursor-pointer shadow-sm hover:border-antique-gold/50"
            >
              <img
                src={item.file_url}
                alt={item.caption}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-maroon/80 via-transparent to-transparent opacity-95" />
              
              {/* Type Badge Overlay */}
              <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/90 backdrop-blur flex items-center justify-center border border-border-custom/40 shadow-sm">
                {item.type === 'VIDEO' ? (
                  <Play className="w-2.5 h-2.5 text-primary-maroon fill-primary-maroon translate-x-[0.5px]" />
                ) : (
                  <ImageIcon className="w-2.5 h-2.5 text-primary-maroon" />
                )}
              </div>

              {/* Caption Overlay */}
              <span className="absolute bottom-3 left-3 right-3 text-[9px] font-bold text-white truncate">
                {item.caption || "Garuda Moment"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Swipe/Slide Media Viewer Overlay */}
      {viewerIndex !== null && filteredMedia[viewerIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-primary-text/95 backdrop-blur-md flex flex-col items-center justify-between py-6 animate-fade-in"
          onClick={() => setViewerIndex(null)}
        >
          {/* Top Bar controls */}
          <div className="w-full px-5 flex justify-between items-center z-10 shrink-0">
            <span className="text-[10px] font-black text-secondary-bg tracking-widest uppercase">
              {viewerIndex + 1} / {filteredMedia.length}
            </span>
            <button 
              onClick={() => setViewerIndex(null)}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Media Presentation Container */}
          <div className="flex-1 w-full flex items-center justify-center relative px-2">
            {/* Prev Trigger */}
            {viewerIndex > 0 && (
              <button 
                onClick={handlePrev}
                className="absolute left-4 w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Content view */}
            <div className="max-w-full max-h-full flex items-center justify-center p-2" onClick={e => e.stopPropagation()}>
              {filteredMedia[viewerIndex].type === 'VIDEO' ? (
                <video 
                  src={filteredMedia[viewerIndex].file_url}
                  controls
                  autoPlay
                  className="w-full max-h-[70vh] rounded-xl object-contain shadow-2xl border border-white/15"
                />
              ) : (
                <img 
                  src={filteredMedia[viewerIndex].file_url}
                  alt={filteredMedia[viewerIndex].caption}
                  className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-white/15"
                />
              )}
            </div>

            {/* Next Trigger */}
            {viewerIndex < filteredMedia.length - 1 && (
              <button 
                onClick={handleNext}
                className="absolute right-4 w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Caption info bar */}
          <div className="w-full px-8 text-center shrink-0 z-10">
            <p className="text-[10px] font-bold text-white bg-white/10 backdrop-blur py-3 px-5 rounded-2xl inline-block max-w-[85%] border border-white/10 shadow-lg tracking-wider">
              {filteredMedia[viewerIndex].caption || "Team Garuda Community Moment"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

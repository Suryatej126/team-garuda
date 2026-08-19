import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, ArrowLeft, Film } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface Event {
  id: number;
  name: string;
  date: string;
  time: string;
  location: string;
  status: string;
  description: string;
  cover_image_url: string;
}

interface MediaItem {
  id: number;
  event_id: number;
  type: string;
  file_url: string;
  thumbnail_url: string;
  caption: string;
}

export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const eventRes = await fetch(`${API_BASE_URL}/api/public/events/${id}`);
        const mediaRes = await fetch(`${API_BASE_URL}/api/public/media?event_id=${id}`);
        if (eventRes.ok) {
          const eventData = await eventRes.json();
          setEvent(eventData);
        }
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          setMedia(mediaData);
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-primary-bg">
        <div className="w-8 h-8 rounded-full border-2 border-t-primary-maroon border-border-custom animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-primary-bg p-6 text-center">
        <p className="text-sm font-bold text-primary-maroon font-serif">Event not found</p>
        <button 
          onClick={() => navigate('/events')} 
          className="mt-4 text-xs font-bold text-primary-maroon flex items-center gap-1.5 cursor-pointer hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to events</span>
        </button>
      </div>
    );
  }

  const getStatusStyle = (status: string) => {
    if (status === 'ONGOING') return 'bg-emerald-500/80 text-white backdrop-blur border border-emerald-600/30';
    if (status === 'UPCOMING') return 'bg-primary-maroon/80 text-white backdrop-blur border border-primary-maroon/30';
    return 'bg-black/50 text-white backdrop-blur border border-white/10';
  };

  return (
    <div className="flex-1 flex flex-col bg-primary-bg text-primary-text overflow-y-auto no-scrollbar pb-6">
      {/* Cover Image & Header Overlay */}
      <div className="relative h-60 bg-secondary-bg shrink-0">
        <img 
          src={event.cover_image_url || "https://images.unsplash.com/photo-1605051008471-7501a3507b5a?w=800"} 
          alt={event.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-primary-bg" />
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/events')}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-primary-maroon active:scale-95 transition-all shadow-md cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Floating status tag */}
        <span className={`absolute top-4 right-4 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getStatusStyle(event.status)}`}>
          {event.status}
        </span>

        {/* Title */}
        <div className="absolute bottom-4 left-5 right-5">
          <h2 className="text-xl font-black tracking-tight leading-tight text-white font-serif drop-shadow-lg">
            {event.name}
          </h2>
        </div>
      </div>

      {/* Body Details */}
      <div className="px-5 pt-4 flex flex-col gap-6">
        {/* Date Time Location Card */}
        <div className="bg-white border border-border-custom p-4 rounded-2xl flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-3 text-xs text-primary-text">
            <div className="w-9 h-9 rounded-xl bg-primary-maroon/10 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-primary-maroon" />
            </div>
            <div>
              <p className="text-[10px] text-secondary-text font-bold uppercase tracking-wider">Date</p>
              <p className="font-semibold">{event.date}</p>
            </div>
          </div>

          <div className="w-full h-px bg-border-custom" />

          <div className="flex items-center gap-3 text-xs text-primary-text">
            <div className="w-9 h-9 rounded-xl bg-primary-maroon/10 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-primary-maroon" />
            </div>
            <div>
              <p className="text-[10px] text-secondary-text font-bold uppercase tracking-wider">Time</p>
              <p className="font-semibold">{event.time.substring(0, 5)}</p>
            </div>
          </div>

          <div className="w-full h-px bg-border-custom" />

          <div className="flex items-center gap-3 text-xs text-primary-text">
            <div className="w-9 h-9 rounded-xl bg-primary-maroon/10 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-primary-maroon" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-secondary-text font-bold uppercase tracking-wider">Location</p>
              <p className="font-semibold truncate">{event.location}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="flex flex-col gap-2">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-secondary-text">About This Event</h3>
            <p className="text-xs text-primary-text leading-relaxed bg-white p-4 border border-border-custom rounded-2xl shadow-sm">
              {event.description}
            </p>
          </div>
        )}

        {/* Event Gallery */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-secondary-text">
            Event Media ({media.length})
          </h3>
          
          {media.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-border-custom rounded-2xl bg-white shadow-sm">
              <span className="text-xs text-secondary-text">No photos or videos uploaded for this event yet.</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {media.map(item => (
                <div 
                  key={item.id}
                  onClick={() => navigate('/gallery')}
                  className="relative aspect-square rounded-xl overflow-hidden border border-border-custom bg-secondary-bg group active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  <img 
                    src={item.file_url} 
                    alt={item.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.type === 'VIDEO' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary-maroon/30">
                      <Film className="w-5 h-5 text-white stroke-[2]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

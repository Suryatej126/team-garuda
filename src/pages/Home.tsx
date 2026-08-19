import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, ArrowRight, Sparkles, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  caption: string;
}

export const Home: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsRes = await fetch('http://localhost:8000/api/public/events');
        const mediaRes = await fetch('http://localhost:8000/api/public/media');
        if (eventsRes.ok && mediaRes.ok) {
          const eventsData = await eventsRes.json();
          const mediaData = await mediaRes.json();
          setEvents(eventsData);
          setMedia(mediaData.slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayEvents = role === 'PUBLIC'
    ? events.filter(e => e.name.toLowerCase().includes('ganesh') || e.name.toLowerCase().includes('vinayaka'))
    : events;

  const ongoingEvent = displayEvents.find(e => e.status === 'ONGOING') || displayEvents.find(e => e.status === 'UPCOMING');
  const upcomingEvents = displayEvents.filter(e => e.id !== ongoingEvent?.id).slice(0, 3);

  const displayMedia = role === 'PUBLIC'
    ? media.filter(m => displayEvents.some(e => e.id === m.event_id))
    : media;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-primary-bg p-6">
        <div className="w-10 h-10 rounded-full border-2 border-t-primary-maroon border-border-custom animate-spin" />
        <span className="mt-4 text-xs text-secondary-text font-medium">Loading Garuda Hub...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-primary-bg text-primary-text overflow-y-auto no-scrollbar pb-6">
      {/* Header Bar */}
      <div className="h-16 px-5 shrink-0 flex items-center justify-between border-b border-border-custom bg-white/95 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-maroon flex items-center justify-center shadow-md">
            <span className="text-xs font-black text-white tracking-tight">TG</span>
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight leading-none text-primary-maroon font-serif">TEAM GARUDA</h2>
            <span className="text-[10px] text-secondary-text font-semibold tracking-wider uppercase">Hyderabad Club</span>
          </div>
        </div>
        
        {role === 'PUBLIC' && (
          <button 
            onClick={() => navigate('/login')}
            className="text-[11px] font-bold text-primary-maroon bg-primary-maroon/8 px-3 py-1.5 rounded-full border border-primary-maroon/20 active:scale-95 transition-all hover:bg-primary-maroon/15 cursor-pointer"
          >
            Committee Login
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-5 pt-4 flex flex-col gap-6">
        
        {/* Banner Announcement */}
        <div className="bg-gradient-to-r from-primary-maroon/8 to-antique-gold/10 border border-primary-maroon/15 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-maroon/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-antique-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-primary-maroon font-serif">Ganesh Chavithi 2026</h4>
            <p className="text-[10px] text-secondary-text truncate">Join us for the daily Aarti and special offerings!</p>
          </div>
          <button onClick={() => navigate('/events')} className="p-1 rounded-full text-secondary-text hover:text-primary-maroon transition-colors cursor-pointer">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Ongoing / Featured Event Card */}
        {ongoingEvent && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-secondary-text">Featured Event</h3>
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                ongoingEvent.status === 'ONGOING'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-primary-maroon/8 text-primary-maroon border-primary-maroon/20'
              }`}>
                {ongoingEvent.status}
              </span>
            </div>
            
            <div 
              onClick={() => navigate(`/events/${ongoingEvent.id}`)}
              className="relative rounded-3xl overflow-hidden border border-border-custom bg-white shadow-md active:scale-[0.99] transition-all cursor-pointer"
            >
              {/* Cover Image */}
              <div className="relative h-44 bg-secondary-bg">
                <img 
                  src={ongoingEvent.cover_image_url || "https://images.unsplash.com/photo-1605051008471-7501a3507b5a?w=800"} 
                  alt={ongoingEvent.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-maroon/90 via-primary-maroon/25 to-transparent" />
              </div>

              {/* Event Meta Details */}
              <div className="p-5 flex flex-col gap-3">
                <h2 className="text-lg font-black tracking-tight text-primary-text leading-tight font-serif">
                  {ongoingEvent.name}
                </h2>
                
                <div className="grid grid-cols-2 gap-3 text-xs text-secondary-text">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-primary-maroon shrink-0" />
                    <span>{ongoingEvent.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary-maroon shrink-0" />
                    <span>{ongoingEvent.time.substring(0, 5)}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-primary-maroon shrink-0" />
                    <span className="truncate">{ongoingEvent.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Events Carousel */}
        {upcomingEvents.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-secondary-text">Upcoming Events</h3>
              <button 
                onClick={() => navigate('/events')}
                className="text-[10px] font-bold text-primary-maroon hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
              {upcomingEvents.map(evt => (
                <div 
                  key={evt.id}
                  onClick={() => navigate(`/events/${evt.id}`)}
                  className="w-44 bg-white border border-border-custom rounded-2xl overflow-hidden shrink-0 active:scale-95 transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <img 
                    src={evt.cover_image_url || "https://images.unsplash.com/photo-1601662528567-526cd06f6582?w=400"}
                    alt={evt.name}
                    className="w-full h-24 object-cover"
                  />
                  <div className="p-3 flex flex-col gap-1.5">
                    <h4 className="text-xs font-extrabold text-primary-text line-clamp-1 leading-tight">{evt.name}</h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-secondary-text">
                      <Calendar className="w-3 h-3 text-primary-maroon shrink-0" />
                      <span>{evt.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Latest Media Feed */}
        {displayMedia.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-secondary-text">Latest Media</h3>
              <button 
                onClick={() => navigate('/gallery')}
                className="text-[10px] font-bold text-primary-maroon hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full Gallery</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {displayMedia.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => navigate('/gallery')}
                  className="relative h-28 rounded-2xl overflow-hidden border border-border-custom bg-secondary-bg group active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  <img 
                    src={item.file_url} 
                    alt={item.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-maroon/75 to-transparent" />
                  
                  {item.type === 'VIDEO' && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/85 backdrop-blur flex items-center justify-center shadow">
                      <Film className="w-3 h-3 text-primary-maroon" />
                    </div>
                  )}
                  
                  <span className="absolute bottom-2.5 left-2.5 right-2.5 text-[9px] font-semibold text-white truncate">
                    {item.caption || "Community Moment"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

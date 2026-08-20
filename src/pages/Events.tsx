import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';
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

export const Events: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/public/events`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (err) {
        console.error('Error loading events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(evt => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UPCOMING') return evt.status === 'UPCOMING' || evt.status === 'ONGOING';
    if (activeTab === 'COMPLETED') return evt.status === 'COMPLETED';
    return true;
  });

  const getStatusStyle = (status: string) => {
    if (status === 'ONGOING') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'UPCOMING') return 'bg-primary-maroon/8 text-primary-maroon border-primary-maroon/20';
    return 'bg-secondary-bg text-secondary-text border-border-custom';
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-primary-bg text-primary-text overflow-y-auto no-scrollbar pb-10">
      {/* Header Bar */}
      <div className="h-16 px-5 shrink-0 flex items-center justify-between border-b border-border-custom bg-white/95 backdrop-blur sticky top-0 z-30">
        <h2 className="text-base font-bold tracking-tight text-primary-maroon font-serif">Events Gallery</h2>
        <span className="text-[10px] text-secondary-text font-bold bg-secondary-bg border border-border-custom px-2.5 py-0.5 rounded-full">
          {events.length} Events
        </span>
      </div>

      {/* Tabs */}
      <div className="p-4 shrink-0">
        <div className="flex bg-secondary-bg border border-border-custom p-1 rounded-xl">
          {(['ALL', 'UPCOMING', 'COMPLETED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-[11px] font-extrabold py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-primary-maroon text-white shadow-sm'
                  : 'text-secondary-text hover:text-primary-text'
              }`}
            >
              {tab === 'ALL' ? 'All' : tab === 'UPCOMING' ? 'Upcoming' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex-1 flex flex-col justify-center items-center py-10">
          <div className="w-8 h-8 rounded-full border-2 border-t-primary-maroon border-border-custom animate-spin" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center p-6 m-5 text-center bg-white border border-border-custom rounded-3xl shadow-sm py-16">
          <Calendar className="w-12 h-12 text-antique-gold stroke-[1.5] mb-3" />
          <p className="text-xs font-bold text-primary-maroon font-serif">No Events Found</p>
          <p className="text-[10px] text-secondary-text mt-1">Check back later for updates</p>
        </div>
      ) : (
        <div className="px-5 flex flex-col gap-3">
          {filteredEvents.map(evt => (
            <div
              key={evt.id}
              onClick={() => navigate(`/events/${evt.id}`)}
              className="bg-white border border-border-custom rounded-2xl overflow-hidden flex active:scale-[0.99] transition-all hover:shadow-md cursor-pointer shadow-sm"
            >
              <img
                src={evt.cover_image_url || "https://images.unsplash.com/photo-1605051008471-7501a3507b5a?w=400"}
                alt={evt.name}
                className="w-24 h-28 object-cover shrink-0"
              />
              <div className="flex-1 p-4 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider border ${getStatusStyle(evt.status)}`}>
                      {evt.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-primary-text truncate leading-tight font-serif">{evt.name}</h3>
                </div>

                <div className="flex flex-col gap-1 text-[10px] text-secondary-text">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-primary-maroon shrink-0" />
                    <span>{evt.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-primary-maroon shrink-0" />
                    <span className="truncate">{evt.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center pr-3 text-secondary-text">
                <ChevronRight className="w-5 h-5 text-primary-maroon/40" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Send, ArrowLeft, Phone, User, IndianRupee } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export const Donate: React.FC = () => {
  const navigate = useNavigate();
  const [festivalInfo, setFestivalInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const fetchFestivalInfo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/public/festival-info`);
        if (res.ok) {
          const data = await res.json();
          setFestivalInfo(data);
        } else {
          setError('Failed to load donation settings.');
        }
      } catch (err) {
        setError('Network error. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchFestivalInfo();
  }, []);

  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !mobile.trim() || !amount.trim()) {
      setError('Please fill all the details.');
      return;
    }
    
    if (!festivalInfo?.admin_whatsapp_number) {
      setError('Admin WhatsApp number not configured. Please contact the committee directly.');
      return;
    }

    // Format WhatsApp message
    const message = `🙏 Namaskaram,\n\nI would like to make a donation for the Ganesh Utsav.\n\n*Name:* ${name}\n*Mobile:* ${mobile}\n*Amount:* ₹${amount}\n\nPlease guide me on how to transfer the amount.`;
    
    // Clean up WhatsApp number (remove non-digits)
    const phoneNum = festivalInfo.admin_whatsapp_number.replace(/\D/g, '');
    
    const whatsappUrl = `https://wa.me/${phoneNum}?text=${encodeURIComponent(message)}`;
    
    // Open in new tab or redirect
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-primary-bg p-6 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-primary-maroon border-border-custom animate-spin mb-3" />
        <p className="text-xs text-secondary-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-primary-bg text-primary-text overflow-y-auto no-scrollbar pb-28 relative">
      {/* Header Bar */}
      <div className="h-16 px-5 shrink-0 flex items-center justify-between border-b border-border-custom bg-white/95 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 -ml-2 rounded-full text-secondary-text hover:text-primary-maroon active:scale-90 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold tracking-tight text-primary-maroon font-serif">Donate</h2>
            <span className="text-[10px] text-secondary-text font-bold uppercase tracking-wider">Support Team Garuda</span>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 pb-6 flex flex-col gap-6 max-w-lg mx-auto w-full">
        {/* Banner Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#EA580C] to-[#9A3412] border-2 border-[#F59E0B]/60 rounded-3xl p-6 shadow-xl flex flex-col justify-center items-center text-center">
          <Heart className="w-10 h-10 text-[#FDE68A] mb-3 opacity-90 fill-current" />
          <h2 className="text-xl font-bold tracking-wide text-white font-serif">
            {festivalInfo?.donate_title || 'Donate to Team Garuda'}
          </h2>
          <p className="text-xs text-[#FFEDD5] mt-2 font-medium">
            {festivalInfo?.donate_description || 'Your contributions help us organize the festival and serve the community. Thank you for your support.'}
          </p>
        </div>

        {/* Form Section */}
        <div className="bg-white border border-border-custom p-6 rounded-3xl shadow-sm">
          <h3 className="text-sm font-bold text-primary-maroon font-serif mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Enter Details
          </h3>
          
          <form onSubmit={handleDonate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Full Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g., Surya Tej"
                  className="w-full bg-secondary-bg border border-border-custom rounded-xl pl-9 pr-3 py-3 text-xs font-semibold focus:outline-none focus:border-primary-maroon text-primary-text"
                  required
                />
                <User className="w-4 h-4 text-secondary-text absolute left-3 top-3.5" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Mobile Number</label>
              <div className="relative">
                <input 
                  type="tel" 
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="E.g., 9876543210"
                  className="w-full bg-secondary-bg border border-border-custom rounded-xl pl-9 pr-3 py-3 text-xs font-semibold focus:outline-none focus:border-primary-maroon text-primary-text"
                  required
                />
                <Phone className="w-4 h-4 text-secondary-text absolute left-3 top-3.5" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Amount (₹)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="E.g., 1000"
                  className="w-full bg-secondary-bg border border-border-custom rounded-xl pl-9 pr-3 py-3 text-xs font-semibold focus:outline-none focus:border-primary-maroon text-primary-text"
                  required
                />
                <IndianRupee className="w-4 h-4 text-secondary-text absolute left-3 top-3.5" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-error text-xs font-semibold p-3 rounded-xl border border-red-100 flex items-center justify-center text-center">
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="mt-2 w-full bg-primary-maroon text-white font-bold text-xs py-3.5 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to WhatsApp</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

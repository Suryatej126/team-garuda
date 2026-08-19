import React, { useState, useEffect } from 'react';

interface PhoneWrapperProps {
  children: React.ReactNode;
}

export const PhoneWrapper: React.FC<PhoneWrapperProps> = ({ children }) => {
  const [time, setTime] = useState('12:00');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-secondary-bg flex items-center justify-center p-0 sm:p-6 font-sans overflow-x-hidden select-none selection:bg-antique-gold/20">
      {/* Decorative background for desktop view — subtle heritage mandala radial */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-antique-gold/8 via-secondary-bg to-secondary-bg z-0 pointer-events-none" />
      
      {/* Subtle gold decorative orb */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-light-gold/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-primary-maroon/5 blur-3xl pointer-events-none" />
      
      {/* Phone Container — ALWAYS locked to mobile width (max 440px) */}
      <div className="relative w-full sm:w-[420px] h-screen sm:h-[860px] bg-white sm:rounded-[44px] sm:shadow-[0_0_0_1px_var(--color-border-custom),_0_32px_80px_rgba(110,31,36,0.10),_0_12px_24px_rgba(201,154,74,0.06)] flex flex-col overflow-hidden z-10 sm:border sm:border-border-custom transition-all duration-300">
        
        {/* Phone Speaker & Camera Notch — visible when phone shell is shown */}
        <div className="hidden sm:flex absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-secondary-bg rounded-full z-50 items-center justify-center border border-border-custom/50 shadow-inner">
          <div className="w-2 h-2 rounded-full bg-border-custom" />
          <div className="w-12 h-1 bg-border-custom rounded-full ml-4" />
        </div>

        {/* Mobile Status Bar - custom colors */}
        <div className="h-10 sm:h-11 bg-secondary-bg px-6 pt-1.5 flex justify-between items-center text-xs font-semibold text-secondary-text z-40 select-none shrink-0 border-b border-border-custom">
          <div>{time}</div>
          <div className="flex items-center gap-1.5">
            {/* Cellular signal */}
            <svg className="w-3.5 h-3.5 fill-current text-secondary-text" viewBox="0 0 24 24">
              <path d="M2 22h20V2z" />
            </svg>
            {/* Wifi */}
            <svg className="w-3.5 h-3.5 fill-current text-secondary-text" viewBox="0 0 24 24">
              <path d="M12 21l-12-14.3a2 2 0 0 1 .4-2.8 19 19 0 0 1 23.2 0 2 2 0 0 1 .4 2.8z" />
            </svg>
            {/* Battery */}
            <div className="w-5 h-2.5 border border-secondary-text/50 rounded-sm p-0.5 flex items-center">
              <div className="h-full w-4 bg-primary-maroon rounded-[1px]" />
            </div>
          </div>
        </div>

        {/* Screen Content Wrapper */}
        <div className="flex-1 flex flex-col bg-primary-bg relative overflow-hidden">
          {children}
        </div>

        {/* iOS home indicator bar — always shown on phone shell */}
        <div className="hidden sm:block absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-border-custom rounded-full z-50" />
      </div>
    </div>
  );
};

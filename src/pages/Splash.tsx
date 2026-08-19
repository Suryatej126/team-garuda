import React, { useEffect } from 'react';
import { Bird, ShieldAlert } from 'lucide-react';

interface SplashProps {
  onFinish: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="absolute inset-0 bg-primary-bg flex flex-col items-center justify-center p-6 z-50 select-none animate-fade-in">
      {/* Decorative subtle background gold element */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-antique-gold/5 to-transparent pointer-events-none" />
      
      <div className="relative flex flex-col items-center">
        {/* Animated glowing outer ring */}
        <div className="absolute w-24 h-24 rounded-full border border-antique-gold/25 animate-ping duration-[1200ms]" />
        
        {/* Bird/Garuda icon container in maroon & gold */}
        <div className="w-20 h-20 bg-primary-maroon rounded-3xl flex items-center justify-center shadow-[0_12px_36px_rgba(110,31,36,0.15)] z-10 border border-border-custom">
          <Bird className="w-10 h-10 text-light-gold stroke-[1.8]" />
        </div>
      </div>
      
      {/* App Branding */}
      <div className="mt-8 text-center z-10">
        <h1 className="text-3xl font-bold tracking-wide font-serif text-primary-maroon">
          TEAM GARUDA
        </h1>
        <p className="mt-2.5 text-[10px] text-secondary-text font-bold tracking-[0.25em] uppercase">
          Digital Devotional Ledger
        </p>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 flex flex-col items-center gap-1.5">
        <span className="text-[9px] text-secondary-text font-bold tracking-widest uppercase">
          Garuda Committee Portal
        </span>
        <div className="flex items-center gap-1.5 text-secondary-text/80 text-[10px]">
          <ShieldAlert className="w-3.5 h-3.5 text-antique-gold" />
          <span>Authorized Access Only</span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';

interface GaneshaLoaderProps {
  message?: string;
  subMessage?: string;
  isFullPage?: boolean;
}

export const GaneshaLoader: React.FC<GaneshaLoaderProps> = ({
  message = "TEAM GARUDA",
  subMessage = "Sri Ganesha Krupa",
  isFullPage = true,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center select-none z-50 bg-primary-bg ${
      isFullPage ? 'fixed inset-0 sm:absolute' : 'w-full h-full min-h-[300px]'
    } animate-fade-in`}>
      
      {/* Ambient divine gold glow backdrop */}
      <div className="absolute w-64 h-64 rounded-full bg-antique-gold/20 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-44 h-44 rounded-full bg-light-gold/25 blur-2xl pointer-events-none" />

      {/* Center Ganesha Icon Container with Golden Glow & Breathing Animation */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Outer pulsating divine halo rings */}
        <div className="absolute w-36 h-36 rounded-full border border-antique-gold/35 animate-ping duration-[1600ms] pointer-events-none" />
        <div className="absolute w-28 h-28 rounded-full border-2 border-antique-gold/45 animate-pulse duration-[1200ms] pointer-events-none" />
        
        {/* Ganesha Logo with golden drop-shadow glow */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center p-2 rounded-full bg-radial from-white via-primary-bg to-transparent shadow-[0_0_40px_rgba(201,154,74,0.45)] transition-transform duration-700">
          <img 
            src="/logo.png" 
            alt="Lord Ganesha" 
            className="w-full h-full object-contain filter drop-shadow-[0_4px_16px_rgba(201,154,74,0.75)] animate-pulse duration-[1200ms]"
          />
        </div>

        {/* Orbiting divine golden star */}
        <div className="absolute w-36 h-36 animate-spin duration-[3000ms] pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-antique-gold shadow-[0_0_10px_#C99A4A]" />
        </div>
      </div>

      {/* Divine Branding Text in Pure Gold */}
      <div className="mt-7 flex flex-col items-center text-center z-10">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[0.2em] font-serif text-antique-gold uppercase filter drop-shadow-[0_2px_8px_rgba(201,154,74,0.3)]">
          {message}
        </h2>
        
        <div className="flex items-center gap-3 mt-2">
          <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-antique-gold" />
          <span className="text-[11px] sm:text-xs font-black text-antique-gold tracking-[0.3em] uppercase">
            {subMessage}
          </span>
          <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-antique-gold" />
        </div>
      </div>

    </div>
  );
};

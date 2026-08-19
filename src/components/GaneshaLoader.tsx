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
      <div className="absolute w-56 h-56 rounded-full bg-antique-gold/15 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-40 h-40 rounded-full bg-light-gold/20 blur-2xl pointer-events-none" />

      {/* Center Ganesha Icon Container with Golden Glow & Breathing Animation */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Outer pulsating divine halo rings */}
        <div className="absolute w-36 h-36 rounded-full border border-antique-gold/30 animate-ping duration-[1800ms] pointer-events-none" />
        <div className="absolute w-28 h-28 rounded-full border-2 border-antique-gold/40 animate-pulse duration-[1400ms] pointer-events-none" />
        
        {/* Ganesha Logo with golden drop-shadow glow */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center p-2 rounded-full bg-radial from-white via-primary-bg to-transparent shadow-[0_0_35px_rgba(201,154,74,0.35)] transition-transform duration-700 hover:scale-105">
          <img 
            src="/logo.png" 
            alt="Lord Ganesha" 
            className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(201,154,74,0.6)] animate-pulse duration-[1200ms]"
          />
        </div>

        {/* Orbiting divine golden dot */}
        <div className="absolute w-32 h-32 animate-spin duration-[3000ms] pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-antique-gold shadow-[0_0_8px_#C99A4A]" />
        </div>
      </div>

      {/* Divine Branding Text */}
      <div className="mt-6 flex flex-col items-center text-center z-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-widest font-serif text-primary-maroon uppercase">
          {message}
        </h2>
        
        <div className="flex items-center gap-2 mt-1.5">
          <div className="w-6 h-[1px] bg-antique-gold/60" />
          <span className="text-[10px] sm:text-xs font-extrabold text-antique-gold tracking-[0.25em] uppercase">
            {subMessage}
          </span>
          <div className="w-6 h-[1px] bg-antique-gold/60" />
        </div>
      </div>

      {/* Elegant minimalist loading bar */}
      <div className="w-32 h-1 bg-secondary-bg rounded-full mt-5 overflow-hidden border border-border-custom shadow-inner">
        <div className="h-full bg-gradient-to-r from-antique-gold via-light-gold to-primary-maroon rounded-full animate-loading-bar" />
      </div>

    </div>
  );
};

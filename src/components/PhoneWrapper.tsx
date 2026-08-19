import React from 'react';

interface PhoneWrapperProps {
  children: React.ReactNode;
}

export const PhoneWrapper: React.FC<PhoneWrapperProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-secondary-bg flex items-center justify-center font-sans overflow-x-hidden select-none">
      {/* Decorative desktop background — subtle heritage mandala radial */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-antique-gold/8 via-secondary-bg to-secondary-bg pointer-events-none hidden sm:block" />
      
      {/* Container — 100% full screen on mobile, elegant frame on desktop */}
      <div className="relative w-full sm:max-w-[430px] min-h-screen sm:min-h-0 sm:h-[92vh] sm:max-h-[900px] bg-primary-bg sm:rounded-[36px] sm:shadow-[0_0_0_1px_var(--color-border-custom),_0_24px_60px_rgba(110,31,36,0.12),_0_12px_24px_rgba(201,154,74,0.06)] flex flex-col overflow-hidden z-10 sm:border sm:border-border-custom">
        {/* Screen Content */}
        <div className="flex-1 flex flex-col bg-primary-bg relative overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { GaneshaLoader } from '../components/GaneshaLoader';

interface SplashProps {
  onFinish: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1400); // 1.4s initial divine splash
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="absolute inset-0 bg-primary-bg flex flex-col items-center justify-center z-50 select-none">
      <GaneshaLoader 
        message="TEAM GARUDA" 
        subMessage="Digital Devotional Ledger" 
        isFullPage={true} 
      />
    </div>
  );
};

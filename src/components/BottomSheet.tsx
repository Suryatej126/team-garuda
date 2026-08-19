import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (overlayRef.current === e.target) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="absolute inset-0 bg-primary-maroon/30 backdrop-blur-[2px] z-50 flex flex-col justify-end transition-opacity duration-300 ease-out select-none"
    >
      <div 
        ref={sheetRef}
        className="w-full bg-white border-t border-border-custom rounded-t-[24px] px-6 pb-8 pt-4 flex flex-col max-h-[85%] shadow-[0_-8px_40px_rgba(110,31,36,0.15)] animate-slide-up"
      >
        {/* Drag Indicator handle */}
        <div className="w-12 h-1 bg-border-custom rounded-full mx-auto mb-4 shrink-0 cursor-pointer" onClick={onClose} />
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h3 className="text-lg font-bold text-primary-maroon font-serif">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-secondary-bg border border-border-custom text-secondary-text hover:text-primary-maroon hover:bg-primary-maroon/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto min-h-0 text-primary-text">
          {children}
        </div>
      </div>
    </div>
  );
};

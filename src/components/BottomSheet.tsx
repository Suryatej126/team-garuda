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
      className="fixed inset-0 bg-primary-text/45 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-out select-none"
    >
      <div 
        ref={sheetRef}
        className="w-full max-w-sm bg-white border border-border-custom rounded-3xl p-5 flex flex-col max-h-[85%] shadow-2xl animate-fade-in select-text"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5 shrink-0">
          <h3 className="text-sm font-black text-primary-maroon font-serif tracking-wider">{title}</h3>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-secondary-bg border border-border-custom text-secondary-text hover:text-primary-maroon hover:bg-primary-maroon/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto min-h-0 text-primary-text no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

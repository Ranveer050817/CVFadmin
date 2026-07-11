import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu } from 'lucide-react';

interface TopbarProps {
  onMenuClick?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'AD';

  return (
    <header className="sticky top-0 z-50 h-16 flex items-center justify-between px-4 sm:px-8 bg-white border-b border-gold shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (onMenuClick) onMenuClick();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            if (onMenuClick) onMenuClick();
          }}
          className="md:hidden flex items-center justify-center w-12 h-12 text-gray-800 hover:text-gold transition-colors"
          aria-label="Open menu"
        >
          <Menu size={28} className="pointer-events-none" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 hidden sm:block">Admin Overview</h1>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium text-gray-900">{user?.email || 'admin@clickvickfilms.com'}</div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400">System Administrator</div>
        </div>
        <div className="w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold bg-gray-50 text-gold border-gold">
          {initials}
        </div>
      </div>
    </header>
  );
};

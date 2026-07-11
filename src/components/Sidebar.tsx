import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Tags, 
  Briefcase, 
  Package, 
  Star, 
  Settings, 
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { signOut } = useAuth();

  const links = [
    { to: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/admin/gallery', icon: <ImageIcon size={20} />, label: 'Gallery' },
    { to: '/admin/categories', icon: <Tags size={20} />, label: 'Categories' },
    { to: '/admin/services', icon: <Briefcase size={20} />, label: 'Services' },
    { to: '/admin/packages', icon: <Package size={20} />, label: 'Packages' },
    { to: '/admin/reviews', icon: <Star size={20} />, label: 'Reviews' },
    { to: '/admin/settings', icon: <Settings size={20} />, label: 'Website Settings' },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-60 flex-shrink-0 flex flex-col bg-black text-ivory transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} pointer-events-auto`}>
      <div className="p-6 mb-4 mt-2 flex justify-between items-center">
        <div>
          <div className="text-xs tracking-widest uppercase text-gray-500 mb-1">Management</div>
          <div className="text-xl font-bold tracking-tight text-gold">CLICK VICK</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors border-l-4 cursor-pointer touch-manipulation ${
                isActive 
                  ? 'bg-gold-light border-gold text-gold' 
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`mr-3 flex items-center justify-center ${isActive ? 'opacity-80' : 'opacity-50'}`}>
                  {React.cloneElement(link.icon as React.ReactElement, { size: 18 })}
                </span>
                {link.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={signOut}
          className="flex w-full items-center px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <span className="mr-3 flex items-center justify-center opacity-80"><LogOut size={18} /></span>
          Logout
        </button>
      </div>
    </aside>
  );
};

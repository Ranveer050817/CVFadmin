import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';

export const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ivory flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex-grow flex flex-col md:pl-60 transition-all duration-300 w-full min-w-0">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          <div className="flex-grow">
            <Outlet />
          </div>
          <footer className="p-6 text-center mt-auto">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Click Vick Films Admin &copy; 2024 &bull; Luxury Cinema Production</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

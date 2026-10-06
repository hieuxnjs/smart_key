import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ProfileModal from '../components/ProfileModal';

export default function MainLayout({
  activeTab,
  onSelectTab,
  currentUser,
  onLogout,
  isProfileOpen,
  setIsProfileOpen,
  systemLocked = false,
  onToggleSystemLock,
  children,
}) {
  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-blue-500 selection:text-white relative overflow-x-hidden flex flex-col justify-between">
      
      {/* 1. Các khối ánh sáng mờ trang nhã (Màu gốc) */}
      <div className="fixed -top-32 -left-32 w-96 h-96 lg:w-[480px] lg:h-[480px] bg-slate-200/30 rounded-full blur-[120px] pointer-events-none -z-0" />
      <div className="fixed top-1/3 -right-32 w-96 h-96 lg:w-[500px] lg:h-[500px] bg-slate-200/25 rounded-full blur-[140px] pointer-events-none -z-0" />
      <div className="fixed -bottom-40 left-1/4 w-96 h-96 lg:w-[500px] lg:h-[500px] bg-slate-200/30 rounded-full blur-[130px] pointer-events-none -z-0" />

      {/* 2. Toast Notifications chuẩn sáng */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#1e293b',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 15px 35px -10px rgba(15, 23, 42, 0.12)',
            borderRadius: '16px',
            fontSize: '13px',
            fontWeight: '600',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
          },
        }}
      />

      {/* 3. Modal Hồ Sơ Người Dùng */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {/* 4. Khung giao diện toàn màn hình (vừa khít, không bị boxed) */}
      <div className="w-full flex-1 flex flex-col md:flex-row gap-3 sm:gap-4 lg:gap-5 items-stretch p-3 sm:p-4 lg:p-5 relative z-10 pb-20 md:pb-5">
        
        {/* Desktop Sidebar + Mobile Bottom Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          onLogout={onLogout}
          onOpenProfile={() => setIsProfileOpen(true)}
          currentUser={currentUser}
        />

        {/* Panel chính */}
        <main
          className={`animate-fade-in flex-1 bg-slate-50/90 backdrop-blur-md rounded-3xl lg:rounded-[36px] p-4 sm:p-5 lg:p-6 flex flex-col justify-between overflow-hidden relative text-slate-800 transition-all duration-500 border border-slate-200/60 ${
            systemLocked
              ? 'ring-2 ring-rose-500/40 shadow-[0_0_35px_rgba(244,63,94,0.12)]'
              : 'shadow-sm'
          }`}
        >
          {/* Nội dung các Tab */}
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}

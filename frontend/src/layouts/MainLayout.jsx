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
  const mainRef = React.useRef(null);

  // Mỗi khi chuyển tab, tự động cuộn lên đầu trang ngay lập tức
  React.useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#f8faff] via-white to-blue-50/20 text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white relative overflow-x-hidden flex flex-col justify-between">
      
      {/* 1. Các khối ánh sáng mờ trang nhã lấy cảm hứng từ Travelora */}
      <div className="fixed -top-32 -left-32 w-96 h-96 lg:w-[480px] lg:h-[480px] bg-blue-200/20 rounded-full blur-[120px] pointer-events-none -z-0" />
      <div className="fixed top-1/3 -right-32 w-96 h-96 lg:w-[500px] lg:h-[500px] bg-indigo-200/15 rounded-full blur-[140px] pointer-events-none -z-0" />
      <div className="fixed -bottom-40 left-1/4 w-96 h-96 lg:w-[500px] lg:h-[500px] bg-sky-200/20 rounded-full blur-[130px] pointer-events-none -z-0" />

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

      {/* 4. Khung giao diện toàn màn hình (Tự động co giãn khi phóng to hoặc trên điện thoại) */}
      <div className="w-full flex-1 flex flex-col md:flex-row gap-3 sm:gap-4 lg:gap-5 items-stretch p-2.5 sm:p-4 lg:p-5 relative z-10 pb-24 sm:pb-24 md:pb-5 min-h-0">
        
        {/* Mobile Header Bar (< md): Hiển thị logo nhận diện thương hiệu trên điện thoại */}
        <div className="md:hidden flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.svg"
              alt="Smart Lock Logo"
              className="w-8 h-8 object-contain rounded-lg drop-shadow-xs"
            />
            <div>
              <span className="block text-xs font-black tracking-wider text-slate-900 uppercase">KMA SMART LOCK</span>
              <span className="block text-[10px] text-blue-600 font-bold">Khóa Cửa Thông Minh</span>
            </div>
          </div>

          <button
            onClick={() => setIsProfileOpen(true)}
            className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs cursor-pointer"
            title="Hồ sơ người dùng"
          >
            {currentUser?.username ? currentUser.username.substring(0, 2).toUpperCase() : 'HI'}
          </button>
        </div>

        {/* Desktop Sidebar + Mobile Bottom Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          onLogout={onLogout}
          onOpenProfile={() => setIsProfileOpen(true)}
          currentUser={currentUser}
        />

        {/* Panel chính: Tự động cuộn mượt mà khi phóng to web hoặc trên màn hình điện thoại dọc */}
        <main
          ref={mainRef}
          className={`animate-fade-in flex-1 bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl lg:rounded-[36px] p-3 sm:p-5 lg:p-6 flex flex-col justify-start overflow-y-auto overflow-x-hidden min-h-0 relative text-slate-800 transition-all duration-300 border border-slate-200/70 shadow-[0_10px_35px_-5px_rgba(15,23,42,0.05)] scrollbar-thin ${
            systemLocked
              ? 'ring-2 ring-rose-500/40 shadow-[0_0_35px_rgba(244,63,94,0.12)]'
              : ''
          }`}
        >
          {/* Nội dung các Tab */}
          <div className="flex-1 flex flex-col min-h-0">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}

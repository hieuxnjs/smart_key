import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Shield,
  Clock,
  Key,
  Settings,
  LogOut,
  ScanFace,
} from 'lucide-react';

export default function Sidebar({
  activeTab = 'dashboard',
  onSelectTab,
  onLogout,
  onOpenProfile,
  currentUser = null,
}) {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Hệ Thống Khóa Thông Minh', shortLabel: 'Tổng quan' },
    { id: 'faces', icon: ScanFace, label: 'Quản Lý Nhận Diện Khuôn Mặt', shortLabel: 'Khuôn mặt' },
    { id: 'security', icon: Shield, label: 'An Ninh & Khóa Cửa', shortLabel: 'An ninh' },
    { id: 'history', icon: Clock, label: 'Nhật Ký Ra Vào', shortLabel: 'Nhật ký' },
    { id: 'rfid', icon: Key, label: 'Thẻ Từ Gia Đình', shortLabel: 'Thẻ từ' },
    { id: 'settings', icon: Settings, label: 'Cài Đặt Hệ Thống', shortLabel: 'Cài đặt' },
  ];

  const handleSelect = (id) => {
    if (onSelectTab) onSelectTab(id);
  };

  const userInitial = currentUser?.username
    ? currentUser.username.substring(0, 2).toUpperCase()
    : 'HI';

  return (
    <>
      {/* 1. DESKTOP VERTICAL SIDEBAR (>= md) - MÀU SẮC GỐC XANH GRADIENT */}
      <motion.aside
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="hidden md:flex flex-col items-center w-20 lg:w-24 bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-800 rounded-3xl shadow-xl shadow-blue-900/25 py-6 justify-between z-20 flex-shrink-0 select-none text-white border border-blue-400/20"
      >
        {/* Brand Logo */}
        <div className="flex flex-col items-center gap-1.5">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect('dashboard')}
            title="Hệ Thống Khóa Thông Minh"
            className="cursor-pointer focus:outline-none"
          >
            <img
              src="/logo.svg"
              alt="Smart Lock Logo"
              className="w-12 h-12 object-contain rounded-xl drop-shadow-md hover:brightness-105 transition-all"
            />
          </motion.button>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-100/90 text-center">
            KMA LOCK
          </span>
        </div>

        {/* Navigation Menu Icons */}
        <nav className="flex flex-col items-center gap-3.5 my-auto w-full px-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <div key={item.id} className="relative group flex items-center">
                <motion.button
                  onClick={() => handleSelect(item.id)}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-xl shadow-black/20 scale-105'
                      : 'text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <motion.span
                      layoutId="desktopActiveIndicator"
                      className="absolute -right-3 w-1.5 h-6 bg-white rounded-l-full shadow-sm"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </motion.button>

                {/* Floating Tooltip */}
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900/95 backdrop-blur-md text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xl border border-slate-700/50 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 -translate-x-2 group-hover:translate-x-0 z-50">
                  {item.label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-r-slate-900/95" />
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom Actions: Logout & Profile */}
        <div className="flex flex-col items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.15, rotate: -8 }}
            whileTap={{ scale: 0.9 }}
            onClick={onLogout}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-rose-500 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
            title="Đăng Xuất"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>

          <div className="w-8 h-px bg-white/20 my-0.5" />

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenProfile}
            className="w-10 h-10 rounded-full border-2 border-white/70 overflow-hidden shadow-md cursor-pointer bg-blue-500 hover:bg-blue-400 flex items-center justify-center text-white font-extrabold text-xs transition-colors"
            title={currentUser?.username ? `Tài khoản: ${currentUser.username}` : 'Hồ Sơ Quản Trị'}
          >
            <span>{userInitial}</span>
          </motion.button>
        </div>
      </motion.aside>

      {/* 2. MOBILE RESPONSIVE BOTTOM NAVIGATION BAR (< md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)] select-none text-slate-600">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer relative ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-xs'
                    : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight">{item.shortLabel}</span>
              {isActive && (
                <motion.span
                  layoutId="mobileActiveDot"
                  className="w-1.5 h-1.5 rounded-full bg-blue-600 absolute -bottom-0.5"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}

        {/* Profile on Mobile */}
        <button
          onClick={onOpenProfile}
          className="flex flex-col items-center gap-0.5 py-1 px-2 text-slate-500 hover:text-slate-800 cursor-pointer"
          title="Hồ sơ người dùng"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-extrabold shadow-sm">
            {userInitial}
          </div>
          <span className="text-[10px]">Hồ sơ</span>
        </button>
      </nav>
    </>
  );
}

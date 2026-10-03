import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  LogOut,
  X,
  User,
} from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, currentUser, onLogout }) {
  if (!isOpen) return null;

  const username = currentUser?.username || 'admin';
  const role = currentUser?.role || 'admin';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm select-none text-slate-800">
        
        {/* Backdrop click to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-white p-6 z-10 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Hồ Sơ Người Dùng
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Avatar & Info */}
          <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-blue-500/25">
              <span>{username.substring(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">{username}</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span className="capitalize">{role === 'admin' ? 'Quản Trị Viên' : role}</span>
              </div>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Vai Trò Hệ Thống</span>
              <span className="font-bold text-slate-800 capitalize">
                {role === 'admin' ? 'Quản Trị Viên (Toàn Quyền)' : role}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Phiên Làm Việc</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Token JWT Hợp Lệ
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onClose();
              if (onLogout) onLogout();
            }}
            className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-rose-200/80 shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất Khỏi Hệ Thống</span>
          </motion.button>
        </motion.div>

      </div>
    </AnimatePresence>
  );
}

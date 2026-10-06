import React from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

export default function CenterControl({
  doorOpen = false,
  systemLocked = false,
  onOpenDoor,
  actionLoading = false,
  mqttConnected = true,
}) {
  return (
    <div className="flex flex-col items-center justify-center select-none w-full py-2">
      
      {/* Top Header of Center Dial */}
      <div className="text-center space-y-1 mb-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-semibold shadow-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              mqttConnected ? 'bg-blue-600 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span>{mqttConnected ? 'Khóa đang kết nối' : 'Đang kết nối với khóa...'}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
          Lối Vào Chính
        </h2>
        <p className="text-xs text-slate-400 font-medium">Khóa Cửa Chính - Phòng Khách</p>
      </div>

      {/* Main Circular Dial Area (Compact & Beautiful Neumorphic) */}
      <div className="relative my-2 sm:my-3 flex items-center justify-center">
        
        {/* Outer ambient glow pulse */}
        {!systemLocked && (
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.25, 0.55, 0.25],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-56 h-56 sm:w-60 sm:h-60 rounded-full bg-blue-400/20 blur-xl pointer-events-none"
          />
        )}

        {/* Outer Dial Base (Original Neumorphic Palette) */}
        <div className="w-48 h-48 sm:w-54 sm:h-54 rounded-full bg-[#f4f7fb] p-3 flex items-center justify-center shadow-[12px_12px_24px_#d8e1ed,-12px_-12px_24px_#ffffff] border border-white/70">
          
          {/* Thick Pulsing Ring */}
          <motion.div
            animate={
              systemLocked
                ? {}
                : {
                    scale: [1, 1.025, 1],
                    boxShadow: [
                      '0 0 12px rgba(59, 130, 246, 0.35)',
                      '0 0 24px rgba(59, 130, 246, 0.65)',
                      '0 0 12px rgba(59, 130, 246, 0.35)',
                    ],
                  }
            }
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`w-full h-full rounded-full p-2.5 transition-colors duration-500 flex items-center justify-center ${
              systemLocked
                ? 'bg-rose-500 shadow-md shadow-rose-500/30'
                : 'bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-500'
            }`}
          >
            {/* Inner Ring Frame */}
            <div className="w-full h-full rounded-full bg-[#eef3f9] p-2 flex items-center justify-center shadow-inner">
              
              {/* Glossy White Center Button */}
              <motion.button
                whileHover={systemLocked ? {} : { scale: 1.04 }}
                whileTap={systemLocked ? {} : { scale: 0.94 }}
                disabled={actionLoading || systemLocked}
                onClick={onOpenDoor}
                className={`group relative w-full h-full rounded-full bg-gradient-to-b from-white via-slate-50 to-slate-100 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-[6px_6px_16px_rgba(166,180,200,0.35),-4px_-4px_12px_rgba(255,255,255,0.9)] border border-white cursor-pointer ${
                  systemLocked ? 'opacity-80 cursor-not-allowed' : 'active:shadow-inner'
                }`}
              >
                {/* Center Icon */}
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform duration-300 ${
                    systemLocked
                      ? 'bg-rose-100 text-rose-500'
                      : doorOpen
                      ? 'bg-emerald-100 text-emerald-600 rotate-12 scale-110'
                      : 'bg-blue-50 text-blue-600 group-hover:scale-110'
                  }`}
                >
                  {actionLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  ) : systemLocked ? (
                    <ShieldAlert className="w-6 h-6 text-rose-500" />
                  ) : doorOpen ? (
                    <Unlock className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <KeyRound className="w-6 h-6 text-blue-600" />
                  )}
                </div>

                {/* Button Action Label */}
                <div className="text-center z-10 px-1">
                  <span
                    className={`block text-[11px] sm:text-xs font-black tracking-wider uppercase ${
                      systemLocked
                        ? 'text-rose-500'
                        : doorOpen
                        ? 'text-emerald-600'
                        : 'text-slate-800'
                    }`}
                  >
                    {actionLoading
                      ? 'ĐANG GỬI...'
                      : systemLocked
                      ? 'HỆ THỐNG KHÓA'
                      : doorOpen
                      ? 'CỬA ĐANG MỞ'
                      : 'MỞ CỬA'}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 block">
                    {systemLocked
                      ? 'Đang phong tỏa'
                      : doorOpen
                      ? 'Sắp tự động đóng'
                      : 'Chạm mở từ xa'}
                  </span>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Status Indicator Bar */}
      <div className="w-full max-w-xs mt-1">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${
                doorOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {doorOpen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            </div>
            <div>
              <p className="font-bold text-slate-700 text-xs">Chốt Cửa Điện Từ</p>
              <p className="text-[10px] text-slate-400">
                {doorOpen ? 'Chốt đã mở' : 'Chốt an toàn khép kín'}
              </p>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
              doorOpen ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {doorOpen ? 'Đang Mở' : 'Đã Khóa'}
          </span>
        </div>
      </div>

    </div>
  );
}

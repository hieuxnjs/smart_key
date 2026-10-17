import React from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  Loader2,
  Sparkles,
  Wifi,
  WifiOff,
  Radio,
} from 'lucide-react';

export default function CenterControl({
  doorOpen = false,
  systemLocked = false,
  onOpenDoor,
  onCloseDoor,
  onToggleDoor,
  actionLoading = false,
  mqttConnected = true,
  deviceOnline = false,
}) {
  const handleClick = () => {
    if (actionLoading || systemLocked || !deviceOnline) return;
    if (onToggleDoor) {
      onToggleDoor();
    } else if (doorOpen && onCloseDoor) {
      onCloseDoor();
    } else if (onOpenDoor) {
      onOpenDoor();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center select-none w-full py-2">
      
      {/* Top Header of Center Dial */}
      <div className="text-center space-y-1.5 mb-2">
        <div className="inline-flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border shadow-xs transition-all ${
              deviceOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/90'
                : 'bg-rose-50 text-rose-700 border-rose-200/90'
            }`}
          >
            <span className="relative flex items-center justify-center w-2 h-2">
              {deviceOnline && (
                <span className="absolute w-full h-full rounded-full bg-emerald-400 animate-ping opacity-75" />
              )}
              <span
                className={`relative block w-2 h-2 rounded-full ${
                  deviceOnline ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </span>
            <span>{deviceOnline ? 'Khóa Trực Tuyến' : 'Khóa Ngoại Tuyến'}</span>
          </div>

          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100/90 px-2.5 py-0.5 rounded-full border border-slate-200/70 flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 text-blue-500" />
            <span>Cửa Chính</span>
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Lối Vào Chính
        </h2>
        <p className="text-xs text-slate-500 font-medium">Khóa Cửa Thông Minh - Phòng Khách</p>
      </div>

      {/* Main Circular Dial Area (Futuristic Cyber Rings & Neumorphic Core) */}
      <div className="relative my-3 sm:my-4 flex items-center justify-center">
        
        {/* Layer 1: Ambient Cyber Glow Field */}
        <motion.div
          animate={
            systemLocked
              ? { scale: [1, 1.12, 1], opacity: [0.35, 0.7, 0.35] }
              : doorOpen
              ? { scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }
              : { scale: [1, 1.06, 1], opacity: [0.2, 0.45, 0.2] }
          }
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute w-60 h-60 sm:w-68 sm:h-68 rounded-full blur-2xl pointer-events-none transition-colors duration-500 ${
            systemLocked
              ? 'bg-rose-500/30'
              : doorOpen
              ? 'bg-emerald-400/35'
              : 'bg-blue-500/25'
          }`}
        />

        {/* Layer 2: Outer Rotating Cyber Orbit Rings */}
        <div
          className={`absolute w-56 h-56 sm:w-62 sm:h-62 rounded-full border border-dashed transition-colors duration-500 pointer-events-none animate-spin-slow ${
            systemLocked
              ? 'border-rose-400/50'
              : doorOpen
              ? 'border-emerald-400/60'
              : 'border-blue-400/40'
          }`}
        />
        <div
          className={`absolute w-52 h-52 sm:w-58 sm:h-58 rounded-full border border-dotted transition-colors duration-500 pointer-events-none animate-spin-reverse-slow ${
            systemLocked
              ? 'border-rose-300/40'
              : doorOpen
              ? 'border-emerald-300/50'
              : 'border-indigo-300/35'
          }`}
        />

        {/* Layer 3: Solid Dial Housing with Neumorphic Shadow */}
        <div className="relative z-10 w-48 h-48 sm:w-54 sm:h-54 rounded-full bg-slate-50 p-3 flex items-center justify-center shadow-[14px_14px_28px_#d1dbe8,-14px_-14px_28px_#ffffff] border border-white">
          
          {/* Layer 4: Interactive Status Ring (Emerald / Blue / Rose Gradient) */}
          <motion.div
            animate={
              systemLocked
                ? {}
                : {
                    scale: [1, 1.025, 1],
                  }
            }
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className={`w-full h-full rounded-full p-2.5 transition-all duration-500 flex items-center justify-center shadow-lg ${
              systemLocked
                ? 'bg-gradient-to-tr from-rose-600 via-rose-500 to-red-500 shadow-rose-500/35'
                : doorOpen
                ? 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 shadow-emerald-500/35'
                : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 shadow-blue-500/30'
            }`}
          >
            {/* Inner Ring Bezel */}
            <div className="w-full h-full rounded-full bg-[#f1f5f9] p-2 flex items-center justify-center shadow-inner">
              
              {/* Glossy Interactive Center Button */}
              <motion.button
                whileHover={systemLocked || !deviceOnline ? {} : { scale: 1.05 }}
                whileTap={systemLocked || !deviceOnline ? {} : { scale: 0.94 }}
                disabled={actionLoading || systemLocked || !deviceOnline}
                onClick={handleClick}
                title={
                  !deviceOnline
                    ? 'Khóa đang ngoại tuyến'
                    : systemLocked
                    ? 'Hệ thống đang bị phong tỏa'
                    : actionLoading
                    ? 'Đang gửi lệnh điều khiển...'
                    : doorOpen
                    ? 'Cửa đang mở - Nhấp để đóng cửa'
                    : 'Cửa đang khóa - Nhấp để mở cửa'
                }
                className={`btn-shimmer group relative w-full h-full rounded-full bg-gradient-to-b from-white via-slate-50 to-slate-100 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-[6px_6px_16px_rgba(160,175,200,0.35),-4px_-4px_12px_rgba(255,255,255,0.95)] border border-white cursor-pointer ${
                  systemLocked || !deviceOnline
                    ? 'opacity-80 cursor-not-allowed'
                    : 'active:shadow-inner hover:border-blue-200'
                }`}
              >
                {/* Center Icon Frame */}
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                    !deviceOnline
                      ? 'bg-slate-100 text-slate-400'
                      : systemLocked
                      ? 'bg-rose-100 text-rose-600 shadow-rose-500/20'
                      : doorOpen
                      ? 'bg-emerald-100 text-emerald-600 group-hover:bg-rose-100 group-hover:text-rose-600 group-hover:scale-110 shadow-emerald-500/20'
                      : 'bg-blue-50 text-blue-600 group-hover:scale-110 shadow-blue-500/15'
                  }`}
                >
                  {actionLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  ) : systemLocked ? (
                    <ShieldAlert className="w-6 h-6 text-rose-600" />
                  ) : doorOpen ? (
                    <div className="relative flex items-center justify-center">
                      <Unlock className="w-6 h-6 text-emerald-600 transition-all duration-200 group-hover:opacity-0 group-hover:scale-90" />
                      <Lock className="w-6 h-6 text-rose-600 absolute inset-0 opacity-0 scale-90 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100" />
                    </div>
                  ) : (
                    <KeyRound className="w-6 h-6 text-blue-600 group-hover:rotate-6 transition-transform" />
                  )}
                </div>

                {/* Button Action Label */}
                <div className="text-center z-10 px-1">
                  <span
                    className={`block text-[11px] sm:text-xs font-black tracking-wider uppercase transition-colors ${
                      !deviceOnline
                        ? 'text-slate-400'
                        : actionLoading
                        ? 'text-blue-600 animate-pulse'
                        : systemLocked
                        ? 'text-rose-600 font-extrabold'
                        : doorOpen
                        ? 'text-emerald-600 group-hover:text-rose-600 font-extrabold'
                        : 'text-slate-800'
                    }`}
                  >
                    {!deviceOnline
                      ? 'NGOẠI TUYẾN'
                      : actionLoading
                      ? (doorOpen ? 'ĐANG ĐÓNG...' : 'ĐANG MỞ...')
                      : systemLocked
                      ? 'HỆ THỐNG KHÓA'
                      : doorOpen
                      ? 'ĐÓNG CỬA'
                      : 'MỞ CỬA'}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 block mt-0.5">
                    {!deviceOnline
                      ? 'Không có kết nối'
                      : actionLoading
                      ? 'Vui lòng chờ giây lát'
                      : systemLocked
                      ? 'Đang khóa an toàn'
                      : doorOpen
                      ? 'Chạm để đóng cửa ngay'
                      : 'Chạm để mở cửa'}
                  </span>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Status Indicator Bar (Chạm để đóng/mở trực tiếp) */}
      <div className="w-full max-w-xs mt-1">
        <button
          type="button"
          onClick={handleClick}
          disabled={actionLoading || systemLocked || !deviceOnline}
          title={
            !deviceOnline
              ? 'Khóa đang ngoại tuyến'
              : systemLocked
              ? 'Hệ thống đang bị phong tỏa'
              : doorOpen
              ? 'Nhấp để đóng cửa'
              : 'Nhấp để mở cửa'
          }
          className={`w-full p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 flex items-center justify-between text-xs shadow-xs transition-all ${
            actionLoading || systemLocked || !deviceOnline
              ? 'opacity-80 cursor-not-allowed'
              : 'hover:border-slate-300 hover:shadow-sm active:scale-[0.99] cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl transition-colors ${
                doorOpen
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {doorOpen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div className="text-left">
              <p className="font-extrabold text-slate-800 text-xs">Trạng Thái Chốt Khóa</p>
              <p className="text-[10px] text-slate-400 font-medium">
                {doorOpen ? 'Chốt đang mở • Chạm để đóng' : 'Cửa đang đóng an toàn • Chạm mở'}
              </p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
              doorOpen
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {doorOpen ? 'Đang Mở' : 'Đã Khóa'}
          </span>
        </button>
      </div>

    </div>
  );
}

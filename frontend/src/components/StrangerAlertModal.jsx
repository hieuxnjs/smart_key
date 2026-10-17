import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Camera,
  ShieldAlert,
  ShieldCheck,
  Volume2,
  X,
  Clock,
  AlertTriangle,
  Radio,
  Zap,
} from 'lucide-react';

export default function StrangerAlertModal({
  isOpen,
  onClose,
  alert,
  onLockSystem,
  systemLocked = false,
  onTriggerBuzzer,
}) {
  if (!alert) return null;

  const rawImage = alert.image_data || alert.image_base64 || '';
  const base64String = rawImage.replace(/^data:image\/[a-z]+;base64,/, '');

  const isSpoofing =
    (alert.action || '').toLowerCase().includes('gia mao') ||
    (alert.action || '').toLowerCase().includes('spoof');

  const formatAlertTime = (timestamp) => {
    try {
      const d = new Date(timestamp);
      return `${d.toLocaleTimeString('vi-VN')} - ${d.toLocaleDateString('vi-VN')}`;
    } catch {
      return 'Vừa xong';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 select-none">
          {/* Backdrop */}
          <motion.button
            aria-label="Đóng hộp thoại cảnh báo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="stranger-alert-title"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-[95%] sm:w-full max-w-lg max-h-[92vh] overflow-y-auto scrollbar-thin rounded-3xl bg-white p-4 sm:p-6 shadow-2xl ${
              isSpoofing
                ? 'border-2 border-amber-400 glow-amber'
                : 'border-2 border-rose-500 emergency-alert-pulse'
            }`}
          >
            {/* Top Alert Pulse Accent */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 ${
                isSpoofing
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 animate-pulse'
                  : 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 animate-pulse'
              }`}
            />

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="mb-4 flex items-center gap-3 pr-8">
              <div
                className={`rounded-2xl p-3 shadow-md flex items-center justify-center ${
                  isSpoofing
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25'
                    : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25'
                }`}
              >
                <ShieldAlert className="h-6 w-6 stroke-[2.2] animate-pulse" />
              </div>
              <div>
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                    isSpoofing
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-ping ${
                      isSpoofing ? 'bg-amber-600' : 'bg-rose-600'
                    }`}
                  />
                  <span>
                    {isSpoofing
                      ? 'Cảnh Báo Giả Mạo'
                      : 'Phát Hiện Người Lạ'}
                  </span>
                </div>
                <h2
                  id="stranger-alert-title"
                  className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5"
                >
                  {isSpoofing ? 'Cảnh Báo Giả Mạo Khuôn Mặt' : 'Phát Hiện Người Lạ Trước Cửa'}
                </h2>
              </div>
            </div>

            {/* Timestamp & Warning Message */}
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Thời gian:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatAlertTime(alert.timestamp)}
                </span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                  isSpoofing
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-rose-100 text-rose-700 border border-rose-200'
                }`}
              >
                {alert.action || 'Cảnh báo: Có người lạ xuất hiện trước cửa!'}
              </span>
            </div>

            {/* Captured Base64 Image with Cyber Reticle */}
            <div className="relative mb-4 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group">
              {/* Corner HUD Brackets */}
              <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-rose-400 z-10 pointer-events-none" />
              <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-rose-400 z-10 pointer-events-none" />
              <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-rose-400 z-10 pointer-events-none" />
              <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-rose-400 z-10 pointer-events-none" />

              {base64String ? (
                <img
                  src={`data:image/jpeg;base64,${base64String}`}
                  alt="Ảnh người lạ được chụp từ Camera cửa"
                  className="w-full max-h-[360px] object-contain rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                />
              ) : (
                <div className="w-full h-56 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Camera className="w-10 h-10 stroke-[1.5]" />
                  <p className="text-xs">Đang tải hình ảnh từ camera cửa...</p>
                </div>
              )}

              {/* Watermark badge on image */}
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md text-white text-[10px] font-mono font-bold flex items-center gap-1.5 border border-white/10 z-10">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>HÌNH ẢNH TRỰC TIẾP TẠI CỬA</span>
              </div>
            </div>

            {/* Emergency Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Button 1: Khóa Hệ Thống Ngay */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  if (onLockSystem) onLockSystem();
                }}
                className={`btn-shimmer w-full py-3 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  systemLocked
                    ? 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 shadow-none'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-rose-600/30'
                }`}
              >
                {systemLocked ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Cửa Đã Khóa An Toàn</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Khóa Cửa Ngay Lập Tức</span>
                  </>
                )}
              </motion.button>

              {/* Button 2: Kích hoạt còi báo động */}
              {onTriggerBuzzer && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    onTriggerBuzzer();
                  }}
                  className="w-full py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border border-amber-300/80 text-amber-900 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Volume2 className="w-4 h-4 text-amber-600 animate-bounce" />
                  <span>Phát Còi Cảnh Báo</span>
                </motion.button>
              )}
            </div>

            {/* Dismiss Footer Button */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Đã Kiểm Tra & Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

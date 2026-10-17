import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  DoorOpen,
  DoorClosed,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  AlertTriangle,
  Loader2,
  Sliders,
  Shield,
  Zap,
  Radio,
  CheckCircle2,
  Clock,
  Sparkles,
  Home,
} from 'lucide-react';

export default function SecurityTab({
  systemLocked = false,
  doorOpen = false,
  doorState = doorOpen ? 1 : 0,
  buzzerActive = false,
  onCommand,
  actionLoading = false,
  onToggleBuzzer,
  deviceOnline = false,
}) {
  const isDoorOpen = doorState === 1 || doorOpen;

  return (
    <div className="animate-fade-in space-y-3.5 sm:space-y-4 w-full select-none text-slate-800">
      
      {/* 1. Header Trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-[11px] font-bold tracking-wider uppercase ${
                deviceOnline
                  ? 'bg-blue-50 border-blue-100 text-blue-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  deviceOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span>{deviceOnline ? 'Khóa Đang Trực Tuyến' : 'Khóa Đang Ngoại Tuyến'}</span>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Bảo vệ an toàn 24/7</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kiểm Soát An Ninh & Khóa Cửa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium leading-relaxed">
            Theo dõi trạng thái chốt cửa, điều khiển mở khóa từ xa và bảo vệ an toàn toàn diện cho ngôi nhà
          </p>
        </div>
      </div>

      {/* 2. Thẻ Phong Tỏa Hệ Thống Lớn (Bảo Vệ Ngôi Nhà Khẩn Cấp) */}
      <div
        className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl transition-all duration-300 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden ${
          systemLocked
            ? 'emergency-alert-pulse bg-gradient-to-r from-rose-50/95 via-white to-rose-50/85'
            : 'bg-white border border-slate-200/80 hover:shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform ${
              systemLocked
                ? 'bg-rose-100 text-rose-600 shadow-md shadow-rose-500/20'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-2xs'
            }`}
          >
            {systemLocked ? (
              <ShieldAlert className="w-7 h-7 text-rose-600 animate-pulse" strokeWidth={2} />
            ) : (
              <ShieldCheck className="w-7 h-7 text-emerald-600" strokeWidth={2} />
            )}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`text-sm sm:text-base font-black tracking-tight ${
                  systemLocked ? 'text-rose-950' : 'text-slate-900'
                }`}
              >
                {systemLocked ? 'HỆ THỐNG ĐANG BỊ PHONG TỎA' : 'KHÓA TOÀN BỘ HỆ THỐNG'}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                  systemLocked
                    ? 'bg-rose-600 text-white shadow-xs shadow-rose-600/30'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {systemLocked ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>ĐANG CHẶN CẢNH BÁO</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Đang Cho Phép Hoạt Động</span>
                  </>
                )}
              </span>
            </div>
            <p
              className={`text-xs max-w-xl leading-relaxed ${
                systemLocked ? 'text-rose-700 font-medium' : 'text-slate-500'
              }`}
            >
              {systemLocked
                ? 'Bàn phím bấm và đầu đọc thẻ từ trên cửa đang bị vô hiệu hóa hoàn toàn.'
                : 'Vô hiệu hóa bàn phím số và thẻ từ bên ngoài để bảo vệ cửa trước mọi can thiệp.'}
            </p>
          </div>
        </div>

        {/* Nút Bật/Tắt Phong Tỏa */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onCommand(systemLocked ? 'UNLOCK_SYSTEM' : 'LOCK_SYSTEM')}
          disabled={actionLoading}
          className={`w-full sm:w-auto shrink-0 rounded-xl px-5 py-2.5 text-xs font-black tracking-wider uppercase text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
            systemLocked
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25 ring-2 ring-emerald-300'
              : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/25 ring-2 ring-rose-300'
          }`}
        >
          {actionLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : systemLocked ? (
            <ShieldCheck className="w-4 h-4 text-white" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-white" />
          )}
          <span>{systemLocked ? 'MỞ LẠI HỆ THỐNG' : 'CHẶN THAO TÁC CỬA'}</span>
        </motion.button>
      </div>

      {/* 3. Dãy 3 Thẻ Chỉ Số Trạng Thái (KPI Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Chỉ số 1: Trạng Thái Cửa */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border ${
                doorState === 2
                  ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                  : isDoorOpen
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {isDoorOpen ? (
                <DoorOpen className="w-5 h-5" strokeWidth={2} />
              ) : (
                <DoorClosed className="w-5 h-5" strokeWidth={2} />
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Cảm Biến Khóa
              </span>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">Trạng Thái Cửa</h4>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
              doorState === 2
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : isDoorOpen
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                doorState === 2
                  ? 'bg-rose-600 animate-ping'
                  : isDoorOpen
                  ? 'bg-emerald-500'
                  : 'bg-slate-500'
              }`}
            />
            {isDoorOpen ? 'Đang Mở' : doorState === 2 ? 'Kẹt Cửa' : 'Đang Đóng'}
          </span>
        </div>

        {/* Chỉ số 2: Còi Báo Động (Có công tắc bật/tắt trực quan) */}
        <div
          role="switch"
          aria-checked={buzzerActive}
          aria-label={`Còi báo động ${buzzerActive ? 'đang bật' : 'đang tắt'}`}
          onClick={() => {
            if (onToggleBuzzer && !actionLoading) onToggleBuzzer(!buzzerActive);
          }}
          className={`p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between cursor-pointer group transition-all ${
            buzzerActive ? 'ring-2 ring-rose-400/50 bg-rose-50/20' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border ${
                buzzerActive
                  ? 'bg-rose-100 text-rose-600 border-rose-300 animate-pulse'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {buzzerActive ? (
                <Volume2 className="w-5 h-5 text-rose-600" strokeWidth={2} />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500" strokeWidth={2} />
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Âm Thanh Cảnh Báo
              </span>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">Còi Báo Động</h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-extrabold ${
                buzzerActive ? 'text-rose-600' : 'text-slate-400'
              }`}
            >
              {buzzerActive ? 'Đang Bật' : 'Đang Tắt'}
            </span>
            <div
              className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                buzzerActive ? 'bg-rose-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  buzzerActive ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Chỉ số 3: Quyền Truy Cập (Phím bấm & Thẻ từ) */}
        <div
          className={`p-3.5 rounded-2xl transition-all flex items-center justify-between ${
            systemLocked
              ? 'border-2 border-rose-400 bg-rose-50/50 shadow-sm shadow-rose-500/15 animate-pulse'
              : 'bg-white border border-slate-200/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border ${
                systemLocked
                  ? 'bg-rose-100 text-rose-600 border-rose-300'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}
            >
              {systemLocked ? (
                <Lock className="w-5 h-5" strokeWidth={2} />
              ) : (
                <Unlock className="w-5 h-5" strokeWidth={2} />
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Quyền Bàn Phím & Thẻ
              </span>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">Quyền Truy Cập</h4>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
              systemLocked
                ? 'bg-rose-100 text-rose-700 border-rose-300'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                systemLocked ? 'bg-rose-600 animate-ping' : 'bg-emerald-500'
              }`}
            />
            {systemLocked ? 'Bị Khóa' : 'Cho Phép'}
          </span>
        </div>
      </div>

      {/* 4. KHU VỰC CHÍNH: CỘT TRÁI (4 Nút Lối Vào Ban Đầu Nền Sáng) + CỘT PHẢI (Mô Phỏng An Ninh Trực Quan Thay Log) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 flex-1 items-stretch">
        
        {/* CỘT TRÁI: 4 Nút Điều Khiển Lối Vào (Phục hồi ban đầu: nền sáng thanh lịch, ăn khớp với nền trang) */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Sliders className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">Thao Tác Khóa Cửa Trực Tiếp</h4>
            </div>
            <p className="text-xs text-slate-400">Gửi lệnh đóng/mở chốt khóa và chế độ phong tỏa an toàn tức thời</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-3.5 flex-1 items-stretch">
            {/* Nút 1: Mở Cửa */}
            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              disabled={actionLoading || systemLocked}
              onClick={() => onCommand('OPEN_DOOR')}
              className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center text-center gap-2 group cursor-pointer ${
                systemLocked
                  ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-br from-white to-blue-50/50 hover:to-blue-100/60 border-blue-200/80 hover:border-blue-400 text-slate-800 shadow-xs hover:shadow-md shadow-blue-500/5'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  systemLocked ? 'bg-slate-200 text-slate-400' : 'bg-blue-100 text-blue-600 shadow-xs'
                }`}
              >
                <Unlock className="w-6 h-6" strokeWidth={2} />
              </div>
              <div>
                <span className="block text-xs sm:text-sm font-black text-slate-800">Mở Cửa</span>
                <span className="text-[10px] text-slate-400 font-medium">Chốt mở trong 5s</span>
              </div>
            </motion.button>

            {/* Nút 2: Đóng Cửa */}
            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              disabled={actionLoading}
              onClick={() => onCommand('CLOSE_DOOR')}
              className="p-4 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/80 hover:to-slate-100/90 hover:border-slate-400 text-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs">
                <Lock className="w-6 h-6" strokeWidth={2} />
              </div>
              <div>
                <span className="block text-xs sm:text-sm font-black text-slate-800">Đóng Cửa</span>
                <span className="text-[10px] text-slate-400 font-medium">Khóa chốt an toàn</span>
              </div>
            </motion.button>

            {/* Nút 3: Khóa Khẩn Cấp (Chặn thao tác) */}
            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              disabled={actionLoading || systemLocked}
              onClick={() => onCommand('LOCK_SYSTEM')}
              className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center text-center gap-2 group cursor-pointer ${
                systemLocked
                  ? 'border-2 border-rose-500 bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30 animate-pulse'
                  : 'bg-gradient-to-br from-white to-rose-50/60 hover:to-rose-100/70 border-rose-200 hover:border-rose-400 text-slate-800 shadow-xs hover:shadow-md shadow-rose-500/5'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  systemLocked ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600 shadow-xs'
                }`}
              >
                <AlertTriangle className="w-6 h-6" strokeWidth={2} />
              </div>
              <div>
                <span className={`block text-xs sm:text-sm font-black ${systemLocked ? 'text-white' : 'text-rose-700'}`}>
                  {systemLocked ? 'Đang Phong Tỏa' : 'Khóa Khẩn Cấp'}
                </span>
                <span className={`text-[10px] font-medium ${systemLocked ? 'text-rose-100' : 'text-slate-400'}`}>
                  Chặn phím & thẻ từ
                </span>
              </div>
            </motion.button>

            {/* Nút 4: Mở Khóa Hệ Thống */}
            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              disabled={actionLoading || !systemLocked}
              onClick={() => onCommand('UNLOCK_SYSTEM')}
              className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center text-center gap-2 group ${
                systemLocked
                  ? 'border-2 border-emerald-400 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:brightness-105 active:scale-95 cursor-pointer ring-2 ring-emerald-300'
                  : 'bg-slate-50 border-slate-200/70 text-slate-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  systemLocked ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-400'
                }`}
              >
                <ShieldCheck className="w-6 h-6" strokeWidth={2} />
              </div>
              <div>
                <span className={`block text-xs sm:text-sm font-black ${systemLocked ? 'text-white' : 'text-slate-500'}`}>
                  Mở Khóa Hệ Thống
                </span>
                <span className={`text-[10px] font-medium ${systemLocked ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {systemLocked ? 'Bấm để khôi phục' : 'Đang hoạt động tốt'}
                </span>
              </div>
            </motion.button>
          </div>

          {/* Dải thông tin an ninh phụ */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>Các lệnh điều khiển được gửi tức thời qua kết nối bảo mật tới khóa cửa.</span>
          </div>
        </div>

        {/* CỘT PHẢI: MÔ PHỎNG AN NINH 3D & GIÁM SÁT CẢM BIẾN (Thay Thế Toàn Bộ Phần Log Cũ) (lg:col-span-7) */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          {/* Header Cột Phải */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Trạng Thái An Ninh Trực Quan</h4>
                <p className="text-[11px] text-slate-400">Mô phỏng chốt khóa và hệ thống cảm biến bảo vệ</p>
              </div>
            </div>

            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Giám Sát 24/7
            </span>
          </div>

          {/* VÒNG TRÒN AN NINH KỸ THUẬT SỐ TRUNG TÂM (Digital Security Vault Dial) */}
          <div className="py-4 flex flex-col items-center justify-center text-center relative">
            {/* Vòng tròn Radar Phát Sáng */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center mb-3">
              <div
                className={`absolute inset-0 rounded-full border-2 animate-ping opacity-20 ${
                  isDoorOpen ? 'border-amber-500' : 'border-emerald-500'
                }`}
              />
              <div
                className={`w-full h-full rounded-full border-4 flex items-center justify-center transition-all shadow-inner ${
                  isDoorOpen
                    ? 'border-amber-400/40 bg-gradient-to-tr from-amber-50 to-orange-50/60 shadow-amber-500/10'
                    : 'border-emerald-500/30 bg-gradient-to-tr from-emerald-50 to-teal-50/70 shadow-emerald-500/10'
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform ${
                    isDoorOpen
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-600 shadow-amber-500/30'
                      : 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/30'
                  }`}
                >
                  {isDoorOpen ? (
                    <DoorOpen className="w-8 h-8 stroke-[2.2]" />
                  ) : (
                    <Lock className="w-8 h-8 stroke-[2.2]" />
                  )}
                </div>
              </div>
            </div>

            <h5
              className={`text-base font-black tracking-tight ${
                isDoorOpen ? 'text-amber-800' : 'text-emerald-800'
              }`}
            >
              {isDoorOpen ? 'CỬA ĐANG MỞ' : 'KHÓA ĐANG ĐÓNG CHẶT'}
            </h5>
            <p className="text-xs text-slate-500 max-w-sm mt-0.5 leading-relaxed font-medium">
              {isDoorOpen
                ? 'Lối vào đang mở. Hệ thống sẽ tự động gửi cảnh báo sau 60 giây nếu chưa đóng lại.'
                : 'Chốt khóa điện từ đang gài chặt, cảm biến đóng khít bảo vệ ngôi nhà an toàn.'}
            </p>
          </div>

          {/* 3 Thẻ Trạng Thái Cảm Biến Bảo Vệ Nối Tiếp */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                  Cảm Biến Cửa
                </span>
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {isDoorOpen ? 'Tiếp Điểm Hở' : 'Đóng Khít'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                  Cảnh Báo 60s
                </span>
                <span className="text-xs font-bold text-slate-800 truncate block">
                  Tự Động Nhắc
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                  Bảo Vệ Đa Tầng
                </span>
                <span className="text-xs font-bold text-slate-800 truncate block">
                  Cấp Độ Tối Đa
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

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
  ScrollText,
  Clock,
  Loader2,
  KeyRound,
  Fingerprint,
  Smartphone,
  Sliders,
  AlertCircle,
  Activity,
} from 'lucide-react';

export default function SecurityTab({
  systemLocked = false,
  doorOpen = false,
  doorState = doorOpen ? 1 : 0,
  buzzerActive = false,
  onCommand,
  actionLoading = false,
  logs = [],
  onToggleBuzzer,
}) {
  const securityLogs = Array.isArray(logs) ? logs.slice(0, 30) : [];

  const getLogVisual = (action = '') => {
    const act = action.toUpperCase();
    if (act.includes('RFID')) {
      return {
        icon: Fingerprint,
        bg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        label: 'Thẻ từ RFID',
      };
    }
    if (act.includes('WEB') || act.includes('DASHBOARD') || act.includes('TỪ XA')) {
      return {
        icon: Smartphone,
        bg: 'bg-blue-50 text-blue-600 border-blue-200',
        label: 'Điều khiển Web',
      };
    }
    if (act.includes('PHONG TỎA') || act.includes('KHÓA') || act.includes('CHẶN')) {
      return {
        icon: ShieldAlert,
        bg: 'bg-rose-50 text-rose-600 border-rose-200',
        label: 'Cảnh báo bảo mật',
      };
    }
    if (act.includes('HỦY') || act.includes('MỞ LẠI') || act.includes('KHÔI PHỤC')) {
      return {
        icon: ShieldCheck,
        bg: 'bg-teal-50 text-teal-600 border-teal-200',
        label: 'Khôi phục hệ thống',
      };
    }
    if (act.includes('CÒI') || act.includes('BUZZER')) {
      return {
        icon: Volume2,
        bg: 'bg-amber-50 text-amber-600 border-amber-200',
        label: 'Còi báo động',
      };
    }
    return {
      icon: Activity,
      bg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      label: 'Hoạt động cửa',
    };
  };

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-5 w-full h-full flex flex-col justify-between select-none text-slate-800">
      
      {/* 1. Header Trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-bold tracking-wider uppercase mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>Quản Lý Khóa Cửa Thông Minh</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Bảng Điều Khiển An Ninh
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Theo dõi trạng thái chốt cửa, bảo vệ lối vào và quản lý truy cập khẩn cấp
          </p>
        </div>
      </div>

      {/* 2. Thẻ Khóa Hệ Thống (CHẶN THAO TÁC / MỞ QUYỀN TRUY CẬP) */}
      <div
        className={`p-5 sm:p-6 rounded-3xl transition-all duration-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden ${
          systemLocked
            ? 'emergency-alert-pulse bg-gradient-to-r from-rose-50/95 via-white to-rose-50/85'
            : 'bg-white border border-slate-200/80 hover:shadow-md hover:border-slate-300'
        }`}
      >
        {/* Nội dung bên trái */}
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform ${
              systemLocked
                ? 'bg-rose-100 text-rose-600 shadow-md shadow-rose-500/20'
                : 'bg-gradient-to-tr from-emerald-50 to-teal-50 text-emerald-600 border border-emerald-100 shadow-xs'
            }`}
          >
            {systemLocked ? (
              <ShieldAlert className="w-8 h-8 sm:w-9 sm:h-9 text-rose-600 animate-pulse" strokeWidth={1.8} />
            ) : (
              <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-600" strokeWidth={1.8} />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className={`text-base sm:text-lg font-black tracking-tight ${systemLocked ? 'text-rose-950' : 'text-slate-900'}`}>
                {systemLocked ? 'KHÓA HỆ THỐNG ĐANG BẬT' : 'KHÓA HỆ THỐNG'}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  systemLocked
                    ? 'bg-rose-600 text-white shadow-xs shadow-rose-600/30'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {systemLocked ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="beacon-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    <span>CẢNH BÁO PHONG TỎA</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Đang Cho Phép</span>
                  </>
                )}
              </span>
            </div>
            <p className={`text-xs sm:text-sm max-w-xl leading-relaxed ${systemLocked ? 'text-rose-700 font-medium' : 'text-slate-500'}`}>
              {systemLocked
                ? 'Toàn bộ phím bấm cảm ứng và đầu đọc thẻ từ tại cửa đang bị chặn tại chỗ.'
                : 'Vô hiệu hóa phím bấm và thẻ từ tại chỗ để bảo vệ cửa trước mọi can thiệp vật lý.'}
            </p>
          </div>
        </div>

        {/* Nút Chặn Thao Tác / Mở Quyền Truy Cập */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onCommand(systemLocked ? 'UNLOCK_SYSTEM' : 'LOCK_SYSTEM')}
          disabled={actionLoading}
          className={`w-full sm:w-auto sm:min-w-[170px] shrink-0 rounded-2xl px-5 py-3 text-xs font-black tracking-wider uppercase text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
            systemLocked
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25 ring-2 ring-emerald-300'
              : 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/25 ring-2 ring-rose-300'
          }`}
        >
          {actionLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : systemLocked ? (
            <ShieldCheck className="w-4 h-4 text-white" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-white" />
          )}
          <span>{systemLocked ? 'MỞ QUYỀN TRUY CẬP' : 'CHẶN THAO TÁC'}</span>
        </motion.button>
      </div>

      {/* 3. Dãy 3 Thẻ Chỉ Số Trạng Thái (KPI Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        {/* Chỉ số 1: Trạng Thái Cửa */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors border ${
                doorState === 2
                  ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                  : doorState === 1
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {doorState === 1 ? (
                <DoorOpen className="w-5 h-5" strokeWidth={1.8} />
              ) : (
                <DoorClosed className="w-5 h-5" strokeWidth={1.8} />
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
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              doorState === 2
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : doorState === 1
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                doorState === 2 ? 'bg-rose-600 animate-ping' : doorState === 1 ? 'bg-emerald-500' : 'bg-slate-500'
              }`}
            />
            {doorState === 1 ? 'Đang Mở' : doorState === 2 ? 'Kẹt Cửa' : 'Đang Đóng'}
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
          className={`p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer group ${
            buzzerActive ? 'ring-2 ring-rose-400/50 bg-rose-50/20' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors border ${
                buzzerActive
                  ? 'bg-rose-100 text-rose-600 border-rose-300 animate-pulse'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {buzzerActive ? (
                <Volume2 className="w-5 h-5 text-rose-600" strokeWidth={1.8} />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500" strokeWidth={1.8} />
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
              className={`text-[11px] font-extrabold ${
                buzzerActive ? 'text-rose-600' : 'text-slate-400'
              }`}
            >
              {buzzerActive ? 'Đang Bật' : 'Đang Tắt'}
            </span>
            <div
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                buzzerActive ? 'bg-rose-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  buzzerActive ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Chỉ số 3: Quyền Truy Cập (Tự động đổi viền đỏ nhấp nháy khi bị khóa) */}
        <div
          className={`p-4 rounded-3xl transition-all flex items-center justify-between ${
            systemLocked
              ? 'border-2 border-rose-400 bg-rose-50/50 shadow-sm shadow-rose-500/15 animate-pulse'
              : 'bg-white border border-slate-200/80 shadow-xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors border ${
                systemLocked
                  ? 'bg-rose-100 text-rose-600 border-rose-300'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}
            >
              {systemLocked ? (
                <Lock className="w-5 h-5" strokeWidth={1.8} />
              ) : (
                <Unlock className="w-5 h-5" strokeWidth={1.8} />
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
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
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

      {/* 4. Khung Điều Khiển Cửa & Lịch Sử Hoạt Động */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 flex-1 items-stretch">
        
        {/* CỘT TRÁI: 4 Nút Điều Khiển Cửa (Làm mới đẹp mắt, đồng nhất màu sắc) */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Sliders className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">Bảng Điều Khiển Lối Vào</h4>
            </div>
            <p className="text-xs text-slate-400">Chọn thao tác để gửi lệnh trực tiếp tới khóa cửa</p>
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
        </div>

        {/* CỘT PHẢI: Lịch Sử Hoạt Động (Danh sách sự kiện trực quan) */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <ScrollText className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">Lịch Sử Hoạt Động</h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Nhật ký mở cửa và cảnh báo an ninh gần nhất</p>
            </div>
            <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full font-mono shadow-xs">
              {securityLogs.length} hoạt động
            </span>
          </div>

          <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {securityLogs.length === 0 ? (
              <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 py-8 text-center text-slate-400">
                <div className="rounded-full bg-slate-50 p-3.5 border border-slate-100">
                  <ScrollText className="h-6 w-6 text-slate-300" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium">Chưa có hoạt động nào được ghi nhận.</span>
              </div>
            ) : (
              securityLogs.map((item, idx) => {
                const visual = getLogVisual(item.action);
                const ItemIcon = visual.icon;

                return (
                  <motion.div
                    key={item.id || idx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between hover:bg-white hover:border-slate-200 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border ${visual.bg}`}>
                        <ItemIcon className="w-4 h-4" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-800">{item.action}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {item.rfid_uid ? `Mã thẻ: ${item.rfid_uid}` : visual.label}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold font-mono text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-xs">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

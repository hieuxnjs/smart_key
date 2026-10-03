import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  KeyRound,
  Fingerprint,
  Smartphone,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Check,
  Lock,
  Eye,
  EyeOff,
  Radio,
  Save,
  Loader2,
  Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function HistoryPanel({
  logs = [],
  onUpdatePassword,
  onRefreshLogs,
  loadingLogs = false,
  autoModeEnabled = false,
  autoCloseDelay = 10,
  onSavePirSettings,
  savingPir = false,
}) {
  const [newPin, setNewPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [submittingPin, setSubmittingPin] = useState(false);

  // PIR Sensor local state
  const [pirActive, setPirActive] = useState(autoModeEnabled);
  const [pirDelay, setPirDelay] = useState(autoCloseDelay);

  useEffect(() => {
    setPirActive(autoModeEnabled);
  }, [autoModeEnabled]);

  useEffect(() => {
    setPirDelay(autoCloseDelay);
  }, [autoCloseDelay]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPin || newPin.length < 4) {
      toast.error('Mã PIN phải có ít nhất 4 chữ số');
      return;
    }

    setSubmittingPin(true);
    try {
      if (onUpdatePassword) {
        await onUpdatePassword(newPin);
        setNewPin('');
      }
    } finally {
      setSubmittingPin(false);
    }
  };

  const handlePirSave = async () => {
    if (onSavePirSettings) {
      await onSavePirSettings(pirActive, pirDelay);
    }
  };

  const getLogMeta = (log) => {
    const action = log.action || '';
    if (action.includes('RFID')) {
      return {
        icon: Fingerprint,
        bg: 'bg-emerald-50 text-emerald-600',
        title: log.rfid_uid ? `Thẻ RFID: ${log.rfid_uid}` : 'Quẹt thẻ RFID',
        subtitle: 'Đầu đọc RC522',
      };
    }
    if (action.includes('App') || action.includes('Dashboard') || action.includes('Web') || action.includes('REMOTE')) {
      return {
        icon: Smartphone,
        bg: 'bg-blue-50 text-blue-600',
        title: 'Mở qua Web Dashboard',
        subtitle: 'Lệnh điều khiển từ xa',
      };
    }
    if (action.includes('PIR') || action.includes('Auto') || action.includes('Tự động')) {
      return {
        icon: Radio,
        bg: 'bg-indigo-50 text-indigo-600',
        title: 'Tự động mở (PIR)',
        subtitle: 'Cảm biến chuyển động',
      };
    }
    if (action.includes('LOCKDOWN_ENABLED') || action.includes('Phong tỏa')) {
      return {
        icon: ShieldAlert,
        bg: 'bg-rose-50 text-rose-600',
        title: 'Bật phong tỏa khẩn cấp',
        subtitle: 'Đã khóa bàn phím & thẻ',
      };
    }
    if (action.includes('LOCKDOWN_DISABLED') || action.includes('Khôi phục')) {
      return {
        icon: ShieldCheck,
        bg: 'bg-amber-50 text-amber-600',
        title: 'Hủy phong tỏa',
        subtitle: 'Hệ thống an toàn',
      };
    }
    return {
      icon: KeyRound,
      bg: 'bg-slate-100 text-slate-600',
      title: action || 'Sự kiện cửa',
      subtitle: log.rfid_uid || 'Cảm biến kích hoạt',
    };
  };

  const formatLogTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Vừa xong';
    }
  };

  const safeLogs = Array.isArray(logs) ? logs : [];

  return (
    <div className="flex flex-col h-full justify-between space-y-3 select-none text-slate-800">
      
      {/* 1. TOP SECTION: Quick Logs List & Refresh Button */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800">Nhật Ký Hoạt Động</h3>
            <p className="text-[11px] text-slate-400">Các lần truy cập gần nhất từ MySQL</p>
          </div>
          
          {/* Refresh Button with Spinner only while loading */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onRefreshLogs}
            disabled={loadingLogs}
            className="w-7 h-7 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
            title="Làm mới nhật ký (GET /api/logs)"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin text-blue-600' : ''}`} />
          </motion.button>
        </div>

        {/* Scrollable Logs List with Light Empty State */}
        <div className="max-h-[160px] lg:max-h-[175px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
          <AnimatePresence initial={false}>
            {safeLogs.length === 0 ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="py-5 px-3 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center space-y-2 my-1"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
                    <Inbox className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-700">Chưa Có Dữ Liệu</h4>
                  <p className="text-[11px] text-slate-400 max-w-[220px] leading-relaxed">
                    Hãy quẹt thẻ để hệ thống ghi nhận.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[9px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Sẵn sàng ghi nhận</span>
                </div>
              </motion.div>
            ) : (
              safeLogs.slice(0, 6).map((log, index) => {
                const meta = getLogMeta(log);
                const Icon = meta.icon;

                return (
                  <motion.div
                    key={log.id || index}
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-white hover:shadow-xs border border-slate-100/90 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0 shadow-xs`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
                          {meta.title}
                        </h4>
                        <p className="text-[10px] text-slate-400">{meta.subtitle}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-2.5 h-2.5 text-slate-300" />
                        {formatLogTime(log.timestamp)}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. MIDDLE SECTION: PIR Auto Mode Sensor Controls */}
      <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-100 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Radio className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">Chế Độ Tự Động (PIR)</h4>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            pirActive
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-200 text-slate-600'
          }`}>
            {pirActive ? 'Đang Bật' : 'Tắt'}
          </span>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="pr-2">
            <p className="text-[11px] font-semibold text-slate-700">Cảm biến PIR tự mở khi tới gần</p>
            <p className="text-[10px] text-slate-400">
              {pirActive ? 'Tự mở khi phát hiện người' : 'Chỉ mở bằng RFID/PIN/Web'}
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => setPirActive(!pirActive)}
            className={`w-10 h-5.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${
              pirActive ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="bg-white w-4 h-4 rounded-full shadow-md"
            />
          </button>
        </div>

        {/* Range Slider for Auto-Close Delay */}
        <div className="space-y-0.5 pt-0.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span>Thời gian trễ tự đóng:</span>
            <span className="text-blue-600 font-bold font-mono">{pirDelay}s</span>
          </div>
          <input
            type="range"
            min="3"
            max="60"
            step="1"
            value={pirDelay}
            onChange={(e) => setPirDelay(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>3s</span>
            <span>30s</span>
            <span>60s</span>
          </div>
        </div>

        {/* Save PIR Settings Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={handlePirSave}
          disabled={savingPir}
          className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-60"
        >
          {savingPir ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang Lưu...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Lưu Cài Đặt Cảm Biến</span>
            </>
          )}
        </motion.button>
      </div>

      {/* 3. BOTTOM SECTION: Change Keypad PIN */}
      <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-100 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">Đổi Mã PIN Bàn Phím</h4>
          </div>
          <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
            ESP32
          </span>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-1.5">
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              maxLength={8}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Nhập PIN mới (4-8 số)"
              disabled={submittingPin}
              className="w-full px-3 py-1.5 text-xs font-mono tracking-wider rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            type="submit"
            disabled={submittingPin || !newPin}
            className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              !newPin || submittingPin
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
            }`}
          >
            {submittingPin ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang Cập Nhật...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Cập Nhật PIN</span>
              </>
            )}
          </motion.button>
        </form>
      </div>

    </div>
  );
}

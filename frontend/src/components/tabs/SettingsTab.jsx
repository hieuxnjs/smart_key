import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Radio,
  Sliders,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  Server,
  Database,
  AlertTriangle,
  Loader2,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsTab({
  autoModeEnabled = false,
  autoCloseDelay = 10,
  onSavePirSettings,
  savingPir = false,
  onUpdatePassword,
  mqttConnected = true,
  onClearLogs,
  clearingLogs = false,
}) {
  // PIR local state
  const [pirActive, setPirActive] = useState(autoModeEnabled);
  const [pirDelay, setPirDelay] = useState(autoCloseDelay);

  // PIN local state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [submittingPin, setSubmittingPin] = useState(false);

  useEffect(() => {
    setPirActive(autoModeEnabled);
  }, [autoModeEnabled]);

  useEffect(() => {
    setPirDelay(autoCloseDelay);
  }, [autoCloseDelay]);

  const handleSavePir = async () => {
    if (onSavePirSettings) {
      await onSavePirSettings(pirActive, pirDelay);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPin || newPin.length < 4) {
      toast.error('Mã PIN phải có ít nhất 4 chữ số');
      return;
    }
    if (confirmPin && newPin !== confirmPin) {
      toast.error('Mã PIN xác nhận không trùng khớp');
      return;
    }

    setSubmittingPin(true);
    try {
      if (onUpdatePassword) {
        await onUpdatePassword(newPin);
        setNewPin('');
        setConfirmPin('');
      }
    } finally {
      setSubmittingPin(false);
    }
  };

  return (
    <div className="space-y-4 w-full h-full flex flex-col justify-between select-none text-slate-800">
      
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
          Tham Số Hệ Thống & Phần Cứng
        </span>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight">
          Cấu Hình Hệ Thống
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Điều chỉnh tham số cảm biến PIR, mật mã chủ bàn phím và giám sát kết nối MQTT
        </p>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 items-stretch">
        
        {/* Cột Trái: Cảm Biến PIR & Đổi Mã PIN */}
        <div className="space-y-4 flex flex-col justify-between">
          
          {/* Khối 1: Cài Đặt Cảm Biến PIR */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-600">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Chế Độ Tự Động (Cảm Biến PIR)</h3>
                  <p className="text-[11px] text-slate-400">Cảm biến hồng ngoại thụ động AM312</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  pirActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {pirActive ? 'Đang Bật' : 'Tắt'}
              </span>
            </div>

            {/* Công tắc Toggle */}
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-700">Tự mở cửa khi có người lại gần</p>
                <p className="text-[11px] text-slate-400">
                  {pirActive ? 'Đang bật: Cảm biến phát hiện chuyển động để mở' : 'Đang tắt: Mở bằng RFID hoặc PIN'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPirActive(!pirActive)}
                className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${
                  pirActive ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="bg-white w-4.5 h-4.5 rounded-full shadow-md"
                />
              </button>
            </div>

            {/* Thanh trượt Range Slider */}
            <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Thời gian trễ tự đóng cửa:</span>
                <span className="text-blue-600 font-bold font-mono text-sm">{pirDelay} giây</span>
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
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>3s (Nhanh)</span>
                <span>30s</span>
                <span>60s (Chậm)</span>
              </div>
            </div>

            {/* Nút Lưu Cài Đặt */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSavePir}
              disabled={savingPir}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
            >
              {savingPir ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu Cấu Hình Cảm Biến</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Khối 2: Đổi Mã PIN Bàn Phím */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-blue-100 text-blue-600">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Đổi Mã PIN Bàn Phím Chủ</h3>
                  <p className="text-[11px] text-slate-400">Mã PIN mở khóa bàn phím ma trận tại cửa</p>
                </div>
              </div>
              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                ESP32
              </span>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={8}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Mã PIN mới (4-8 số)"
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div>
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={8}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Xác nhận mã PIN"
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submittingPin || !newPin}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
                  !newPin
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                }`}
              >
                {submittingPin ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu Mã PIN Mới</span>
                  </>
                )}
              </motion.button>
            </form>
          </div>

        </div>

        {/* Cột Phải: Thông Số MQTT & Khu Vực Nguy Hiểm */}
        <div className="space-y-4 flex flex-col justify-between">
          
          {/* Khối 3: Thông Số Điểm Cuối MQTT */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-indigo-100 text-indigo-600">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Trạng Thái Kết Nối & MQTT</h3>
                <p className="text-[11px] text-slate-400">Hạ tầng truyền tin HiveMQ và MySQL</p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-medium">
              <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Máy Chủ MQTT Broker</p>
                  <p className="text-[11px] font-mono text-slate-400">broker.hivemq.com:1883</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  mqttConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {mqttConnected ? 'Hoạt Động' : 'Mất Kết Nối'}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Topic Nhận Dữ Liệu (Status)</p>
                  <p className="text-[11px] font-mono text-slate-400">kma_lock/status</p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">QoS 1</span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Topic Gửi Lệnh (Control)</p>
                  <p className="text-[11px] font-mono text-slate-400">kma_lock/control</p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">QoS 1</span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Cơ Sở Dữ Liệu MySQL</p>
                  <p className="text-[11px] font-mono text-slate-400">MySQL 3306 (smart_lock)</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  Đã Kết Nối
                </span>
              </div>
            </div>
          </div>

          {/* Khối 4: Khu Vực Nguy Hiểm */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                Khu Vực Nguy Hiểm
              </h4>
            </div>
            <p className="text-xs text-rose-700/80 leading-relaxed">
              Xóa sạch toàn bộ bản ghi lịch sử trong bảng <strong>AccessLogs</strong> của MySQL. Hành động này không thể hoàn tác.
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClearLogs}
              disabled={clearingLogs}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-600 border border-rose-300 text-rose-700 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              {clearingLogs ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Xóa Sạch Toàn Bộ Nhật Ký</span>
            </motion.button>
          </div>

        </div>

      </div>

    </div>
  );
}

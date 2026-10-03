import React from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  DoorOpen,
  DoorClosed,
  Radio,
  Lock,
  Unlock,
  Volume2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SecurityTab({
  systemLocked = false,
  doorOpen = false,
  autoModeEnabled = false,
  mqttConnected = true,
  onToggleSystemLock,
  actionLoading = false,
  logs = [],
}) {
  const handleTestBuzzer = () => {
    toast.success('Đã gửi lệnh kiểm tra còi báo Buzzer tới ESP32 (Chân D2)!', { icon: '🔊' });
  };

  const securityLogs = (Array.isArray(logs) ? logs : []).filter(
    (l) =>
      l.action?.includes('LOCK') ||
      l.action?.includes('Cảnh báo') ||
      l.action?.includes('Alarm') ||
      l.action?.includes('ALERT') ||
      l.action?.includes('Sai') ||
      l.action?.includes('Phong tỏa')
  );

  return (
    <div className="space-y-4 w-full h-full flex flex-col justify-between select-none text-slate-800">
      
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
          An Ninh & Cảm Biến Ngoại Vi
        </span>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight">
          Trung Tâm Chỉ Huy
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Giám sát trạng thái cảm biến phần cứng, phong tỏa khẩn cấp và chống xâm nhập
        </p>
      </div>

      {/* Massive Emergency Lockdown Banner */}
      <div
        className={`p-4 sm:p-5 rounded-3xl transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${
          systemLocked
            ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/25'
            : 'bg-slate-50 text-slate-800 border-slate-100'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner ${
              systemLocked ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'
            }`}
          >
            {systemLocked ? (
              <ShieldAlert className="w-8 h-8 text-white animate-pulse" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base sm:text-lg font-black tracking-tight ${systemLocked ? 'text-white' : 'text-slate-800'}`}>
                {systemLocked ? 'ĐANG KÍCH HOẠT PHONG TỎA KHẨN CẤP' : 'CÔNG TẮC PHONG TỎA KHẨN CẤP'}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                  systemLocked ? 'bg-white text-rose-700 shadow-sm' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {systemLocked ? 'Phong Tỏa Bật' : 'An Toàn'}
              </span>
            </div>
            <p className={`text-xs mt-1 max-w-xl leading-relaxed ${systemLocked ? 'text-rose-100' : 'text-slate-500'}`}>
              {systemLocked
                ? 'Toàn bộ đầu đọc thẻ RFID và bàn phím ma trận tại cửa đã bị cô lập hoàn toàn.'
                : 'Khi kích hoạt, hệ thống sẽ ngắt ngay lập tức bàn phím và thẻ RFID để ngăn chặn đột nhập.'}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleSystemLock}
          disabled={actionLoading}
          className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto ${
            systemLocked
              ? 'bg-white text-rose-700 hover:bg-rose-50 shadow-sm'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25'
          }`}
        >
          {systemLocked ? 'HỦY PHONG TỎA' : 'KÍCH HOẠT PHONG TỎA'}
        </motion.button>
      </div>

      {/* Sensor Diagnostics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Sensor 1: Cửa Từ Nam Châm */}
        <div className={`p-3.5 rounded-2xl bg-slate-50 border shadow-xs flex items-center justify-between transition-colors ${
          doorOpen ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                doorOpen ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {doorOpen ? <DoorOpen className="w-5 h-5" /> : <DoorClosed className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Cửa Từ Nam Châm</h4>
              <p className="text-[10px] text-slate-400">
                {doorOpen ? 'Khung cửa đang mở' : 'Đã khép kín chốt'}
              </p>
            </div>
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full ${doorOpen ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}
          />
        </div>

        {/* Sensor 2: Cảm Biến PIR Chuyển Động */}
        <div className={`p-3.5 rounded-2xl bg-slate-50 border shadow-xs flex items-center justify-between transition-colors ${
          autoModeEnabled ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                autoModeEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
              }`}
            >
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Cảm Biến PIR</h4>
              <p className="text-[10px] text-slate-400">
                {autoModeEnabled ? 'Đang giám sát' : 'Đang tắt'}
              </p>
            </div>
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full ${autoModeEnabled ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`}
          />
        </div>

        {/* Sensor 3: Cảm Biến Chống Cạy Phá */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Cảm Biến Cạy Phá</h4>
              <p className="text-[10px] text-slate-400">Vỏ hộp kín (An toàn)</p>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>

        {/* Sensor 4: Khóa Bàn Phím & RFID */}
        <div className={`p-3.5 rounded-2xl bg-slate-50 border shadow-xs flex items-center justify-between transition-colors ${
          systemLocked ? 'border-rose-200 bg-rose-50/50' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                systemLocked ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {systemLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Khóa Bàn Phím / RFID</h4>
              <p className="text-[10px] text-slate-400">
                {systemLocked ? 'Bị vô hiệu hóa' : 'Sẵn sàng tiếp nhận'}
              </p>
            </div>
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full ${systemLocked ? 'bg-rose-500' : 'bg-emerald-500'}`}
          />
        </div>

      </div>

      {/* Security Action Bar & Incident Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 items-stretch">
        
        {/* Security Quick Actions */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Hành Động An Ninh</h4>
            <p className="text-xs text-slate-400 mt-0.5">Kiểm tra phần cứng và còi báo</p>
          </div>

          <div className="space-y-2.5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleTestBuzzer}
              className="w-full py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-bold flex items-center justify-between shadow-xs transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span>Kiểm Tra Còi Báo Động</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Chân D2</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onToggleSystemLock}
              className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs transition-all cursor-pointer ${
                systemLocked
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{systemLocked ? 'Hủy Phong Tỏa Cửa' : 'Kích Hoạt Phong Tỏa'}</span>
              </div>
              <span className="text-[10px] opacity-80">Ngắt tức thì</span>
            </motion.button>
          </div>

          <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-100 text-[11px] text-blue-700 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Kênh mã hóa bảo mật giữa Dashboard và ESP32.</span>
          </div>
        </div>

        {/* Security Events Stream */}
        <div className="lg:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Sự Kiện An Ninh & Cảnh Báo</h4>
              <p className="text-xs text-slate-400">Lịch sử phong tỏa, cảnh báo và đột nhập</p>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
              {securityLogs.length} sự kiện
            </span>
          </div>

          <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {securityLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <ShieldCheck className="w-7 h-7 text-emerald-500" />
                <span>Không có sự cố an ninh nào. Hệ thống an toàn tuyệt đối.</span>
              </div>
            ) : (
              securityLogs.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-center justify-between shadow-xs hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.action}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {item.rfid_uid ? `Mã thẻ: ${item.rfid_uid}` : 'Từ hệ thống'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

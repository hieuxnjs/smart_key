import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  DoorOpen,
  DoorClosed,
  Lock,
  Unlock,
  Volume2,
  AlertTriangle,
  ScrollText,
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
  const [activeButton, setActiveButton] = useState('open');
  const securityLogs = Array.isArray(logs) ? logs.slice(0, 30) : [];

  const handleControl = (button, command) => {
    setActiveButton(button);
    onCommand(command);
  };

  return (
    <div className="animate-fade-in space-y-4 w-full h-full flex flex-col justify-between select-none text-slate-800">
      
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
          Quản Lý Khóa Cửa
        </span>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-800 tracking-tight">
          Bảng Điều Khiển
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Theo dõi trạng thái cửa và bảo vệ lối vào
        </p>
      </div>

      {/* Massive Emergency Lockdown Banner */}
      <div
        className={`p-5 sm:p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          systemLocked
            ? 'bg-white text-slate-800 shadow-[0_8px_30px_rgba(244,63,94,0.10)]'
            : 'bg-white text-slate-800'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner ${
              systemLocked ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
            }`}
          >
            {systemLocked ? (
              <ShieldAlert className="w-8 h-8 text-rose-600 animate-pulse" strokeWidth={1.5} />
            ) : (
              <ShieldCheck className="w-8 h-8 text-emerald-600" strokeWidth={1.5} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold tracking-tight text-slate-800">
                KHÓA HỆ THỐNG
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                  systemLocked ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {systemLocked ? 'Đang Bị Khóa' : 'Đang Mở'}
              </span>
            </div>
            <p className="text-sm mt-1 max-w-xl leading-relaxed text-slate-400">
              {systemLocked
                ? 'Phím bấm và thẻ từ đang bị chặn tại chỗ.'
                : 'Vô hiệu hóa phím bấm và thẻ từ tại chỗ.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onCommand(systemLocked ? 'UNLOCK_SYSTEM' : 'LOCK_SYSTEM')}
          disabled={actionLoading}
          className={`w-full sm:w-auto sm:min-w-[150px] shrink-0 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50 ${systemLocked ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
        >
          {systemLocked ? 'MỞ QUYỀN TRUY CẬP' : 'CHẶN THAO TÁC'}
        </button>
      </div>

      {/* Trạng thái khóa cửa */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-3xl border border-indigo-100/50 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${doorState === 2 ? 'bg-rose-100 text-rose-600' : doorState === 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>
            {doorState === 1 ? <DoorOpen className="w-5 h-5" strokeWidth={1.5} /> : <DoorClosed className="w-5 h-5" strokeWidth={1.5} />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Trạng Thái Cửa</h4>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${doorState === 2 ? 'bg-rose-50 text-rose-600' : doorState === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>{doorState === 1 ? 'Đang Mở' : doorState === 2 ? 'Kẹt Cửa' : doorState === 0 ? 'Đang Đóng' : 'Chưa Có Dữ Liệu'}</span>
          </div>
        </div>

        <div
          role="switch"
          aria-checked={buzzerActive}
          aria-label={`Còi báo động ${buzzerActive ? 'đang bật' : 'đang tắt'}`}
          aria-disabled={!onToggleBuzzer || actionLoading}
          tabIndex={onToggleBuzzer && !actionLoading ? 0 : -1}
          onClick={() => {
            if (onToggleBuzzer && !actionLoading) onToggleBuzzer(!buzzerActive);
          }}
          onKeyDown={(event) => {
            if (onToggleBuzzer && !actionLoading && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              onToggleBuzzer(!buzzerActive);
            }
          }}
          className={`p-4 rounded-3xl border border-indigo-100/50 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-95 flex items-center gap-3 ${onToggleBuzzer && !actionLoading ? 'cursor-pointer' : 'cursor-wait opacity-70'}`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${buzzerActive ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'}`}>
            <Volume2 className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Còi Báo Động</h4>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${buzzerActive ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>{buzzerActive ? 'Đang Kêu' : 'Đang Tắt'}</span>
          </div>
          <span
            aria-hidden="true"
            className={`relative ml-auto inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${buzzerActive ? 'bg-rose-500' : 'bg-slate-300'}`}
          >
            <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${buzzerActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </span>
        </div>

        <div className="p-4 rounded-3xl border border-indigo-100/50 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${systemLocked ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {systemLocked ? <Lock className="w-5 h-5" strokeWidth={1.5} /> : <Unlock className="w-5 h-5" strokeWidth={1.5} />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Quyền Truy Cập</h4>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${systemLocked ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{systemLocked ? 'Bị Khóa' : 'Đang Mở'}</span>
          </div>
        </div>
      </div>

      {/* Security Action Bar & Incident Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
        
        {/* Điều Khiển Cửa */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Điều Khiển Cửa</h4>
            <p className="text-sm text-slate-400 mt-0.5">Chọn thao tác cần thực hiện</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button type="button" disabled={actionLoading || systemLocked} onClick={() => handleControl('open', 'OPEN_DOOR')} className={`flex h-28 flex-col items-center justify-center gap-2 rounded-2xl px-3 py-3 text-center text-sm font-medium transition-colors duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${activeButton === 'open' ? 'bg-violet-500 text-white shadow-md' : 'bg-white text-violet-500 hover:bg-violet-50'}`}><Unlock className="h-8 w-8 shrink-0" strokeWidth={2} /><span>Mở Cửa</span></button>
            <button type="button" disabled={actionLoading} onClick={() => handleControl('close', 'CLOSE_DOOR')} className={`flex h-28 flex-col items-center justify-center gap-2 rounded-2xl px-3 py-3 text-center text-sm font-medium transition-colors duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${activeButton === 'close' ? 'bg-slate-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-50'}`}><Lock className="h-8 w-8 shrink-0" strokeWidth={2} /><span>Đóng Cửa</span></button>
            <button type="button" disabled={actionLoading || systemLocked} onClick={() => handleControl('lock', 'LOCK_SYSTEM')} className={`flex h-28 flex-col items-center justify-center gap-2 rounded-2xl px-3 py-3 text-center text-sm font-medium transition-colors duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-100 ${activeButton === 'lock' || systemLocked ? 'animate-pulse bg-red-500 text-white shadow-md ring-2 ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border border-red-100 bg-white text-red-500 hover:bg-red-50'}`}><AlertTriangle className="h-8 w-8 shrink-0" strokeWidth={2} /><span>Khóa Khẩn Cấp</span></button>
            <button type="button" disabled={actionLoading || !systemLocked} onClick={() => handleControl('unlock', 'UNLOCK_SYSTEM')} className={`flex h-28 flex-col items-center justify-center gap-2 rounded-2xl px-3 py-3 text-center text-sm font-medium transition-colors duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${activeButton === 'unlock' ? 'bg-emerald-500 text-white shadow-md' : 'border border-emerald-100 bg-white text-emerald-500 hover:bg-emerald-50'}`}><ShieldCheck className="h-8 w-8 shrink-0" strokeWidth={2} /><span>Mở Khóa Hệ Thống</span></button>
          </div>
        </div>

        {/* Security Events Stream */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Lịch Sử Hoạt Động</h4>
              <p className="text-sm text-slate-400">Lịch sử mở cửa và cảnh báo</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {securityLogs.length} hoạt động
            </span>
          </div>

          <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {securityLogs.length === 0 ? (
              <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 py-8 text-center text-sm text-gray-400">
                <div className="rounded-full bg-slate-50 p-3"><ScrollText className="h-7 w-7 text-slate-300" strokeWidth={1.5} /></div>
                <span>Chưa có hoạt động nào được ghi nhận.</span>
              </div>
            ) : (
              securityLogs.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 rounded-2xl bg-white flex items-center justify-between shadow-[0_4px_18px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                      <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
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

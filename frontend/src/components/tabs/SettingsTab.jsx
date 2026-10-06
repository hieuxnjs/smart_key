import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  KeyRound,
  Eye,
  EyeOff,
  Save,
  Server,
  AlertTriangle,
  Loader2,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsTab({
  onUpdatePassword,
  onForgotPassword,
  mqttConnected = true,
  onClearLogs,
  clearingLogs = false,
}) {
  // PIN local state
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [submittingPin, setSubmittingPin] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!oldPin || !/^\d{4,8}$/.test(newPin)) {
      toast.error('Vui lòng nhập mật khẩu cũ và mật khẩu mới gồm 4-8 chữ số.');
      return;
    }
    setSubmittingPin(true);
    try {
      if (onUpdatePassword) {
        const updated = await onUpdatePassword(oldPin, newPin);
        if (updated) {
          setOldPin('');
          setNewPin('');
        }
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
          Tùy Chỉnh Khóa Cửa
        </span>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight">
          Cài Đặt Khóa Cửa
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Quản lý mật khẩu mở cửa và trạng thái kết nối
        </p>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 items-stretch">
        
        {/* Cột Trái: Cập nhật mật khẩu */}
        <div className="space-y-4 flex flex-col justify-between">
          
          {/* Khối 1: Đổi mật khẩu */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-blue-100 text-blue-600">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Đổi Mật Khẩu Mở Cửa</h3>
                  <p className="text-[11px] text-slate-400">Cập nhật mật khẩu dùng để mở cửa</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-2.5">
              <div className="space-y-2.5">
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={8}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="Nhập mật khẩu cũ"
                  aria-label="Nhập mật khẩu cũ"
                  inputMode="numeric"
                  autoComplete="current-password"
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={8}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Nhập mật khẩu mới (4-8 số)"
                    aria-label="Nhập mật khẩu mới"
                    inputMode="numeric"
                    autoComplete="new-password"
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submittingPin || !oldPin || !newPin}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
                  !oldPin || !newPin
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                }`}
              >
                {submittingPin ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu Mật Khẩu</span>
                  </>
                )}
              </motion.button>
              <button type="button" onClick={onForgotPassword} className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-800">
                Quên mật khẩu khóa?
              </button>
            </form>
          </div>

        </div>

        {/* Cột Phải: Trạng thái kết nối và quản lý nhật ký */}
        <div className="space-y-4 flex flex-col justify-between">
          
          {/* Khối 2: Trạng thái kết nối */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-indigo-100 text-indigo-600">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Trạng Thái Kết Nối</h3>
                <p className="text-[11px] text-slate-400">Kết nối khóa cửa và lưu trữ dữ liệu</p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-medium">
              <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Khóa cửa</p>
                  <p className="text-[11px] text-slate-400">Kết nối tới khóa thông minh</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  mqttConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {mqttConnected ? 'Hoạt Động' : 'Mất Kết Nối'}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Trạng thái hoạt động</p>
                  <p className="text-[11px] text-slate-400">Nhận cập nhật từ khóa cửa</p>
                </div>
                <span className="text-[11px] text-slate-400">Đang theo dõi</span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Điều khiển từ xa</p>
                  <p className="text-[11px] text-slate-400">Gửi lệnh mở hoặc khóa cửa</p>
                </div>
                <span className="text-[11px] text-slate-400">Sẵn sàng</span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Nhật ký hoạt động</p>
                  <p className="text-[11px] text-slate-400">Lưu lại lịch sử sử dụng</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  Đã Kết Nối
                </span>
              </div>
            </div>
          </div>

          {/* Khối 3: Xóa nhật ký */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                Khu Vực Nguy Hiểm
              </h4>
            </div>
            <p className="text-xs text-rose-700/80 leading-relaxed">
              Xóa toàn bộ nhật ký hoạt động. Hành động này không thể hoàn tác.
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

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ShieldAlert,
  ShieldCheck,
  DoorOpen,
  DoorClosed,
  TrendingUp,
  RotateCcw,
  KeyRound,
  Fingerprint,
  Smartphone,
  Check,
  Loader2,
  Clock,
  Inbox,
  Eye,
  EyeOff,
  ArrowRight,
  Activity,
} from 'lucide-react';

import MainLayout from '../layouts/MainLayout';
import CenterControl from '../components/CenterControl';
import SecurityTab from '../components/tabs/SecurityTab';
import HistoryTab from '../components/tabs/HistoryTab';
import RfidTab from '../components/tabs/RfidTab';
import SettingsTab from '../components/tabs/SettingsTab';
import PasswordResetModal from '../components/PasswordResetModal';

const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function Dashboard() {
  const navigate = useNavigate();

  // Navigation tab state ('dashboard' | 'security' | 'history' | 'rfid' | 'settings')
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);

  // Hardware telemetry states
  const [doorOpen, setDoorOpen] = useState(false);
  const [doorState, setDoorState] = useState(0);
  const [buzzerActive, setBuzzerActive] = useState(false);
  const [systemLocked, setSystemLocked] = useState(false);
  const [mqttConnected, setMqttConnected] = useState(true);
  const [autoCloseDelay, setAutoCloseDelay] = useState(10);
  const [logs, setLogs] = useState([]);
  
  // Loading & Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);

  // Local state for Quick Settings in Dashboard
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [submittingPin, setSubmittingPin] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return (
        JSON.parse(sessionStorage.getItem('user')) ||
        JSON.parse(localStorage.getItem('user')) ||
        null
      );
    } catch {
      return null;
    }
  });

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Đã đăng xuất khỏi hệ thống an toàn', { icon: '👋' });
    navigate('/login', { replace: true });
  }, [navigate]);

  // 1. GET /api/status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/status`, { headers: getAuthHeaders() });
      if (res.data.success) {
        setDoorOpen(Boolean(res.data.doorOpen));
        if ([0, 1, 2].includes(Number(res.data.doorState))) setDoorState(Number(res.data.doorState));
        setBuzzerActive(Boolean(res.data.buzzerActive));
        setSystemLocked(Boolean(res.data.systemLocked));
        setMqttConnected(Boolean(res.data.mqttConnected));
        if (typeof res.data.autoCloseDelay === 'number') setAutoCloseDelay(res.data.autoCloseDelay);
      }
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
  }, [handleLogout]);

  // 3. GET /api/logs
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await axios.get(`${API_BASE}/logs`, { headers: getAuthHeaders() });
      if (res.data.success && Array.isArray(res.data.data)) {
        setLogs(res.data.data);
      } else {
        setLogs([]);
      }
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    } finally {
      setLoadingLogs(false);
    }
  }, [handleLogout]);

  // Manual Full Refresh Button Trigger
  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchStatus(), fetchLogs()]);
      toast.success('Đã cập nhật dữ liệu mới nhất!', { icon: '🔄' });
    } catch {
      toast.error('Lỗi khi làm mới dữ liệu');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchLogs();

    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchStatus, fetchLogs]);

  // Weekly unlocks calculation
  const weeklyData = useMemo(() => {
    const days = [
      { day: 'T2', dayIndex: 1 },
      { day: 'T3', dayIndex: 2 },
      { day: 'T4', dayIndex: 3 },
      { day: 'T5', dayIndex: 4 },
      { day: 'T6', dayIndex: 5 },
      { day: 'T7', dayIndex: 6 },
      { day: 'CN', dayIndex: 0 },
    ];
    
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    (Array.isArray(logs) ? logs : []).forEach((l) => {
      try {
        const d = new Date(l.timestamp);
        const day = d.getDay();
        counts[day] = (counts[day] || 0) + 1;
      } catch {}
    });

    const maxCount = Math.max(...Object.values(counts), 1);

    return days.map(({ day, dayIndex }) => {
      const count = counts[dayIndex] || 0;
      const height = count === 0 ? '6px' : `${Math.max(14, Math.round((count / maxCount) * 100))}%`;
      return { day, count, height };
    });
  }, [logs]);

  const totalUnlocksCount = useMemo(() => (Array.isArray(logs) ? logs.length : 0), [logs]);

  // Remote Door Open
  const handleOpenDoor = async () => {
    if (systemLocked) {
      toast.error('Hệ thống đang khóa quyền truy cập. Hãy mở lại quyền trước.', { icon: '⚠️' });
      return;
    }

    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/control/open`, {}, { headers: getAuthHeaders() });
      if (res.data.success) {
        setDoorOpen(true);
        toast.success(res.data.message || 'Đã gửi lệnh mở cửa từ xa thành công!', { icon: '🔓' });
        if (res.data.log) {
          setLogs((prev) => [res.data.log, ...(Array.isArray(prev) ? prev : [])]);
        }
        setTimeout(() => setDoorOpen(false), (autoCloseDelay || 5) * 1000);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể mở cửa. Kiểm tra kết nối server.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Lockdown
  const handleToggleSystemLock = async () => {
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/control/toggle-system-lock`, {}, { headers: getAuthHeaders() });
      if (res.data.success) {
        setSystemLocked(res.data.systemLocked);
        if (res.data.systemLocked) {
          toast.error(res.data.message || 'Đã khóa quyền truy cập.', { icon: '🚨' });
        } else {
          toast.success(res.data.message || 'Đã mở lại quyền truy cập.', { icon: '✅' });
        }
        if (res.data.log) {
          setLogs((prev) => [res.data.log, ...(Array.isArray(prev) ? prev : [])]);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể đổi quyền truy cập.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeviceCommand = async (command) => {
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/control/command`, { command }, { headers: getAuthHeaders() });
      if (res.data.success) {
        setSystemLocked(Boolean(res.data.systemLocked));
        if (command === 'BUZZER_ON' || command === 'BUZZER_OFF') {
          setBuzzerActive(Boolean(res.data.buzzerActive));
        }
        toast.success(res.data.message || 'Đã gửi lệnh tới khóa cửa.');
        if (res.data.log) setLogs((prev) => [res.data.log, ...(Array.isArray(prev) ? prev : [])]);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể điều khiển khóa cửa.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetLockPassword = async (webPassword, newPin) => {
    try {
      const res = await axios.post(
        `${API_BASE}/settings/password/reset`,
        { admin_pass: webPassword, pin: newPin },
        { headers: getAuthHeaders() },
      );
      toast.success(res.data.message || 'Đã đặt lại mật khẩu khóa.');
      fetchLogs();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể đặt lại mật khẩu khóa.');
      return false;
    }
  };

  // Update PIN
  const handleUpdatePassword = async (oldPassword, newPassword) => {
    if (!oldPassword || !/^\d{4,8}$/.test(newPassword || '')) {
      toast.error('Vui lòng nhập mật khẩu cũ và mật khẩu mới gồm 4-8 chữ số.');
      return false;
    }

    setSubmittingPin(true);
    try {
      const res = await axios.post(
        `${API_BASE}/settings/password`,
        { oldPassword, newPassword },
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast.success(res.data.message || 'Đã cập nhật mật khẩu mở cửa!', { icon: '🔑' });
        setCurrentPin('');
        setNewPin('');
        fetchLogs();
        return true;
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể cập nhật mật khẩu mở cửa.');
      return false;
    } finally {
      setSubmittingPin(false);
    }
  };

  // Clear Logs
  const handleClearLogs = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sạch toàn bộ nhật ký truy cập không?')) return;
    setClearingLogs(true);
    try {
      const res = await axios.delete(`${API_BASE}/logs`, { headers: getAuthHeaders() });
      if (res.data.success) {
        setLogs([]);
        toast.success(res.data.message || 'Đã xóa sạch nhật ký!', { icon: '🗑️' });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi xóa nhật ký.');
    } finally {
      setClearingLogs(false);
    }
  };

  // Helper log badge metadata
  const getLogMeta = (log) => {
    const action = log.action || '';
    if (action.includes('RFID')) {
      return {
        icon: Fingerprint,
        bg: 'bg-emerald-50 text-emerald-600',
        title: log.rfid_uid ? `Thẻ từ: ${log.rfid_uid}` : 'Mở cửa bằng thẻ từ',
        subtitle: 'Truy cập bằng thẻ',
      };
    }
    if (action.includes('App') || action.includes('Dashboard') || action.includes('Web') || action.includes('REMOTE')) {
      return {
        icon: Smartphone,
        bg: 'bg-blue-50 text-blue-600',
        title: 'Mở qua Web Dashboard',
        subtitle: 'Lệnh từ xa',
      };
    }
    if (action.includes('PIR') || action.includes('Auto') || action.includes('Tự động')) {
      return {
        icon: KeyRound,
        bg: 'bg-indigo-50 text-indigo-600',
        title: 'Mở cửa tự động',
        subtitle: 'Hoạt động của khóa cửa',
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
      subtitle: log.rfid_uid ? `Thẻ từ ${log.rfid_uid}` : 'Hoạt động của khóa cửa',
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
    <>
    <MainLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      currentUser={currentUser}
      onLogout={handleLogout}
      isProfileOpen={isProfileOpen}
      setIsProfileOpen={setIsProfileOpen}
      systemLocked={systemLocked}
      onToggleSystemLock={handleToggleSystemLock}
    >
      <AnimatePresence mode="wait">
        
        {/* ========================================================
            TAB 1: BẢNG ĐIỀU KHIỂN CHÍNH (BỐ CỤC ĐẦY ĐẶN, KHÔNG BỊ TRỐNG)
           ======================================================== */}
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col space-y-4"
          >
            {/* 1. Header Toolbar & Quick Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
                  HỆ THỐNG KHÓA THÔNG MINH
                </span>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight">
                  Bảng Điều Khiển Khóa Cửa
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Theo dõi trạng thái cửa, quản lý quyền truy cập và xem nhật ký hoạt động
                </p>
              </div>

              {/* Action Buttons Header */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleManualRefresh}
                  disabled={refreshing || loadingLogs}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  title="Cập nhật lại trạng thái phần cứng và nhật ký"
                >
                  <RotateCcw className={`w-3.5 h-3.5 text-blue-600 ${refreshing || loadingLogs ? 'animate-spin' : ''}`} />
                  <span>Làm Mới</span>
                </motion.button>
              </div>
            </div>

            {/* 2. DÃY 4 THẺ CHỈ SỐ TỔNG QUAN (KPI METRICS STRIP - GIẢM TRỐNG TOÀN DIỆN) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              
              {/* Metric 1: Cửa Từ */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      doorState === 2
                        ? 'bg-rose-100 text-rose-600'
                        : doorState === 1
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {doorState === 1 ? <DoorOpen className="w-5 h-5" /> : <DoorClosed className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Khóa Cửa
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-800">
                      {doorState === 1 ? 'Đang Mở' : doorState === 2 ? 'Kẹt Cửa' : 'Đang Đóng'}
                    </h4>
                  </div>
                </div>
                <span
                  className={`w-2 h-2 rounded-full ${
                    doorState === 2 ? 'bg-rose-500 animate-pulse' : doorState === 1 ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'
                  }`}
                />
              </div>

              {/* Metric 2: Quyền Truy Cập */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      systemLocked ? 'bg-rose-500 text-white shadow-sm' : 'bg-blue-600 text-white'
                    }`}
                  >
                    {systemLocked ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Quyền Truy Cập
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-800">
                      {systemLocked ? 'Bị Khóa' : 'Đang Mở'}
                    </h4>
                  </div>
                </div>
                <span
                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                    systemLocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {systemLocked ? 'Khóa' : 'Sẵn Sàng'}
                </span>
              </div>

              {/* Metric 4: Tổng Lượt Mở Tuần */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Lượt Mở Trong Tuần
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-800">
                      {totalUnlocksCount} Lượt Mở
                    </h4>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  Đã lưu
                </span>
              </div>

            </div>

            {/* 3. BỐ CỤC CHÍNH ĐƯỢC CÂN BẰNG (12 CỘT: 7 CỘT BÊN TRÁI + 5 CỘT BÊN PHẢI) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1">
              
              {/* KHỐI TRÁI (7 CỘT): ĐIỀU KHIỂN MỞ CỬA & BIỂU ĐỒ PHÂN TÍCH */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                
                {/* 3.1 Vòng xoay điều khiển chính kèm nút thao tác nhanh */}
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-50/80 border border-slate-100 shadow-xs flex flex-col items-center justify-between space-y-3">
                  <CenterControl
                    doorOpen={doorOpen}
                    systemLocked={systemLocked}
                    onOpenDoor={handleOpenDoor}
                    actionLoading={actionLoading}
                    mqttConnected={mqttConnected}
                    />

                  {/* Nút thao tác an ninh ngay dưới CenterControl */}
                  <div className="w-full flex items-center justify-center gap-3 pt-1 border-t border-slate-200/60">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleToggleSystemLock}
                      disabled={actionLoading}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 ${
                        systemLocked
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25'
                      }`}
                    >
                      {systemLocked ? (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Mở Quyền Truy Cập</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-4 h-4" />
                          <span>Chặn Thao Tác</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* 3.2 Biểu Đồ Thống Kê & Phân Tích Tuần (Weekly Chart) */}
                <div className="p-4 rounded-3xl bg-slate-50/80 border border-slate-100 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Thống Kê Xu Hướng Mở Cửa</h4>
                        <p className="text-[10px] text-slate-400">Tần suất mở theo các ngày trong tuần</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 font-mono">
                      Tổng: {totalUnlocksCount} lượt
                    </span>
                  </div>

                  {/* Bar Chart 7 Days */}
                  <div className="flex items-end justify-between h-20 pt-2 px-2 gap-2.5 sm:gap-4">
                    {weeklyData.map((item, idx) => (
                      <div key={item.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <span className="text-[9px] font-mono text-slate-400 font-bold">
                          {item.count > 0 ? item.count : ''}
                        </span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: item.height }}
                          transition={{ duration: 0.5, delay: idx * 0.04, ease: 'easeOut' }}
                          className={`w-full rounded-lg ${
                            item.count > 0
                              ? 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-xs shadow-blue-500/25'
                              : 'bg-slate-200'
                          }`}
                          title={`${item.day}: ${item.count} lượt mở`}
                        />
                        <span className="text-[10px] font-bold text-slate-500">{item.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* KHỐI PHẢI (5 CỘT): NHẬT KÝ THỜI GIAN THỰC & CÀI ĐẶT NHANH */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                
                {/* 3.3 Bảng Nhật Ký Hoạt Động (Live Activity Feed) */}
                <div className="p-4 rounded-3xl bg-slate-50/80 border border-slate-100 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Nhật Ký Hoạt Động Gần Nhất</h3>
                      <p className="text-[11px] text-slate-400">Nhật ký truy cập gần đây</p>
                    </div>

                    <button
                      onClick={() => setActiveTab('history')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Xem tất cả</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Danh sách nhật ký cuộn mượt mà */}
                  <div className="max-h-[195px] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                    <AnimatePresence initial={false}>
                      {safeLogs.length === 0 ? (
                        <div className="py-6 px-3 text-center rounded-2xl bg-white border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-2">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Inbox className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-700">Chưa có dữ liệu</p>
                          <p className="text-[11px] text-slate-400">Hãy quẹt thẻ để hệ thống ghi nhận.</p>
                        </div>
                      ) : (
                        safeLogs.slice(0, 6).map((log, index) => {
                          const meta = getLogMeta(log);
                          const Icon = meta.icon;

                          return (
                            <motion.div
                              key={log.id || index}
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="p-2.5 rounded-xl bg-white hover:shadow-xs border border-slate-100 flex items-center justify-between group transition-all"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0 shadow-xs`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                    {meta.title}
                                  </h4>
                                  <p className="text-[10px] text-slate-400">{meta.subtitle}</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-semibold text-slate-400 font-mono flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-slate-300" />
                                {formatLogTime(log.timestamp)}
                              </span>
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Cập nhật mật khẩu mở cửa */}
                <div className="p-4 rounded-3xl bg-slate-50/80 border border-slate-100 shadow-xs space-y-3.5">
                  <form onSubmit={(e) => { e.preventDefault(); handleUpdatePassword(currentPin, newPin); }} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800">Đổi Mật Khẩu Mở Cửa</h4>
                    </div>
                    <input
                      type={showPin ? 'text' : 'password'}
                      maxLength={8}
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value)}
                      placeholder="Nhập mật khẩu cũ"
                      aria-label="Nhập mật khẩu cũ"
                      inputMode="numeric"
                      autoComplete="current-password"
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                        {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={submittingPin || !currentPin || !newPin}
                      className={`w-full py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${!currentPin || !newPin || submittingPin ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'}`}
                    >
                      {submittingPin ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      <span>Lưu Mật Khẩu</span>
                    </button>
                    <button type="button" onClick={() => setIsPasswordResetOpen(true)} className="w-full text-center text-[11px] font-semibold text-blue-600 hover:text-blue-800">
                      Quên mật khẩu khóa?
                    </button>
                  </form>
                </div>
              </div>

            </div>

          </motion.div>
        )}

        {/* TAB 2: TRUNG TÂM CHỈ HUY */}
        {activeTab === 'security' && (
          <motion.div key="security" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="flex-1 flex flex-col">
            <SecurityTab
              systemLocked={systemLocked}
              doorOpen={doorOpen}
              doorState={doorState}
              buzzerActive={buzzerActive}
              onCommand={handleDeviceCommand}
              onToggleBuzzer={(enabled) => handleDeviceCommand(enabled ? 'BUZZER_ON' : 'BUZZER_OFF')}
              actionLoading={actionLoading}
              logs={logs}
            />
          </motion.div>
        )}

        {/* TAB 3: NHẬT KÝ TRUY CẬP */}
        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="flex-1 flex flex-col">
            <HistoryTab logs={logs} onRefreshLogs={fetchLogs} loadingLogs={loadingLogs} />
          </motion.div>
        )}

        {/* TAB 4: QUẢN LÝ THẺ RFID */}
        {activeTab === 'rfid' && (
          <motion.div key="rfid" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="flex-1 flex flex-col">
            <RfidTab onOpenDoor={handleOpenDoor} />
          </motion.div>
        )}

        {/* TAB 5: CẤU HÌNH HỆ THỐNG */}
        {activeTab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="flex-1 flex flex-col">
            <SettingsTab onUpdatePassword={handleUpdatePassword} onForgotPassword={() => setIsPasswordResetOpen(true)} mqttConnected={mqttConnected} onClearLogs={handleClearLogs} clearingLogs={clearingLogs} />
          </motion.div>
        )}

      </AnimatePresence>
    </MainLayout>
    <PasswordResetModal
      key={isPasswordResetOpen ? 'open' : 'closed'}
      isOpen={isPasswordResetOpen}
      onClose={() => setIsPasswordResetOpen(false)}
      onReset={handleResetLockPassword}
    />
    </>
  );
}

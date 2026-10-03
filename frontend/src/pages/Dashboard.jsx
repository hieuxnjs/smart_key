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
  Radio,
  Lock,
  Unlock,
  KeyRound,
  Fingerprint,
  Smartphone,
  Check,
  Save,
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

  // Hardware telemetry states
  const [doorOpen, setDoorOpen] = useState(false);
  const [systemLocked, setSystemLocked] = useState(false);
  const [mqttConnected, setMqttConnected] = useState(true);
  const [autoModeEnabled, setAutoModeEnabled] = useState(false);
  const [autoCloseDelay, setAutoCloseDelay] = useState(10);
  const [logs, setLogs] = useState([]);
  
  // Loading & Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingPir, setSavingPir] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);

  // Local state for Quick Settings in Dashboard
  const [pirActive, setPirActive] = useState(false);
  const [pirDelay, setPirDelay] = useState(10);
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
        setSystemLocked(Boolean(res.data.systemLocked));
        setMqttConnected(Boolean(res.data.mqttConnected));
        if (typeof res.data.autoModeEnabled !== 'undefined') {
          setAutoModeEnabled(res.data.autoModeEnabled);
          setPirActive(res.data.autoModeEnabled);
        }
        if (typeof res.data.autoCloseDelay !== 'undefined') {
          setAutoCloseDelay(res.data.autoCloseDelay);
          setPirDelay(res.data.autoCloseDelay);
        }
      }
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
  }, [handleLogout]);

  // 2. GET /api/settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/settings`, { headers: getAuthHeaders() });
      if (res.data.success && res.data.data) {
        setAutoModeEnabled(Boolean(res.data.data.auto_mode_enabled));
        setPirActive(Boolean(res.data.data.auto_mode_enabled));
        setAutoCloseDelay(res.data.data.auto_close_delay || 10);
        setPirDelay(res.data.data.auto_close_delay || 10);
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
      await Promise.all([fetchStatus(), fetchLogs(), fetchSettings()]);
      toast.success('Đã cập nhật dữ liệu mới nhất!', { icon: '🔄' });
    } catch {
      toast.error('Lỗi khi làm mới dữ liệu');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchSettings();
    fetchLogs();

    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchStatus, fetchSettings, fetchLogs]);

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
      toast.error('Hệ thống đang Phong Tỏa Khẩn Cấp! Vui lòng hủy phong tỏa trước.', { icon: '⚠️' });
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
          toast.error(res.data.message || 'ĐÃ KÍCH HOẠT PHONG TỎA KHẨN CẤP!', { icon: '🚨' });
        } else {
          toast.success(res.data.message || 'Đã hủy phong tỏa hệ thống.', { icon: '✅' });
        }
        if (res.data.log) {
          setLogs((prev) => [res.data.log, ...(Array.isArray(prev) ? prev : [])]);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi chuyển trạng thái phong tỏa.');
    } finally {
      setActionLoading(false);
    }
  };

  // Save PIR settings
  const handleSavePirSettings = async () => {
    setSavingPir(true);
    try {
      const res = await axios.post(
        `${API_BASE}/settings`,
        { auto_mode_enabled: pirActive, auto_close_delay: pirDelay },
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        setAutoModeEnabled(pirActive);
        setAutoCloseDelay(pirDelay);
        toast.success('Đã lưu cấu hình cảm biến PIR!', { icon: '✨' });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi cập nhật cảm biến PIR.');
    } finally {
      setSavingPir(false);
    }
  };

  // Update PIN
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPin || newPin.length < 4) {
      toast.error('Mã PIN phải có ít nhất 4 chữ số');
      return;
    }

    setSubmittingPin(true);
    try {
      const res = await axios.post(
        `${API_BASE}/settings/password`,
        { newPassword: newPin },
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast.success(res.data.message || 'Đã đổi mã PIN mở cửa!', { icon: '🔑' });
        setNewPin('');
        fetchLogs();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi đổi mã PIN.');
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
        title: log.rfid_uid ? `Thẻ RFID: ${log.rfid_uid}` : 'Quẹt thẻ RFID',
        subtitle: 'Đầu đọc RC522',
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
                  ESP32 Smart Lock System
                </span>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight">
                  Trung Tâm Bảo Mật
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Giám sát cảm biến thời gian thực, điều khiển khóa điện từ và nhật ký truy cập
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              {/* Metric 1: Cửa Từ */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      doorOpen
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {doorOpen ? <DoorOpen className="w-5 h-5" /> : <DoorClosed className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Khóa Cửa Từ
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-800">
                      {doorOpen ? 'Cửa Đang Mở' : 'Cửa Đang Đóng'}
                    </h4>
                  </div>
                </div>
                <span
                  className={`w-2 h-2 rounded-full ${
                    doorOpen ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'
                  }`}
                />
              </div>

              {/* Metric 2: Phong Tỏa An Ninh */}
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
                      Trạng Thái An Ninh
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-800">
                      {systemLocked ? 'Đang Phong Tỏa' : 'Bảo Vệ Chuẩn'}
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

              {/* Metric 3: Cảm Biến PIR */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      autoModeEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Tự Động Hóa PIR
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-800">
                      {autoModeEnabled ? 'Đang Bật (Tự Mở)' : 'Đang Tắt'}
                    </h4>
                  </div>
                </div>
                <span className="text-[11px] font-bold font-mono text-blue-600">
                  {autoCloseDelay}s
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
                  MySQL
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
                    autoModeEnabled={autoModeEnabled}
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
                          <span>Hủy Phong Tỏa Hệ Thống</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-4 h-4" />
                          <span>Kích Hoạt Phong Tỏa Khẩn Cấp</span>
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
                      <p className="text-[11px] text-slate-400">Tự động đồng bộ với MySQL</p>
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

                {/* 3.4 Cài Đặt Nhanh Cảm Biến PIR & Mã PIN */}
                <div className="p-4 rounded-3xl bg-slate-50/80 border border-slate-100 shadow-xs space-y-3.5">
                  
                  {/* PIR Switch */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600">
                          <Radio className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">Cảm Biến Tự Động PIR</h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        pirActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {pirActive ? 'Đang Bật' : 'Tắt'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <p className="text-[11px] text-slate-500">Tự mở cửa khi có người lại gần</p>
                      <button
                        type="button"
                        onClick={() => setPirActive(!pirActive)}
                        className={`w-10 h-5.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                          pirActive ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <motion.div layout className="bg-white w-4.5 h-4.5 rounded-full shadow-md" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>Thời gian trễ:</span>
                        <span className="text-blue-600 font-bold font-mono">{pirDelay}s</span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="60"
                        value={pirDelay}
                        onChange={(e) => setPirDelay(parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <button
                      onClick={handleSavePirSettings}
                      disabled={savingPir}
                      className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
                    >
                      {savingPir ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      <span>Lưu Cài Đặt PIR</span>
                    </button>
                  </div>

                  <div className="w-full h-px bg-slate-200/80 my-1" />

                  {/* Đổi mã PIN Bàn Phím */}
                  <form onSubmit={handleUpdatePassword} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">Đổi Mã PIN Bàn Phím</h4>
                      </div>
                      <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                        Đồng bộ ESP32
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        maxLength={8}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        placeholder="Nhập mã PIN mới (4-8 số)"
                        className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingPin || !newPin}
                      className={`w-full py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                        !newPin || submittingPin
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                      }`}
                    >
                      {submittingPin ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      <span>Cập Nhật PIN</span>
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
            <SecurityTab systemLocked={systemLocked} doorOpen={doorOpen} autoModeEnabled={autoModeEnabled} mqttConnected={mqttConnected} onToggleSystemLock={handleToggleSystemLock} actionLoading={actionLoading} logs={logs} />
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
            <SettingsTab autoModeEnabled={autoModeEnabled} autoCloseDelay={autoCloseDelay} onSavePirSettings={handleSavePirSettings} savingPir={savingPir} onUpdatePassword={handleUpdatePassword} mqttConnected={mqttConnected} onClearLogs={handleClearLogs} clearingLogs={clearingLogs} />
          </motion.div>
        )}

      </AnimatePresence>
    </MainLayout>
  );
}

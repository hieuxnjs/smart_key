import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanFace,
  Plus,
  Trash2,
  Bell,
  BellRing,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Camera,
  CheckCircle2,
  Sparkles,
  UserCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  X,
  Check,
  Zap,
  Globe,
  Server,
  Settings2,
  KeyRound,
  DoorOpen,
  Home,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import FaceEnrollModal from '../FaceEnrollModal';

export default function FaceTab({ socket, deviceOnline = false, logs = [], currentUser = null }) {
  const [faces, setFaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiHealth, setAiHealth] = useState({
    online: false,
    checking: true,
    url: 'https://spearhead-lens-cardstock.ngrok-free.dev',
    message: '',
    aiData: null,
  });
  const [simulatingRing, setSimulatingRing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [customAiUrl, setCustomAiUrl] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);

  // Hiển thị 6 thành viên mỗi trang (2 hàng x 3 cột lấp đầy khung hình cân đối)
  const itemsPerPage = 6;

  // Modal States
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Chỉ có chủ nhà mới có quyền cấu hình URL máy AI
  const isHomeowner = (() => {
    if (currentUser) {
      return (
        currentUser.role === 'admin' ||
        currentUser.username === 'admin' ||
        currentUser.is_owner === true
      );
    }
    try {
      const stored = JSON.parse(
        sessionStorage.getItem('user') || localStorage.getItem('user') || '{}'
      );
      return (
        stored.role === 'admin' ||
        stored.username === 'admin' ||
        stored.is_owner === true
      );
    } catch {
      return false;
    }
  })();

  // 1. Tải danh sách khuôn mặt & kiểm tra kết nối AI Service
  const fetchFaces = async () => {
    setLoading(true);
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    try {
      const [facesRes, healthRes] = await Promise.allSettled([
        fetch('/api/ai/faces', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/ai/health', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (facesRes.status === 'fulfilled' && facesRes.value.ok) {
        const data = await facesRes.value.json();
        if (data.success) {
          setFaces(Array.isArray(data.faces) ? data.faces : []);
        }
      }

      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        const hData = await healthRes.value.json();
        setAiHealth({
          online: Boolean(hData.online),
          checking: false,
          url: hData.url || 'https://spearhead-lens-cardstock.ngrok-free.dev',
          message: hData.message || (hData.online ? 'Máy ảnh AI Sẵn Sàng' : 'Tạm Dừng Kết Nối'),
          aiData: hData.ai_data,
        });
      } else {
        setAiHealth((prev) => ({
          ...prev,
          checking: false,
          online: false,
        }));
      }
    } catch (err) {
      setAiHealth((prev) => ({
        ...prev,
        online: false,
        checking: false,
        error: err.message,
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaces();
    const timer = setInterval(fetchFaces, 30000);
    return () => clearInterval(timer);
  }, []);

  // 2. Tính số lượng người lạ phát hiện trong ngày từ logs
  const todayStrangerCount = useMemo(() => {
    if (!Array.isArray(logs)) return 0;
    try {
      const today = new Date().toDateString();
      return logs.filter((log) => {
        try {
          if (!log || !log.timestamp) return false;
          const logDate = new Date(log.timestamp).toDateString();
          const act = String(log.action || '').toUpperCase();
          const isStrangerAct =
            act.includes('NGUOI LA') ||
            act.includes('NGƯỜI LẠ') ||
            act.includes('UNKNOWN') ||
            act.includes('CANH BAO') ||
            act.includes('CẢNH BÁO') ||
            act.includes('STRANGER') ||
            act.includes('GIA MAO') ||
            act.includes('GIẢ MẠO');
          return logDate === today && isStrangerAct;
        } catch {
          return false;
        }
      }).length;
    } catch {
      return 0;
    }
  }, [logs]);

  // 3. Lọc & Phân trang danh sách khuôn mặt
  const filteredFaces = useMemo(() => {
    if (!Array.isArray(faces)) return [];
    if (!searchQuery || !searchQuery.trim()) return faces;
    const q = searchQuery.toLowerCase().trim();
    return faces.filter((f) => {
      if (!f) return false;
      const n = typeof f === 'string' ? f : f?.name;
      return String(n || '').toLowerCase().includes(q);
    });
  }, [faces, searchQuery]);

  const totalPages = Math.max(1, Math.ceil((filteredFaces.length || 0) / itemsPerPage));

  // Tự động điều chỉnh trang hiện tại nếu vượt quá tổng số trang
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedFaces = useMemo(() => {
    if (!Array.isArray(filteredFaces)) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFaces.slice(start, start + itemsPerPage);
  }, [filteredFaces, currentPage, itemsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // 4. Thao tác Xóa khuôn mặt (Delete Face)
  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget) return;
    setIsDeleting(true);
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const targetName = deleteConfirmTarget.name;

    try {
      const res = await fetch(`/api/ai/faces/${encodeURIComponent(targetName)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Đã xóa thành công thành viên '${targetName}'`, { icon: '🗑️' });
        setDeleteConfirmTarget(null);
        fetchFaces();
      } else {
        toast.error(data.error || 'Xóa thành viên thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối khi gửi yêu cầu xóa');
    } finally {
      setIsDeleting(false);
    }
  };

  // 5. Test Bấm Chuông
  const handleSimulateRing = async () => {
    setSimulatingRing(true);
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    try {
      const res = await fetch('/api/ai/ring', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && (data.success || data.status === 'recognized' || data.status === 'unknown')) {
        toast.success(data.message || 'Đã gửi lệnh kích hoạt camera quét mặt tới máy AI!', { icon: '🔔' });
      } else {
        toast.error(data.message || data.error || 'Không thể kích hoạt chuông');
      }
    } catch {
      toast.error('Lỗi kết nối máy ảnh AI');
    } finally {
      setSimulatingRing(false);
    }
  };

  const handleSaveAiUrl = async (e) => {
    if (e) e.preventDefault();
    if (!customAiUrl.trim()) {
      toast.error('Vui lòng nhập địa chỉ URL máy AI');
      return;
    }
    setSavingUrl(true);
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    try {
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: customAiUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Đã cập nhật URL máy AI thành công!', { icon: '🚀' });
        setIsUrlModalOpen(false);
        fetchFaces();
      } else {
        toast.error(data.error || 'Không thể cập nhật URL');
      }
    } catch (err) {
      toast.error('Lỗi khi gửi yêu cầu cập nhật URL');
    } finally {
      setSavingUrl(false);
    }
  };

  // Helper lấy 2 chữ cái đầu cho Avatar
  const getAvatarInitials = (fullName = '') => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return 'GD';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatLogTime = (timestamp) => {
    try {
      const d = new Date(timestamp);
      return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${d.toLocaleDateString('vi-VN')}`;
    } catch {
      return 'Vừa xong';
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between gap-4 select-none text-slate-800 min-h-full">
      {/* PHẦN TRÊN: Header + Thống kê + Danh sách thành viên */}
      <div className="space-y-3.5">
        {/* 1. Header Trang & Các Nút Hành Động Gọn Gàng */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-2xs relative overflow-hidden">
          {/* Subtle Decorative Aura */}
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-gradient-to-br from-blue-400/10 via-indigo-400/10 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {/* Friendly Status Badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border shadow-2xs transition-all ${
                  aiHealth.online
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/90'
                    : 'bg-slate-100 text-slate-600 border-slate-200/90'
                }`}
              >
                <span className="relative flex items-center justify-center w-2 h-2">
                  {aiHealth.online && (
                    <span className="absolute w-full h-full rounded-full bg-emerald-400 animate-ping opacity-75" />
                  )}
                  <span
                    className={`relative block w-2 h-2 rounded-full ${
                      aiHealth.online ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                </span>
                <span>{aiHealth.online ? 'Camera AI: Đang Hoạt Động' : 'Camera AI: Tạm Dừng Kết Nối'}</span>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium text-slate-600 bg-white border border-slate-200/80 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Nhận diện tự động & An toàn gia đình</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Quản Lý Nhận Diện Khuôn Mặt</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium leading-relaxed">
              Quản lý hồ sơ nhận diện gương mặt AI giúp các thành viên gia đình mở cửa tự động và an toàn
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap relative z-10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchFaces}
              disabled={loading}
              title="Làm mới danh sách"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </motion.button>

            {/* Cài đặt kết nối AI - Dành riêng cho Chủ Nhà */}
            {isHomeowner && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setCustomAiUrl(aiHealth.url);
                  setIsUrlModalOpen(true);
                }}
                title="Cấu hình địa chỉ máy AI (Dành cho chủ nhà)"
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-blue-600 shadow-2xs transition-all cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </motion.button>
            )}

            {/* Thử Chuông Cửa Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSimulateRing}
              disabled={simulatingRing}
              className="px-3.5 py-2 rounded-xl border border-blue-200/80 bg-blue-50/80 hover:bg-blue-100/90 text-blue-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {simulatingRing ? (
                <BellRing className="w-3.5 h-3.5 text-blue-600 animate-bounce" />
              ) : (
                <Bell className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span>{simulatingRing ? 'Đang Kích Hoạt...' : 'Thử Chuông Cửa'}</span>
            </motion.button>

            {/* Thêm Thành Viên Button */}
            <motion.button
              whileHover={{ scale: 1.03, translateY: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsEnrollModalOpen(true)}
              className="btn-shimmer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Thêm Thành Viên</span>
            </motion.button>
          </div>
        </div>

        {/* 2. Bốn Box Chỉ Số (Stats Cards) Tinh Gọn */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Box 1: Thành Viên Đã Đăng Ký */}
          <div className="glass-card p-3 rounded-2xl flex items-center gap-3 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Thành Viên Đăng Ký
              </div>
              <div className="text-lg font-black text-slate-900 tracking-tight">
                {faces.length} <span className="text-[11px] font-semibold text-slate-500">người</span>
              </div>
              <div className="text-[10px] font-medium text-emerald-600 flex items-center gap-1 truncate">
                <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                <span>Được phép mở cửa</span>
              </div>
            </div>
          </div>

          {/* Box 2: Trạng Thái Camera AI */}
          <div className="glass-card p-3 rounded-2xl flex items-center gap-3 relative overflow-hidden group">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ${
                aiHealth.online
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                  : 'bg-slate-100 text-slate-500 border-slate-200/80'
              }`}
            >
              <Camera className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Camera Nhận Diện AI
              </div>
              <div className="text-sm font-black tracking-tight flex items-center gap-1.5 truncate">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    aiHealth.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span className={aiHealth.online ? 'text-emerald-700' : 'text-slate-600'}>
                  {aiHealth.online ? 'Đang Hoạt Động' : 'Tạm Dừng Kết Nối'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate font-medium">
                {aiHealth.online ? 'Sẵn sàng mở cửa tự động' : 'Đang chờ máy ảnh AI'}
              </div>
            </div>
          </div>

          {/* Box 3: Bảo Vệ Người Thật */}
          <div className="glass-card p-3 rounded-2xl flex items-center gap-3 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/70 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Bảo Vệ Đa Lớp
              </div>
              <div className="text-sm font-black text-slate-900 tracking-tight truncate">
                Chống Giả Mạo
              </div>
              <div className="text-[10px] font-medium text-indigo-600 truncate">
                Chỉ mở khóa người thật
              </div>
            </div>
          </div>

          {/* Box 4: Cảnh Báo Người Lạ Hôm Nay */}
          <div className="glass-card p-3 rounded-2xl flex items-center gap-3 relative overflow-hidden group">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ${
                todayStrangerCount > 0
                  ? 'bg-rose-50 text-rose-600 border-rose-200/80'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
              }`}
            >
              {todayStrangerCount > 0 ? (
                <ShieldAlert className="w-5 h-5 stroke-[2] animate-pulse" />
              ) : (
                <CheckCircle2 className="w-5 h-5 stroke-[2]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Cảnh Báo Người Lạ
              </div>
              <div
                className={`text-lg font-black tracking-tight ${
                  todayStrangerCount > 0 ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {todayStrangerCount} <span className="text-[11px] font-semibold text-slate-500">lần ghi nhận</span>
              </div>
              <div
                className={`text-[10px] font-medium truncate ${
                  todayStrangerCount > 0 ? 'text-rose-500 font-bold' : 'text-emerald-600'
                }`}
              >
                {todayStrangerCount > 0 ? 'Có người lạ hôm nay' : 'Khu vực an toàn'}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Danh Sách Khuôn Mặt Thành Viên (Hiển thị 6 phần tử / trang) */}
        <div className="space-y-3">
          {/* Thanh tìm kiếm & đếm */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ScanFace className="w-4 h-4 text-blue-600" />
                <span>Thành Viên Được Cấp Quyền Mở Cửa</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold border border-blue-100">
                  {filteredFaces.length}
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Tìm theo tên thành viên..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium bg-slate-50/50 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Nội dung danh sách */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-2xs">
              <div className="relative w-12 h-12 flex items-center justify-center mb-2">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
              <span className="text-xs font-bold text-slate-700">
                Đang tải danh sách thành viên...
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Hệ thống đang đồng bộ dữ liệu an toàn
              </span>
            </div>
          ) : filteredFaces.length === 0 ? (
            <div className="py-8 px-4 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 text-center space-y-3 shadow-2xs relative overflow-hidden">
              <div className="relative w-14 h-14 rounded-full border border-blue-500/30 flex items-center justify-center bg-blue-50/50 shadow-inner">
                <div className="absolute inset-0 rounded-full border-2 border-blue-600 animate-ping opacity-15" />
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
                  <ScanFace className="w-5 h-5 stroke-[2]" />
                </div>
              </div>

              <div className="space-y-0.5 max-w-md">
                <h4 className="text-sm font-extrabold text-slate-900">
                  {searchQuery ? 'Không tìm thấy thành viên phù hợp' : 'Chưa có thành viên nào được đăng ký'}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  {searchQuery
                    ? 'Vui lòng kiểm tra lại từ khóa tìm kiếm.'
                    : 'Hãy nhấn "Thêm Thành Viên" để quét khuôn mặt và cấp quyền mở cửa tự động cho các thành viên trong gia đình.'}
                </p>
              </div>

              {!searchQuery && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="btn-shimmer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Thành Viên Đầu Tiên</span>
                </motion.button>
              )}
            </div>
          ) : (
            <>
              {/* Lưới Thẻ Thành Viên (Tối đa 6 thẻ: 2 hàng x 3 cột) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {paginatedFaces.filter(Boolean).map((face, idx) => {
                  const name = (typeof face === 'string' ? face : face?.name) || 'Thành Viên';
                  const thumb = face?.avatar_url || (face?.image_base64 ? `data:image/jpeg;base64,${face.image_base64}` : null);

                  return (
                    <motion.div
                      key={name || idx}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="glass-card p-3 rounded-2xl flex flex-col justify-between space-y-2.5 relative group border border-slate-200/80 hover:border-blue-300 transition-all shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {thumb ? (
                            <div
                              onClick={() => setPreviewImage(thumb)}
                              className="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-blue-500/40 shadow-xs flex-shrink-0 cursor-pointer group/thumb"
                              title="Bấm để xem ảnh phóng to"
                            >
                              <img
                                src={thumb}
                                alt={name}
                                className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-xs flex-shrink-0">
                              {getAvatarInitials(name)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-slate-900 tracking-tight truncate">
                              {name}
                            </h4>
                            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-0.5">
                              <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                              <span>Thành Viên Hợp Lệ</span>
                            </div>
                          </div>
                        </div>

                        {/* Nút Xóa */}
                        <button
                          onClick={() => setDeleteConfirmTarget(face)}
                          title={`Xóa hồ sơ ${name}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Metadata ngày đăng ký */}
                      <div className="bg-slate-50/90 rounded-xl px-2.5 py-1.5 border border-slate-100/90 text-[11px] text-slate-600 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-slate-500 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>Đăng ký:</span>
                        </div>
                        <span className="font-semibold text-slate-700">
                          {face.created_at ? formatLogTime(face.created_at) : 'Đã xác thực'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Thanh Phân Trang (Pagination) Gọn Gàng */}
              <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-2xl border border-slate-200/90 shadow-2xs">
                <span className="text-[11px] font-medium text-slate-500">
                  Trang <strong className="text-slate-800">{currentPage}</strong> / {totalPages} (Tổng {filteredFaces.length} người)
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Trang trước"
                    className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => handlePageChange(pg)}
                      className={`w-6 h-6 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pg
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    title="Trang sau"
                    className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* PHẦN DƯỚI: KHỐI TIỆN ÍCH & TRẢI NGHIỆM GIA ĐÌNH (Lấp đầy khoảng trống, chuyên nghiệp, ngôn ngữ gia đình) */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-50/70 via-white to-blue-50/30 p-4 sm:p-5 shadow-xs relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-300/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-300/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header khối */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Tiện Ích Khóa Thông Minh Cho Gia Đình</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Bảo vệ 24/7
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Hệ thống tự động chăm sóc và bảo đảm an toàn cho các thành viên trong gia đình mỗi ngày
              </p>
            </div>
          </div>
        </div>

        {/* 3 Thẻ Tính Năng Gia Đình Thực Tế (Không dùng từ ngữ kỹ thuật thô) */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: Về nhà rảnh tay */}
          <div className="bg-white/95 rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-blue-200/80 transition-all flex flex-col justify-between space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-black text-slate-900 tracking-tight">
                  Về Nhà Không Cần Chìa
                </h5>
                <span className="text-[10px] font-bold text-blue-600">Tự động mở cửa</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
              Camera tự nhận diện gương mặt khi bạn bước đến gần và mở chốt khóa ngay, rất tiện lợi khi đang bận xách đồ.
            </p>
          </div>

          {/* Card 2: Chống mở bằng ảnh */}
          <div className="bg-white/95 rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-emerald-200/80 transition-all flex flex-col justify-between space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-black text-slate-900 tracking-tight">
                  Nhận Diện Người Thật
                </h5>
                <span className="text-[10px] font-bold text-emerald-600">Chống mở bằng ảnh</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
              Chỉ mở cửa cho người thật đang đứng trước cửa, ngăn chặn tuyệt đối việc sử dụng ảnh chụp hay video trên điện thoại.
            </p>
          </div>

          {/* Card 3: Cảnh báo chuông cửa */}
          <div className="bg-white/95 rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:border-amber-200/80 transition-all flex flex-col justify-between space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <BellRing className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-black text-slate-900 tracking-tight">
                  Cảnh Báo Thông Minh
                </h5>
                <span className="text-[10px] font-bold text-amber-600">Bảo vệ cả nhà 24/7</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
              Tự động nhắc nhở khi cửa mở quá 1 phút chưa đóng, đồng thời chụp ảnh báo động ngay nếu có người lạ đứng trước cửa.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Modal Đăng Ký Khuôn Mặt Mới (FaceEnrollModal) */}
      <FaceEnrollModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onSuccess={fetchFaces}
        socket={socket}
      />

      {/* 6. Modal Xác Nhận Xóa Khuôn Mặt */}
      <AnimatePresence>
        {deleteConfirmTarget && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isDeleting) setDeleteConfirmTarget(null);
              }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 z-10"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 stroke-[2]" />
              </div>

              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Xác Nhận Xóa Thành Viên
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Bạn có chắc chắn muốn xóa quyền mở cửa của{' '}
                <strong className="text-rose-600 font-extrabold font-mono">
                  "{deleteConfirmTarget.name}"
                </strong>{' '}
                khỏi hệ thống không? Người này sẽ không thể tự động mở cửa khi về nhà nữa.
              </p>

              <div className="flex items-center justify-end gap-2.5 mt-6">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-500/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang xóa...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xác Nhận Xóa</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewImage(null)}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-xl w-full rounded-3xl overflow-hidden bg-slate-900 shadow-2xl p-3 z-10 border border-slate-800"
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute right-5 top-5 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer z-20"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={previewImage}
                alt="Enlarged capture"
                className="w-full max-h-[75vh] object-contain rounded-2xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. AI URL Config Modal */}
      <AnimatePresence>
        {isUrlModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !savingUrl && setIsUrlModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200/90 p-6 z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Cấu Hình Địa Chỉ Máy AI
                    </h3>
                    <p className="text-xs text-slate-400">FastAPI / Ngrok Face Service</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsUrlModalOpen(false)}
                  disabled={savingUrl}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAiUrl} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    URL Máy AI (Ngrok hoặc IP mạng LAN)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Server className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={customAiUrl}
                      onChange={(e) => setCustomAiUrl(e.target.value)}
                      placeholder="https://spearhead-lens-cardstock.ngrok-free.dev"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Mỗi khi bạn mở lại terminal ngrok trên máy AI, ngrok free có thể cấp tên miền mới. Dán liên kết đó vào đây và bấm lưu để Web Server nhận ngay lập tức!
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-slate-700">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Lưu ý kết nối:</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Backend sẽ tự động đính kèm header <code className="bg-white px-1 py-0.5 rounded border text-[10px] text-blue-600">ngrok-skip-browser-warning: true</code> để vượt qua trang xác nhận của Ngrok.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUrlModalOpen(false)}
                    disabled={savingUrl}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={savingUrl || !customAiUrl.trim()}
                    className="btn-shimmer px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {savingUrl ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang Lưu & Kiểm Tra...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Lưu & Kết Nối</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

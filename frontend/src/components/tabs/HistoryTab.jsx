import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  RotateCcw,
  Download,
  Fingerprint,
  Smartphone,
  ShieldAlert,
  Inbox,
  Camera,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function HistoryTab({ logs = [], onRefreshLogs, loadingLogs = false, onViewAlert }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // 8 dòng mỗi trang vừa khít khung màn hình, không bị đè hay tràn chân trang

  // Filtered & Searched logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const action = (log.action || '').toLowerCase();
      const uid = (log.rfid_uid || '').toLowerCase();
      const query = searchTerm.toLowerCase().trim();

      const matchesQuery = !query || action.includes(query) || uid.includes(query);
      if (!matchesQuery) return false;

      if (activeFilter === 'AI') return action.includes('ai') || action.includes('camera') || action.includes('nguoi la') || Boolean(log.image_base64);
      if (activeFilter === 'RFID') return action.includes('rfid') || Boolean(log.rfid_uid);
      if (activeFilter === 'APP') return action.includes('app') || action.includes('web') || action.includes('remote') || action.includes('từ xa');
      if (activeFilter === 'SECURITY') return action.includes('lock') || action.includes('cảnh báo') || action.includes('alarm') || action.includes('phong tỏa');
      return true;
    });
  }, [logs, searchTerm, activeFilter]);

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      toast.error('Không có dữ liệu nhật ký để xuất file');
      return;
    }

    const headers = ['ID', 'Hành Động', 'Mã Thẻ', 'Có Ảnh', 'Thời Gian'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.action || ''}"`,
      `"${l.rfid_uid || ''}"`,
      `"${l.image_base64 ? 'CÓ ẢNH' : 'KHÔNG'}"`,
      `"${new Date(l.timestamp).toLocaleString('vi-VN')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nhat_ky_truy_cap_smartlock_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất toàn bộ nhật ký ra file CSV thành công!', { icon: '📊' });
  };

  const getMethodBadge = (log) => {
    const action = log.action || '';
    const hasImage = Boolean(log.image_data || log.image_base64);
    if (action.includes('gia mao') || action.includes('Spoof') || action.includes('SPOOF')) {
      return { label: 'Cảnh Báo Giả Mạo', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
    if (action.includes('AI') || action.includes('Camera') || hasImage || action.includes('Khuôn mặt')) {
      if (action.includes('nguoi la') || action.includes('UNKNOWN') || action.includes('CANH BAO') || hasImage) {
        return { label: 'Người Lạ', color: 'bg-rose-100 text-rose-700 border-rose-300' };
      }
      return { label: 'Thành Viên', color: 'bg-blue-100 text-blue-700 border-blue-300' };
    }
    if (log.rfid_uid || action.includes('RFID') || action.includes('thẻ')) {
      return { label: 'Thẻ từ', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (action.includes('PIR') || action.includes('Auto') || action.includes('Tự động')) {
      return { label: 'Tự động', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
    if (action.includes('LOCK') || action.includes('Phong tỏa') || action.includes('Cảnh báo')) {
      return { label: 'Khóa An Toàn', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    return { label: 'Từ xa / Web', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  };

  const formatAction = (action = '') => action
    .replace(/^AI:\s*/gi, '')
    .replace(/ESP32/gi, 'khóa cửa')
    .replace(/\bPIR\b/gi, 'tự động')
    .replace(/\bRFID\b/gi, 'thẻ từ')
    .replace(/RC522/gi, 'bộ đọc thẻ')
    .replace(/\bNode\b/gi, 'thiết bị')
    .replace(/CANH BAO:\s*/gi, 'Cảnh báo: ')
    .replace(/Phat hien nguoi la \(UNKNOWN\) truoc cua!/gi, 'Phát hiện người lạ trước cửa');

  return (
    <div className="space-y-3 w-full h-full flex flex-col justify-between select-none text-slate-800">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
            NHẬT KÝ RA VÀO
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Nhật Ký Ra Vào & Cảnh Báo An Ninh
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium leading-relaxed">
            Ghi nhận chi tiết thời gian và phương thức mở cửa bằng gương mặt AI, thẻ từ hoặc từ xa
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Refresh Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefreshLogs}
            disabled={loadingLogs}
            className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-bold shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            title="Làm mới nhật ký"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin text-blue-600' : ''}`} />
            <span>Làm Mới</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất File CSV</span>
          </motion.button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2.5 bg-slate-50/90 rounded-2xl border border-slate-200/80">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo hoạt động, camera, mã thẻ..."
            className="w-full pl-8 pr-4 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'AI', label: 'Camera AI' },
            { id: 'RFID', label: 'Thẻ từ' },
            { id: 'APP', label: 'Từ xa / Web' },
            { id: 'SECURITY', label: 'Cảnh báo' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                activeFilter === pill.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200/80'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container: Cấu trúc flex-1 min-h-0 flex flex-col ngăn chặn 100% việc chân trang đè lên dữ liệu */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
        {/* Vùng cuộn dữ liệu bảng */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200/90 text-slate-400 uppercase text-[10px] tracking-wider z-10 backdrop-blur-md">
              <tr>
                <th className="py-2.5 px-4 font-bold">Hành Động</th>
                <th className="py-2.5 px-4 font-bold">Hình Ảnh (AI)</th>
                <th className="py-2.5 px-4 font-bold">Mã Thẻ (UID)</th>
                <th className="py-2.5 px-4 font-bold">Phương Thức</th>
                <th className="py-2.5 px-4 font-bold text-right">Thời Gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-2xs">
                          <Inbox className="w-5 h-5 stroke-[1.75]" />
                        </div>
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white animate-pulse" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-slate-800">Chưa có dữ liệu</h4>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Chưa có nhật ký hoạt động phù hợp với bộ lọc hiện tại.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const badge = getMethodBadge(log);
                  const d = new Date(log.timestamp);
                  const rawImage = log.image_data || log.image_base64 || '';
                  const hasImage = Boolean(rawImage);
                  const cleanBase64 = rawImage.replace(/^data:image\/[a-z]+;base64,/, '');
                  const isCameraEvent = (log.action || '').includes('AI') || (log.action || '').includes('Camera') || hasImage;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Cột 1: Hành Động */}
                      <td className="py-2 px-4 flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          hasImage
                            ? 'bg-rose-100 text-rose-600'
                            : isCameraEvent
                            ? 'bg-purple-100 text-purple-600'
                            : log.rfid_uid
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                          {hasImage || isCameraEvent ? (
                            <Camera className="w-3.5 h-3.5" />
                          ) : log.rfid_uid ? (
                            <Fingerprint className="w-3.5 h-3.5" />
                          ) : (
                            <Smartphone className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`font-bold truncate ${hasImage ? 'text-rose-700' : 'text-slate-800'}`}>
                            {formatAction(log.action)}
                          </span>
                        </div>
                      </td>

                      {/* Cột 2: Cột Hình Ảnh (AI) */}
                      <td className="py-2 px-4">
                        {hasImage ? (
                          <div
                            onClick={() => onViewAlert && onViewAlert(log)}
                            className="inline-flex items-center gap-1.5 p-1 pr-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold cursor-pointer transition-all shadow-2xs group"
                            title="Nhấn để phóng to ảnh người lạ"
                          >
                            <img
                              src={`data:image/jpeg;base64,${cleanBase64}`}
                              alt="Ảnh người lạ"
                              className="w-8 h-8 rounded-md object-cover bg-black border border-rose-300 group-hover:scale-105 transition-transform"
                            />
                            <div className="flex flex-col text-left">
                              <span className="text-[10px] font-bold text-rose-700 flex items-center gap-1">
                                <Eye className="w-3 h-3 text-rose-600" /> Xem ảnh
                              </span>
                              <span className="text-[9px] text-rose-500 font-mono">Camera AI</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-sans text-xs pl-2">—</span>
                        )}
                      </td>

                      {/* Cột 3: Mã thẻ (UID) */}
                      <td className="py-2 px-4 font-mono text-slate-600">
                        {log.rfid_uid ? (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[10px] border border-slate-200">
                            {log.rfid_uid}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-sans text-xs">—</span>
                        )}
                      </td>

                      {/* Cột 4: Phương Thức */}
                      <td className="py-2 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Cột 5: Thời Gian */}
                      <td className="py-2 px-4 text-right text-slate-500 font-mono text-[11px]">
                        {d.toLocaleDateString('vi-VN')} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Cố định độc lập ở đáy bảng, không bao giờ đè lên hàng dữ liệu */}
        <div className="flex-shrink-0 py-2.5 px-4 bg-slate-50 border-t border-slate-200/90 text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <span>
              Hiển thị <strong>{filteredLogs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> - <strong>{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</strong> trên tổng số <strong>{filteredLogs.length}</strong> bản ghi
            </span>
          </div>

          {/* Phân Trang */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                title="Trang trước"
                className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                // Hiển thị tối đa các trang lân cận nếu nhiều trang
                if (
                  pg === 1 ||
                  pg === totalPages ||
                  (pg >= currentPage - 1 && pg <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pg}
                      onClick={() => handlePageChange(pg)}
                      className={`w-6 h-6 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pg
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {pg}
                    </button>
                  );
                } else if (pg === currentPage - 2 || pg === currentPage + 2) {
                  return <span key={pg} className="px-1 text-slate-400 text-xs">...</span>;
                }
                return null;
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                title="Trang sau"
                className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <span className="hidden md:inline font-semibold text-slate-600 text-[11px]">
            Camera AI & Khóa cửa đồng bộ trực tiếp
          </span>
        </div>
      </div>

    </div>
  );
}

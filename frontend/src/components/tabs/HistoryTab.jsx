import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  RotateCcw,
  Download,
  Fingerprint,
  Smartphone,
  Radio,
  ShieldAlert,
  Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function HistoryTab({ logs = [], onRefreshLogs, loadingLogs = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Filtered & Searched logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const action = (log.action || '').toLowerCase();
      const uid = (log.rfid_uid || '').toLowerCase();
      const query = searchTerm.toLowerCase().trim();

      const matchesQuery = !query || action.includes(query) || uid.includes(query);
      if (!matchesQuery) return false;

      if (activeFilter === 'RFID') return action.includes('rfid') || Boolean(log.rfid_uid);
      if (activeFilter === 'APP') return action.includes('app') || action.includes('web') || action.includes('remote') || action.includes('từ xa');
      if (activeFilter === 'SECURITY') return action.includes('lock') || action.includes('cảnh báo') || action.includes('alarm') || action.includes('phong tỏa');
      return true;
    });
  }, [logs, searchTerm, activeFilter]);

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      toast.error('Không có dữ liệu nhật ký để xuất file');
      return;
    }

    const headers = ['ID', 'Hành Động', 'Mã Thẻ (RFID_UID)', 'Thời Gian'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.action || ''}"`,
      `"${l.rfid_uid || ''}"`,
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
    if (log.rfid_uid || action.includes('RFID') || action.includes('thẻ')) {
      return { label: 'Thẻ RFID', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (action.includes('PIR') || action.includes('Auto') || action.includes('Tự động')) {
      return { label: 'Cảm Biến PIR', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
    if (action.includes('LOCK') || action.includes('Phong tỏa') || action.includes('Cảnh báo')) {
      return { label: 'Phong Tỏa An Ninh', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    return { label: 'Từ xa / Web', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  };

  return (
    <div className="space-y-4 w-full h-full flex flex-col justify-between select-none text-slate-800">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
            Cơ Sở Dữ Liệu MySQL • Bảng AccessLogs
          </span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight">
            Nhật Ký Truy Cập
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Bản ghi chi tiết các sự kiện mở cửa, quẹt thẻ RFID và lệnh điều khiển từ xa
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Refresh Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefreshLogs}
            disabled={loadingLogs}
            className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            title="Làm mới nhật ký (GET /api/logs)"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin text-blue-600' : ''}`} />
            <span>Làm Mới</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất File CSV</span>
          </motion.button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo hành động hoặc mã thẻ RFID..."
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'RFID', label: 'Thẻ RFID' },
            { id: 'APP', label: 'Từ xa / Web' },
            { id: 'SECURITY', label: 'Cảnh báo' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                activeFilter === pill.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200/80'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
        <div className="max-h-[380px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 sticky top-0 border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider z-10 backdrop-blur-md">
              <tr>
                <th className="py-3 px-4 font-bold">Hành Động</th>
                <th className="py-3 px-4 font-bold">Mã Thẻ</th>
                <th className="py-3 px-4 font-bold">Phương Thức</th>
                <th className="py-3 px-4 font-bold text-right">Thời Gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2.5">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
                          <Inbox className="w-6 h-6 stroke-[1.75]" />
                        </div>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white animate-pulse" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-slate-800">Chưa có dữ liệu</h4>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Hãy quẹt thẻ để hệ thống ghi nhận.
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold">
                        <span>Cơ sở dữ liệu đang trống</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getMethodBadge(log);
                  const d = new Date(log.timestamp);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Cột 1: Hành Động */}
                      <td className="py-2.5 px-4 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                          {log.rfid_uid ? (
                            <Fingerprint className="w-4 h-4" />
                          ) : log.action?.includes('PIR') ? (
                            <Radio className="w-4 h-4" />
                          ) : (
                            <Smartphone className="w-4 h-4" />
                          )}
                        </div>
                        <span className="font-bold text-slate-800">{log.action}</span>
                      </td>

                      {/* Cột 2: Mã Thẻ (RFID UID) */}
                      <td className="py-2.5 px-4 font-mono text-slate-600">
                        {log.rfid_uid ? (
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
                            {log.rfid_uid}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-sans">—</span>
                        )}
                      </td>

                      {/* Cột 3: Phương Thức */}
                      <td className="py-2.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Cột 4: Thời Gian */}
                      <td className="py-2.5 px-4 text-right text-slate-500 font-mono text-[11px]">
                        {d.toLocaleDateString('vi-VN')} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="py-2.5 px-4 bg-slate-50/80 border-t border-slate-100 text-slate-400 text-[11px] flex items-center justify-between">
          <span>Đang hiển thị {filteredLogs.length} trên tổng số {logs.length} bản ghi</span>
          <span className="font-semibold text-slate-600">Đồng bộ MySQL thời gian thực</span>
        </div>
      </div>

    </div>
  );
}

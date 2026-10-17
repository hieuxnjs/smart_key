import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanFace,
  X,
  Camera,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Cpu,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FaceEnrollModal({
  isOpen,
  onClose,
  onSuccess,
  socket,
}) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'scanning' | 'success' | 'failed'
  const [errorMessage, setErrorMessage] = useState('');
  const [capturedThumb, setCapturedThumb] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setStatus('idle');
      setErrorMessage('');
      setCapturedThumb(null);
    }
  }, [isOpen]);

  // Lắng nghe sự kiện socket từ Backend / AI nếu có
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleEnrollResult = (data) => {
      if (!data) return;
      console.log('[Socket] Enroll result:', data);

      if (data.status === 'success') {
        setStatus('success');
        if (data.image_base64) {
          setCapturedThumb(`data:image/jpeg;base64,${data.image_base64}`);
        }
        toast.success(`Đã đăng ký thành công khuôn mặt cho ${data.name || name}!`, {
          icon: '🎉',
          duration: 4000,
        });
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1600);
      } else if (data.status === 'failed') {
        setStatus('failed');
        setErrorMessage(data.message || 'Quá trình đăng ký thất bại.');
        toast.error(data.message || 'Đăng ký khuôn mặt thất bại', { icon: '❌' });
      }
    };

    socket.on('enroll_result', handleEnrollResult);
    return () => {
      socket.off('enroll_result', handleEnrollResult);
    };
  }, [socket, isOpen, name, onSuccess, onClose]);

  if (!isOpen) return null;

  const handleStartEnroll = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error('Vui lòng nhập họ và tên thành viên.');
      return;
    }

    if (cleanName.length < 2) {
      toast.error('Tên thành viên phải có ít nhất 2 ký tự.');
      return;
    }

    setStatus('scanning');
    setErrorMessage('');
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');

    try {
      const res = await fetch('/api/ai/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: cleanName }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        if (data.data?.image_base64 || data.data?.avatar) {
          setCapturedThumb(data.data.image_base64 || data.data.avatar);
        }
        toast.success(`Đã thêm thành viên '${cleanName}' thành công!`, {
          icon: '🎉',
          duration: 3500,
        });
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1600);
      } else {
        setStatus('failed');
        setErrorMessage(data.error || 'Camera không phản hồi hoặc xảy ra lỗi.');
        toast.error(data.error || 'Lỗi khi quét khuôn mặt', { icon: '❌' });
      }
    } catch (err) {
      setStatus('failed');
      setErrorMessage(
        'Không thể kết nối đến camera nhận diện. Hãy kiểm tra kết nối mạng của thiết bị.'
      );
      toast.error('Lỗi kết nối camera');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (status !== 'scanning') onClose();
          }}
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-[95%] sm:w-full max-w-lg max-h-[92vh] overflow-y-auto scrollbar-thin rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-2xl"
        >
          {/* Header Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

          {/* Close Button */}
          {status !== 'scanning' && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-5 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <ScanFace className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Thêm Thành Viên Gia Đình Mới
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Camera thông minh sẽ ghi nhận khuôn mặt để tự động mở cửa cho bạn
              </p>
            </div>
          </div>

          {/* 1. Form Nhập Tên (IDLE) */}
          {status === 'idle' && (
            <form onSubmit={handleStartEnroll} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Họ và tên thành viên <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Bố, Mẹ, Con trai, Nguyễn Văn A..."
                    maxLength={60}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-slate-900 placeholder:text-slate-400 shadow-xs"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span>Hỗ trợ nhập tiếng Việt có dấu đầy đủ (Ví dụ: Nguyễn Văn A, Trần Thị B).</span>
                </p>
              </div>

              {/* Hướng Dẫn Nhanh */}
              <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/60 rounded-2xl p-4 border border-blue-100/90 text-xs text-slate-700 space-y-2">
                <div className="font-extrabold text-blue-900 flex items-center gap-1.5 text-xs">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Hướng dẫn quét khuôn mặt:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>Khi nhấn nút, camera tại cửa sẽ bật lên để ghi nhận khuôn mặt.</li>
                  <li>Vui lòng đứng trước camera ở khoảng cách 0.5m - 1m.</li>
                  <li>Bỏ khẩu trang và kính râm để hệ thống nhận diện chính xác nhất.</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="btn-shimmer px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Bắt Đầu Quét Mặt</span>
                </button>
              </div>
            </form>
          )}

          {/* 2. Đang Quét (SCANNING) - High-Tech Biometric HUD */}
          {status === 'scanning' && (
            <div className="py-6 flex flex-col items-center text-center space-y-5">
              {/* Futuristic Biometric Face Reticle */}
              <div className="relative w-40 h-40 rounded-3xl border-2 border-blue-500/40 bg-slate-950 p-3 shadow-2xl overflow-hidden flex items-center justify-center">
                {/* Corner HUD Brackets */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

                {/* Laser scan line sweeping */}
                <div className="scan-laser-line" />

                {/* Concentric rotating radar rings */}
                <div className="absolute inset-4 rounded-full border border-cyan-500/30 radar-sweep border-t-cyan-400" />
                <div className="absolute inset-8 rounded-full border border-blue-500/40 border-dashed animate-spin" />

                {/* Center Icon */}
                <div className="relative z-10 flex flex-col items-center">
                  <ScanFace className="w-12 h-12 text-cyan-400 animate-pulse stroke-[1.8]" />
                  <span className="text-[9px] font-mono font-bold text-cyan-300 mt-1 uppercase tracking-widest">
                    TRACKING
                  </span>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5 max-w-sm">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-extrabold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Camera tại cửa đang ghi nhận khuôn mặt...</span>
                </div>
                <h4 className="text-base font-black text-slate-900 tracking-tight">
                  Vui lòng nhìn thẳng vào Camera cửa
                </h4>
                <p className="text-xs text-slate-500">
                  Hệ thống đang lưu nhận diện cho thành viên <strong className="text-blue-600 font-bold">"{name}"</strong>. Giữ khuôn mặt ổn định trong giây lát.
                </p>
              </div>

              <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/90 rounded-2xl px-4 py-2.5 max-w-sm flex items-center gap-2">
                <span className="text-sm">💡</span>
                <span>Đảm bảo ánh sáng phía trước khuôn mặt đầy đủ, giữ khoảng cách 0.5m - 1m.</span>
              </div>
            </div>
          )}

          {/* 3. Thành Công (SUCCESS) */}
          {status === 'success' && (
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900">Đăng Ký Thành Công!</h4>
                <p className="text-xs text-slate-600">
                  Đã thêm thành viên <strong className="text-blue-600 font-bold">{name}</strong> vào danh sách mở cửa tự động.
                </p>
              </div>

              {capturedThumb && (
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md">
                  <img src={capturedThumb} alt={name} className="w-full h-full object-cover" />
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer mt-2"
              >
                Hoàn Tất & Đóng
              </button>
            </div>
          )}

          {/* 4. Thất Bại (FAILED) */}
          {status === 'failed' && (
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
                <XCircle className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900">Đăng Ký Chưa Thành Công</h4>
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200/80 max-w-sm">
                  {errorMessage || 'Không thể quét khuôn mặt. Vui lòng thử lại.'}
                </p>
              </div>

              <div className="flex gap-2.5 w-full pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => setStatus('idle')}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Thử Lại</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

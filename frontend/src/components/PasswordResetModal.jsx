import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { KeyRound, Loader2, X } from 'lucide-react';

export default function PasswordResetModal({ isOpen, onClose, onReset }) {
  const [webPassword, setWebPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (event) => {
    event.preventDefault();
    if (!/^\d{4}$/.test(newPin)) return;
    setLoading(true);
    try {
      if (await onReset(webPassword, newPin)) onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.button
            aria-label="Đóng hộp thoại"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-reset-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="relative w-[94%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl"
          >
            <button type="button" onClick={onClose} aria-label="Đóng" className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
            <div className="mb-5 flex items-center gap-3 pr-8">
              <div className="rounded-xl bg-blue-50 p-2 text-blue-600"><KeyRound className="h-5 w-5" /></div>
              <h2 id="password-reset-title" className="text-lg font-extrabold text-slate-800">Quên mật khẩu khóa?</h2>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-slate-600">
              Tính năng này dùng để cấp lại mật khẩu mới cho ổ khóa trong trường hợp quên mã PIN. Yêu cầu xác thực quyền Admin.
            </p>

            <form onSubmit={handleReset} className="space-y-3">
                <label className="block text-xs font-bold text-slate-700" htmlFor="web-password-reset">Mật khẩu Admin (mật khẩu Web)</label>
                <input
                  id="web-password-reset"
                  type="password"
                  value={webPassword}
                  onChange={(event) => setWebPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="block text-xs font-bold text-slate-700" htmlFor="new-lock-pin">Nhập mã PIN mới (4 số)</label>
                <input
                  id="new-lock-pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  minLength={4}
                  value={newPin}
                  onChange={(event) => setNewPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm tracking-[0.35em] text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button disabled={loading || !webPassword || !/^\d{4}$/.test(newPin)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Đặt Lại Mật Khẩu
                </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

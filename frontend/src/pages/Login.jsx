import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  Lock,
  KeyRound,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { isTokenValid } from '../App';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already authenticated in this session, redirect to dashboard
  useEffect(() => {
    if (isTokenValid()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    if (isRegister) {
      if (password !== confirmPassword) {
        toast.error('Mật khẩu xác nhận không khớp');
        return;
      }
      if (password.length < 6) {
        toast.error('Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = {
        username: username.trim(),
        password: password.trim(),
      };

      const res = await axios.post(endpoint, payload);

      if (res.data.success && res.data.token) {
        // Enforce session-based storage so every new browser/web load defaults to requiring login
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('user', JSON.stringify(res.data.user || { username }));
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        toast.success(isRegister ? 'Tạo tài khoản thành công!' : 'Đăng nhập thành công!', {
          icon: '🎉',
        });

        if (onLoginSuccess) {
          onLoginSuccess(res.data.token, res.data.user);
        }
        navigate('/');
      } else {
        toast.error(res.data.error || 'Xác thực thất bại');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Lỗi kết nối xác thực';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 text-slate-800 flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white relative overflow-hidden font-sans select-none">
      <Toaster position="top-right" />
      
      {/* Decorative ambient background blur orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-300/25 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Main Authentication Card */}
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[36px] shadow-[0_25px_70px_-15px_rgba(20,40,90,0.15)] border border-white p-8 sm:p-10 relative z-10"
      >
        {/* Top Header Badge & Custom Logo */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-16 h-16 rounded-2xl bg-white shadow-md p-1.5 flex items-center justify-center border border-slate-100"
          >
            <img
              src="/logo.svg"
              alt="Smart Lock Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </motion.div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[11px] font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Khóa Thông Minh</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {isRegister ? 'Đăng Ký Tài Khoản' : 'Chào Mừng Trở Lại'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isRegister
                ? 'Tạo tài khoản quản trị viên mới để điều khiển hệ thống'
                : 'Đăng nhập để điều khiển và giám sát khóa cửa thời gian thực'}
            </p>
          </div>
        </div>

        {/* Tab switch between Login and Register */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isRegister
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isRegister
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tạo Tài Khoản
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username Field */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Tên Đăng Nhập
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên tài khoản của bạn"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Mật Khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Register mode only) */}
          <AnimatePresence>
            {isRegister && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Xác Nhận Mật Khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    required={isRegister}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Tạo Tài Khoản' : 'Đăng Nhập Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Toggle Register / Login */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center">
          <p className="text-[11px] text-slate-400">
            {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              {isRegister ? 'Đăng nhập tại đây' : 'Đăng ký ngay'}
            </button>
          </p>
        </div>

      </motion.div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Key,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Radio,
  Edit2,
  Check,
  RefreshCw,
  Wifi,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Home,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Danh sách thẻ từ mặc định được lưu theo tên chủ nhà đã cài đặt sẵn trên khóa cửa
const DEFAULT_SAVED_CARDS = [
  {
    name: 'Thẻ Từ Của Chủ Nhà',
    uid: 'C30B2407',
    role: 'Chủ Nhà',
    status: 'ACTIVE',
    lastUsed: 'Đã cài đặt sẵn trên khóa cửa',
    isHardware: true,
    cardType: 'card',
  },
  {
    name: 'Móc Khóa Mở Cửa Chủ Nhà',
    uid: '53835B1A',
    role: 'Chủ Nhà',
    status: 'ACTIVE',
    lastUsed: 'Đã cài đặt sẵn trên khóa cửa',
    isHardware: true,
    cardType: 'keychain',
  },
];

export default function RfidTab({ onOpenDoor, deviceOnline = false, currentUser = null }) {
  // Chỉ có chủ nhà mới có quyền xem mã thẻ bảo mật
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

  const [cards, setCards] = useState(() => {
    try {
      const saved = localStorage.getItem('smartlock_rfid_cards');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem('smartlock_rfid_cards', JSON.stringify(DEFAULT_SAVED_CARDS));
      return DEFAULT_SAVED_CARDS;
    } catch {
      return DEFAULT_SAVED_CARDS;
    }
  });

  const [newCardName, setNewCardName] = useState('');
  const [newCardUid, setNewCardUid] = useState('');
  const [newCardRole, setNewCardRole] = useState('Chủ Nhà');
  const [editingCardName, setEditingCardName] = useState(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [showAllUids, setShowAllUids] = useState(false);
  const [revealedUids, setRevealedUids] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const saveCards = (updated) => {
    setCards(updated);
    localStorage.setItem('smartlock_rfid_cards', JSON.stringify(updated));
  };

  // Nút Làm Mới danh sách thẻ
  const handleReloadCards = () => {
    setIsRefreshing(true);
    try {
      const saved = localStorage.getItem('smartlock_rfid_cards');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCards(parsed);
          toast.success('Đã làm mới danh sách thẻ mở cửa!', { icon: '🔄' });
          setTimeout(() => setIsRefreshing(false), 500);
          return;
        }
      }
      setCards(DEFAULT_SAVED_CARDS);
      toast.success('Đã làm mới danh sách thẻ mở cửa!', { icon: '🔄' });
    } catch {
      toast.error('Lỗi khi làm mới danh sách thẻ');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Thêm thẻ mới - Lưu trữ theo TÊN CHỦ THẺ
  const handleAddCard = (e) => {
    e.preventDefault();
    const cleanName = newCardName.trim();
    const cleanUid = newCardUid.trim().toUpperCase().replace(/[^A-F0-9]/g, '');

    if (!cleanName) {
      toast.error('Vui lòng nhập tên người dùng thẻ.');
      return;
    }
    if (!cleanUid) {
      toast.error('Vui lòng nhập mã thẻ hợp lệ.');
      return;
    }

    // Kiểm tra trùng tên
    if (cards.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
      toast.error(`Thẻ với tên "${cleanName}" đã có. Vui lòng đặt tên phân biệt.`);
      return;
    }

    // Kiểm tra trùng mã thẻ
    if (cards.some((c) => c.uid === cleanUid)) {
      toast.error(`Mã thẻ [${cleanUid}] đã được đăng ký cho thẻ khác.`);
      return;
    }

    const newEntry = {
      name: cleanName,
      uid: cleanUid,
      role: newCardRole,
      status: 'ACTIVE',
      lastUsed: 'Vừa đăng ký',
      isHardware: false,
      cardType: 'card',
    };

    saveCards([newEntry, ...cards]);
    setNewCardName('');
    setNewCardUid('');
    toast.success(`Đã thêm thẻ "${newEntry.name}" thành công!`, { icon: '💳' });
  };

  const handleToggleStatus = (targetName) => {
    const updated = cards.map((c) =>
      c.name === targetName ? { ...c, status: c.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' } : c
    );
    saveCards(updated);
    toast.success('Đã cập nhật trạng thái thẻ');
  };

  const handleDeleteCard = (targetName) => {
    const updated = cards.filter((c) => c.name !== targetName);
    saveCards(updated);
    toast.success(`Đã xóa thẻ "${targetName}" khỏi danh sách`);
  };

  const handleStartEdit = (card) => {
    setEditingCardName(card.name);
    setEditingNameValue(card.name);
  };

  const handleSaveEdit = (oldName) => {
    const cleanName = editingNameValue.trim();
    if (!cleanName) return;

    if (
      cleanName.toLowerCase() !== oldName.toLowerCase() &&
      cards.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())
    ) {
      toast.error(`Tên thẻ "${cleanName}" đã tồn tại.`);
      return;
    }

    const updated = cards.map((c) => (c.name === oldName ? { ...c, name: cleanName } : c));
    saveCards(updated);
    setEditingCardName(null);
    toast.success('Đã đổi tên thẻ thành công');
  };

  const toggleRevealUid = (name) => {
    if (!isHomeowner) {
      toast.error('Chỉ Chủ Nhà mới có quyền xem mã thẻ!');
      return;
    }
    setRevealedUids((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  // Helper hiển thị mã thẻ: Chỉ chủ nhà mới được xem
  const renderUidDisplay = (uid, name) => {
    if (!isHomeowner) {
      return <span className="tracking-widest text-slate-400">••••••••</span>;
    }
    const isRevealed = showAllUids || revealedUids[name];
    if (isRevealed) {
      return <span className="font-mono text-slate-800 font-bold">{uid}</span>;
    }
    return (
      <span className="tracking-widest text-slate-500 font-mono">
        •••• {uid.slice(-4)}
      </span>
    );
  };

  return (
    <div className="space-y-3.5 w-full select-none text-slate-800">
      
      {/* 1. Header Trang - Ngôn ngữ thân thiện gia đình */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
              THẺ TỪ GIA ĐÌNH BẢO MẬT
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
              <Home className="w-3 h-3 text-blue-600" />
              <span>Khóa Cửa Thông Minh</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Thẻ Từ & Chìa Khóa Gia Đình
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium leading-relaxed">
            Quản lý danh sách thẻ từ thông minh cấp quyền mở cửa, lưu trữ bảo mật theo tên từng chủ thẻ
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Nút Xem / Ẩn Toàn Bộ Mã Thẻ (Dành riêng cho Chủ Nhà) */}
          {isHomeowner && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowAllUids((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-blue-700 text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Hiện hoặc ẩn mã số thẻ"
            >
              {showAllUids ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showAllUids ? 'Ẩn Mã Thẻ' : 'Hiện Mã Thẻ'}</span>
            </motion.button>
          )}

          {/* NÚT LÀM MỚI (Thay thế phần nạp lại cũ) */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleReloadCards}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Làm mới danh sách thẻ mở cửa"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </motion.button>
        </div>
      </div>

      {/* 2. Main Grid: Cột Trái (Form & Mô Phỏng Thẻ) + Cột Phải (Danh Sách Thẻ Lưu Theo Tên) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        
        {/* CỘT TRÁI (Form & Thẻ Mô Phỏng): lg:col-span-5 */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Thẻ Kỹ Thuật Số Mô Phỏng */}
          <div className="p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-blue-700 via-indigo-700 to-slate-900 text-white shadow-md shadow-blue-500/20 relative overflow-hidden flex flex-col justify-between h-44">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-400/25 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black tracking-widest uppercase text-white/90">
                  THẺ KHÓA THÔNG MINH
                </span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-bold text-emerald-300">
                <Wifi className="w-3 h-3 rotate-90" />
                <span>Chạm Để Mở Cửa</span>
              </div>
            </div>

            {/* Chip cảm ứng ánh kim */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-9 h-7 rounded-md bg-gradient-to-tr from-amber-300 via-amber-400 to-yellow-500 border border-amber-200/60 shadow-xs flex items-center justify-center">
                <div className="w-7 h-5 border border-amber-600/40 rounded-[3px] flex items-center justify-center">
                  <Radio className="w-3.5 h-3.5 text-amber-900/70" />
                </div>
              </div>
              <span className="text-[10px] tracking-wider text-blue-200/90 font-medium">
                Thẻ Mở Khóa Nhà Riêng
              </span>
            </div>

            {/* Tên chủ thẻ và Mã thẻ */}
            <div className="relative z-10 flex items-end justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-300 block font-semibold">
                  Chủ Thẻ
                </span>
                <span className="text-sm font-extrabold tracking-tight truncate block max-w-[170px]">
                  {newCardName.trim() || 'Chủ Nhà'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-slate-300 block font-semibold">
                  Mã Thẻ
                </span>
                <span className="text-xs font-black font-mono tracking-wider text-amber-300">
                  {isHomeowner ? (newCardUid.trim() ? newCardUid.toUpperCase() : 'C30B2407') : '••••••••'}
                </span>
              </div>
            </div>
          </div>

          {/* Form Thêm Thẻ Mới */}
          <div className="p-4 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Thêm Thẻ Cho Chủ Nhà</h3>
                <p className="text-[11px] text-slate-400">Đăng ký thêm thẻ mới để mở cửa</p>
              </div>
            </div>

            <form onSubmit={handleAddCard} className="space-y-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Chủ Thẻ
                </label>
                <input
                  type="text"
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  placeholder="Ví dụ: Thẻ Chủ Nhà (Anh Hiếu)"
                  className="w-full px-3 py-2 bg-slate-50/70 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Mã Thẻ
                  </label>
                  {isHomeowner && (
                    <button
                      type="button"
                      onClick={() => setNewCardUid('C30B2407')}
                      className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                    >
                      Mã thẻ mẫu: C30B2407
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={newCardUid}
                  onChange={(e) => setNewCardUid(e.target.value)}
                  placeholder="Ví dụ: C30B2407"
                  className="w-full px-3 py-2 bg-slate-50/70 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quyền Mở Cửa
                </label>
                <select
                  value={newCardRole}
                  onChange={(e) => setNewCardRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50/70 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="Chủ Nhà">Chủ Nhà (Mở Cửa Tự Do)</option>
                  <option value="Khách">Khách (Người Quen)</option>
                </select>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Lưu Thẻ Ngay</span>
              </motion.button>
            </form>

            <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100 text-[11px] text-blue-700 flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Chỉ cần chạm thẻ vào mặt khóa cửa để mở tự động.</span>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (Danh Sách Thẻ Lưu Theo Tên): lg:col-span-7 */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-3.5">
            {/* Header Danh Sách */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Thẻ Được Cấp Quyền</h3>
                  <p className="text-[11px] text-slate-400">Danh sách thẻ được phép mở khóa cửa (Lưu theo tên)</p>
                </div>
              </div>

              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                {cards.length} thẻ đang lưu
              </span>
            </div>

            {/* Danh sách thẻ lưu theo tên */}
            <div className="space-y-2.5">
              {cards.map((card) => {
                const isActive = card.status === 'ACTIVE';
                const isEditing = editingCardName === card.name;

                return (
                  <motion.div
                    key={card.name}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/70 hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-xs flex-shrink-0 ${
                          card.cardType === 'keychain'
                            ? 'bg-amber-50 text-amber-600'
                            : isActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {card.cardType === 'keychain' ? (
                          <KeyRound className="w-5 h-5" />
                        ) : (
                          <CreditCard className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 mb-1">
                            <input
                              type="text"
                              value={editingNameValue}
                              onChange={(e) => setEditingNameValue(e.target.value)}
                              className="px-2 py-0.5 text-xs border rounded-lg font-bold text-slate-800 bg-white border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleSaveEdit(card.name)}
                              className="p-1 rounded-lg bg-blue-600 text-white cursor-pointer"
                              title="Lưu tên mới"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight truncate">
                              {card.name}
                            </h4>
                            {card.isHardware && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-blue-100 text-blue-700">
                                Thẻ Cài Đặt Sẵn
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                                isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {isActive ? 'Đang Hoạt Động' : 'Tạm Khóa'}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                          {/* Mã thẻ: Chỉ chủ nhà mới được xem, kèm nút ẩn/hiện */}
                          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                            <span className="text-slate-400 text-[10px]">Mã thẻ:</span>
                            {renderUidDisplay(card.uid, card.name)}
                            {isHomeowner && (
                              <button
                                onClick={() => toggleRevealUid(card.name)}
                                className="p-0.5 text-slate-400 hover:text-blue-600 cursor-pointer ml-0.5"
                                title={revealedUids[card.name] ? 'Ẩn mã thẻ' : 'Xem mã thẻ'}
                              >
                                {revealedUids[card.name] ? (
                                  <EyeOff className="w-3 h-3" />
                                ) : (
                                  <Eye className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                          <span>•</span>
                          <span className="font-semibold text-blue-700">{card.role}</span>
                          <span>•</span>
                          <span className="text-slate-400 text-[10px]">{card.lastUsed}</span>
                        </div>
                      </div>
                    </div>

                    {/* Các Thao Tác (ĐÃ BỎ NÚT QUẸT THẺ TRÊN WEB - CHỈ QUẸT VẬT LÝ) */}
                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                      {/* Huy hiệu quẹt trực tiếp tại cửa */}
                      <div
                        className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200/80 flex items-center gap-1 shadow-2xs"
                        title="Chạm trực tiếp thẻ vào đầu đọc trên khóa cửa"
                      >
                        <Radio className="w-3 h-3 text-blue-600" />
                        <span>Chạm trực tiếp vào khóa</span>
                      </div>

                      <button
                        onClick={() => handleStartEdit(card)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title="Đổi tên chủ thẻ"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(card.name)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer"
                        title={isActive ? 'Tạm khóa thẻ này' : 'Kích hoạt lại thẻ'}
                      >
                        {isActive ? (
                          <XCircle className="w-4 h-4 text-amber-500 hover:text-amber-600" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-500 hover:text-emerald-600" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteCard(card.name)}
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Xóa quyền mở cửa của thẻ này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Hướng dẫn an toàn thân thiện */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 flex items-center gap-2.5 mt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                <strong>Bảo vệ an toàn gia đình:</strong> Cửa chỉ mở khi bạn chạm trực tiếp thẻ từ vào khóa cửa nhà, không cho phép mở từ xa qua web.
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
